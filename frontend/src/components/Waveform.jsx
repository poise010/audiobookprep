// On-theme audio-level meter used as the "generating" loader.
export default function Waveform({ className = '' }) {
  return (
    <div className={`waveform ${className}`} aria-hidden="true">
      <span /><span /><span /><span /><span />
    </div>
  )
}
