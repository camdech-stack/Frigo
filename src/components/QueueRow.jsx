import { LOCATIONS } from '../lib/options'
import { rowDate, rowSuggestion } from '../lib/queue'
import { formatDateFr } from '../lib/dates'
import CategoryTile from './CategoryTile'
import QuantityStepper from './QuantityStepper'
import QuickDateButtons from './QuickDateButtons'
import SuggestionNote from './SuggestionNote'

// Une ligne de la file de rangement. Cadre épais et mention « À compléter » tant que le nom manque.
export default function QueueRow({ row, onPatch, onRemove }) {
  const pending = row.lookup === 'pending'
  const missingName = !pending && !row.name.trim()
  const date = rowDate(row)
  const touched = row.expires_at !== null
  const suggestion = rowSuggestion(row)

  return (
    <li className={'queue-row' + (missingName ? ' unknown' : '')}>
      <div className="queue-head">
        <CategoryTile category={row.category} />
        <div className="item-info">
          {pending ? <strong>Recherche du produit…</strong>
            : row.needsName ? (
              <input className="field" value={row.name} onChange={(e) => onPatch(row.key, { name: e.target.value })}
                placeholder="Nom du produit (à compléter)" aria-label="Nom du produit" />
            ) : <strong>{row.name}</strong>}
          {row.brand && <span className="brand">{row.brand}</span>}
          <span className="barcode-line">{row.barcode}</span>
        </div>
        <button type="button" className="icon-btn remove" aria-label={`Retirer ${row.name || row.barcode}`}
          onClick={() => onRemove(row.key)}>✕</button>
      </div>
      {missingName && <p className="to-complete">À compléter : le nom du produit</p>}

      <div className="quick-line">
        <QuantityStepper value={row.quantity} label="Quantité" onChange={(q) => onPatch(row.key, { quantity: q })} />
        <select className="field" value={row.location} aria-label="Emplacement"
          onChange={(e) => onPatch(row.key, { location: e.target.value })}>
          {LOCATIONS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
      </div>

      <p className="queue-date">
        <strong>{formatDateFr(date)}</strong>
        {!touched && <SuggestionNote source={suggestion.source} category={row.category} days={suggestion.days} />}
      </p>
      <QuickDateButtons compact selectedDate={date}
        onPick={(d) => onPatch(row.key, { expires_at: d })}
        onExact={(d) => onPatch(row.key, { expires_at: d })} />
    </li>
  )
}
