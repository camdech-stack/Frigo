import { badgeParts, urgency } from '../lib/expiry'

// Pastille carrée de péremption (DESIGN.md §6.5) : statut en couleur + chiffre et unité en texte.
// `days` = jours restants (null = produit sans date : pastille neutre).
export default function ExpiryBadge({ days, size = '' }) {
  if (days === null || days === undefined || !Number.isFinite(days)) {
    return <span className={'badge none ' + size}><span className="badge-num">–</span><span className="badge-unit">sans date</span></span>
  }
  const { num, unit, expired } = badgeParts(days)
  return (
    <span className={`badge ${urgency(days)} ${size}` + (expired ? ' expired' : '')}>
      <span className="badge-num">{num}</span><span className="badge-unit">{unit}</span>
    </span>
  )
}
