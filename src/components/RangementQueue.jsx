import { canAddAll } from '../lib/queue'
import QueueRow from './QueueRow'

// File d'attente du mode rangement, affichée sous le champ de scan.
export default function RangementQueue({ rows, onPatch, onRemove, onAddAll, adding, error }) {
  if (rows.length === 0) {
    return <p className="empty">Mode rangement : scanne les produits, ils s'ajoutent ici.</p>
  }
  const pending = rows.some((r) => r.lookup === 'pending')
  const unnamed = rows.some((r) => r.lookup !== 'pending' && !r.name.trim())
  return (
    <section className="panel" aria-label="File de rangement">
      <h2>À ranger ({rows.length})</h2>
      <ul className="queue">
        {rows.map((row) => <QueueRow key={row.key} row={row} onPatch={onPatch} onRemove={onRemove} />)}
      </ul>
      {unnamed && <p className="notice">Complète le nom des produits marqués « À compléter ».</p>}
      {pending && <p className="notice" role="status">Recherche des produits en cours…</p>}
      {error && <p className="error" role="alert">{error}</p>}
      <button type="button" className="btn btn-primary" disabled={!canAddAll(rows) || adding} onClick={onAddAll}>
        {adding ? 'Ajout…' : `Tout ajouter (${rows.length})`}
      </button>
    </section>
  )
}
