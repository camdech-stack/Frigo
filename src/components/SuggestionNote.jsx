import { needsPackagingCheck, sourceLabel } from '../lib/shelfLife'

// Transparence sur la date suggérée : d'où elle vient, et rappel d'emballage
// pour les produits sensibles. Une suggestion ne remplace jamais la date imprimée.
export default function SuggestionNote({ source, category }) {
  return (
    <>
      <span className={'tag ' + source}>{sourceLabel(source)}</span>
      {needsPackagingCheck(category) && <small className="packaging">vérifie la date sur l'emballage</small>}
    </>
  )
}
