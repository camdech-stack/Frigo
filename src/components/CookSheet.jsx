import { useEffect, useMemo, useRef, useState } from 'react'
import { changements, decompte } from '../lib/cook'
import { daysLeft } from '../lib/expiry'
import { formatQuantity } from '../lib/recipes'
import ExpiryBadge from './ExpiryBadge'

const round = (n) => Math.round(n * 1000) / 1000

// Écran de confirmation « J'ai cuisiné » : prélèvements proposés (quantité modifiable, case décochable),
// produits à renseigner à la main, puis « Pas trouvés dans le frigo ». Rien n'est écrit avant « Valider ».
// onConfirm(changes) retourne un message d'erreur ou null (alors l'écran se ferme).
export default function CookSheet({ entry, recette, stock, onConfirm, onClose }) {
  const closeRef = useRef(null)
  const [valeurs, setValeurs] = useState({}) // key -> quantité saisie (texte)
  const [decoches, setDecoches] = useState(() => new Set())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const { prelevements, absents } = useMemo(() => decompte(entry, recette, stock), [entry, recette, stock])
  const changes = useMemo(() => changements(prelevements, stock, { valeurs, decoches }), [prelevements, stock, valeurs, decoches])
  const valeur = (p) => (p.key in valeurs ? valeurs[p.key] : p.quantite ?? '')
  const toggle = (key) => setDecoches((s) => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n })

  // Quantité restante affichée sous chaque ligne (d'après ce qui est saisi, bornée au stock).
  const restant = (p) => {
    const n = Number(String(valeur(p)).replace(',', '.'))
    const item = stock.find((i) => i.id === p.item_id)
    if (!item || !(n > 0) || decoches.has(p.key)) return null
    return Math.max(0, round(Number(item.quantity) - n))
  }

  async function valider() {
    if (busy) return
    setBusy(true)
    setError('')
    const message = await onConfirm(changes)
    setBusy(false)
    if (message) return setError(message)
    onClose()
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet cook-sheet" role="dialog" aria-modal="true" aria-label={`Cuisiner ${recette.titre}`} onClick={(e) => e.stopPropagation()}>
        <h3 className="sheet-title">{recette.titre}</h3>
        <p className="sheet-info">Pour {entry.personnes} personne{entry.personnes > 1 ? 's' : ''}. Vérifie ce qui sera retiré du frigo.</p>

        {prelevements.length === 0 ? (
          <p className="hint">Aucun produit à décompter.</p>
        ) : (
          <ul className="cook-list" aria-label="Produits à décompter">
            {prelevements.map((p) => {
              const item = stock.find((i) => i.id === p.item_id)
              const reste = restant(p)
              const off = decoches.has(p.key)
              return (
                <li key={p.key} className={'cook-row' + (off ? ' off' : '')}>
                  <label className="cook-check">
                    <input type="checkbox" checked={!off} onChange={() => toggle(p.key)} aria-label={`Décompter ${p.nomProduit}`} />
                    <span className="row-main">
                      <strong className="row-name">{p.nomProduit}</strong>
                      <span className="row-detail">
                        {item ? `${formatQuantity(item.quantity, p.unite)} en stock` : 'plus en stock'}
                        {!p.auto && ' · à renseigner (unité différente ou quantité absente)'}
                      </span>
                    </span>
                    {p.expires_at && <ExpiryBadge days={daysLeft(p.expires_at)} />}
                  </label>
                  <div className="cook-qty">
                    <input className="field" type="number" inputMode="decimal" min="0" step="any" disabled={off}
                      aria-label={`Quantité de ${p.nomProduit} en ${p.unite}`} placeholder="à remplir"
                      value={valeur(p)} onChange={(e) => setValeurs((v) => ({ ...v, [p.key]: e.target.value }))} />
                    <span className="cook-unit">{p.unite}</span>
                  </div>
                  {reste !== null && <p className="hint">Il restera {formatQuantity(reste, p.unite)}{reste === 0 && ' (le produit sera marqué utilisé)'}.</p>}
                  {p.manque && <p className="hint">Il manque {formatQuantity(p.manque.quantite, p.manque.unite)} : stock insuffisant.</p>}
                </li>
              )
            })}
          </ul>
        )}

        {absents.length > 0 && (
          <section aria-label="Pas trouvés dans le frigo">
            <h4 className="recipe-title">Pas trouvés dans le frigo</h4>
            <ul className="menu-pills">
              {absents.map((a) => (
                <li key={a.ingredient_id + (a.nom ?? '')} className="menu-pill missing">
                  {a.quantite == null ? a.nom : `${a.nom} (${formatQuantity(a.quantite, a.unite)})`}
                </li>
              ))}
            </ul>
            <button type="button" className="btn btn-secondary" disabled title="Disponible à l'étape 8">Ajouter aux courses</button>
          </section>
        )}

        {error && <p className="error" role="alert">{error}</p>}
        <div className="sheet-actions">
          <button type="button" className="btn btn-primary" disabled={busy} onClick={valider}>
            {busy ? 'Enregistrement…' : 'Valider'}
          </button>
          <button type="button" ref={closeRef} className="btn btn-secondary" disabled={busy} onClick={onClose}>Annuler</button>
        </div>
      </div>
    </div>
  )
}
