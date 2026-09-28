import { useCallback, useEffect, useRef, useState } from 'react';

const SpeechRecognitionImpl =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : undefined;

/** How long to wait for the final result after stop() before giving up. */
const FINALIZE_TIMEOUT_MS = 1500;

/**
 * Live in-browser speech-to-text (Chrome, Edge, Safari) used alongside
 * MediaRecorder. It shows the words as the rider speaks, and gives the
 * on-device matcher a transcript when the backend is offline.
 *
 * `stop()` returns a promise with the final transcript.
 */
export function useSpeechRecognition({ lang = 'ar-JO' } = {}) {
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);

  const recognitionRef = useRef(null);
  const finalRef = useRef('');
  const interimRef = useRef('');
  const endWaitersRef = useRef([]);

  const current = () => `${finalRef.current} ${interimRef.current}`.replace(/\s+/g, ' ').trim();

  const flushWaiters = useCallback(() => {
    const text = current();
    endWaitersRef.current.forEach((resolve) => resolve(text));
    endWaitersRef.current = [];
  }, []);

  const start = useCallback(() => {
    if (!SpeechRecognitionImpl || recognitionRef.current) return false;
    finalRef.current = '';
    interimRef.current = '';
    setTranscript('');

    const recognition = new SpeechRecognitionImpl();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalRef.current = `${finalRef.current} ${text}`;
        else interim += text;
      }
      interimRef.current = interim;
      setTranscript(current());
    };
    recognition.onerror = () => {
      // 'no-speech', 'not-allowed', 'network'... the recording still goes on;
      // an empty transcript is handled downstream.
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
      flushWaiters();
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setListening(true);
      return true;
    } catch {
      return false;
    }
  }, [lang, flushWaiters]);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return Promise.resolve(current());
    return new Promise((resolve) => {
      endWaitersRef.current.push(resolve);
      setTimeout(flushWaiters, FINALIZE_TIMEOUT_MS);
      try {
        recognition.stop();
      } catch {
        flushWaiters();
      }
    });
  }, [flushWaiters]);

  const abort = useCallback(() => {
    try {
      recognitionRef.current?.abort();
    } catch {
      /* already stopped */
    }
    recognitionRef.current = null;
    setListening(false);
  }, []);

  /** Lets the simulated microphone drive the same live transcript UI. */
  const setSimulatedTranscript = useCallback((text) => {
    finalRef.current = text;
    interimRef.current = '';
    setTranscript(text);
  }, []);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  return { supported: Boolean(SpeechRecognitionImpl), transcript, listening, start, stop, abort, setSimulatedTranscript };
}
