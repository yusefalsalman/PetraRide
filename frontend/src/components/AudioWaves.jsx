/** Live waveform driven by analyser levels (0..1). */
export default function AudioWaves({ levels }) {
  return (
    <div className="flex h-7 items-center gap-1" aria-hidden="true">
      {levels.map((level, i) => (
        <span
          key={i}
          className="w-1 rounded-full bg-petra-600 transition-[height] duration-75"
          style={{ height: `${Math.round(6 + level * 22)}px` }}
        />
      ))}
    </div>
  );
}
