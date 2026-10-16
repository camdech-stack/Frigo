const LABELS = { live: 'en direct', reconnecting: 'reconnexion…', offline: 'hors ligne' }

// Petit indicateur discret de l'état du temps réel. Purement informatif.
export default function ConnectionDot({ state }) {
  return (
    <span className={`conn ${state}`} role="status" aria-live="polite">
      <span className="conn-dot" aria-hidden="true" />{LABELS[state]}
    </span>
  )
}
