import { useCallback, useEffect, useRef, useState } from 'react';
import { MAX_RECORDING_MS, MIN_RECORDING_MS } from '../config';

const BAR_COUNT = 7;
const SILENT_LEVELS = Array(BAR_COUNT).fill(0.08);

const PREFERRED_MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/wav'];

function pickMimeType() {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return '';
  return PREFERRED_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) || '';
}

function describeError(err) {
  switch (err?.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Microphone access was blocked. Allow it in your browser settings, or try a demo phrase.';
    case 'NotFoundError':
      return 'No microphone was found on this device.';
    case 'NotReadableError':
      return 'Your microphone is being used by another app.';
    default:
      return err?.message || 'Could not start recording.';
  }
}

/**
 * Push-to-talk recorder built on MediaRecorder + Web Audio.
 *
 * - `start()` asks for the mic and begins recording.
 * - `stop()` finishes and calls `onComplete(blob)`.
 * - `cancel()` discards the recording.
 * - `levels` is an array of 0..1 amplitudes for the live waveform.
 */
export function useVoiceRecorder({ onComplete, onError } = {}) {
  const [status, setStatus] = useState('idle'); // idle | requesting | recording
  const [levels, setLevels] = useState(SILENT_LEVELS);
  const [elapsedMs, setElapsedMs] = useState(0);

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const rafRef = useRef(null);
  const chunksRef = useRef([]);
  const startedAtRef = useRef(0);
  const autoStopRef = useRef(null);
  const cancelledRef = useRef(false);

  // Keep the latest callbacks without re-creating start/stop.
  const callbacksRef = useRef({ onComplete, onError });
  callbacksRef.current = { onComplete, onError };

  const teardown = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    clearTimeout(autoStopRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    recorderRef.current = null;
    setLevels(SILENT_LEVELS);
    setElapsedMs(0);
    setStatus('idle');
  }, []);

  const startMeter = useCallback((stream) => {
    const AudioContextImpl = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextImpl) return;

    const ctx = new AudioContextImpl();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.7;
    ctx.createMediaStreamSource(stream).connect(analyser);
    audioCtxRef.current = ctx;

    const data = new Uint8Array(analyser.frequencyBinCount);
    const bucket = Math.floor(data.length / BAR_COUNT) || 1;

    const tick = () => {
      analyser.getByteFrequencyData(data);
      const next = Array.from({ length: BAR_COUNT }, (_, i) => {
        let sum = 0;
        for (let j = 0; j < bucket; j += 1) sum += data[i * bucket + j] || 0;
        return Math.max(0.08, Math.min(1, sum / bucket / 180));
      });
      setLevels(next);
      setElapsedMs(Date.now() - startedAtRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    stop();
    if (!recorderRef.current) teardown();
  }, [stop, teardown]);

  const start = useCallback(async () => {
    if (recorderRef.current) return;

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      callbacksRef.current.onError?.('Voice recording is not supported in this browser. Try a demo phrase instead.');
      return;
    }

    setStatus('requesting');
    cancelledRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
      });
      streamRef.current = stream;

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const duration = Date.now() - startedAtRef.current;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType || 'audio/webm' });
        const wasCancelled = cancelledRef.current;
        teardown();

        if (wasCancelled) return;
        if (duration < MIN_RECORDING_MS || blob.size === 0) {
          callbacksRef.current.onError?.('That was too short — tap the mic and say where you want to go.');
          return;
        }
        callbacksRef.current.onComplete?.(blob);
      };

      startedAtRef.current = Date.now();
      recorder.start(250);
      setStatus('recording');
      startMeter(stream);
      autoStopRef.current = setTimeout(stop, MAX_RECORDING_MS);
    } catch (err) {
      teardown();
      callbacksRef.current.onError?.(describeError(err));
    }
  }, [startMeter, stop, teardown]);

  // Release the microphone if the component unmounts mid-recording.
  useEffect(
    () => () => {
      cancelledRef.current = true;
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      cancelAnimationFrame(rafRef.current);
      clearTimeout(autoStopRef.current);
    },
    [],
  );

  return { status, levels, elapsedMs, start, stop, cancel, maxMs: MAX_RECORDING_MS };
}
