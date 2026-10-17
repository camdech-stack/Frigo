import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useInventory } from '../lib/InventoryContext'
import ItemForm from './ItemForm'
import QuickAddCard from './QuickAddCard'
import RangementQueue from './RangementQueue'
import ScanPanel from './ScanPanel'

// Vue Ajouter : scan, saisie rapide, mode rangement, formulaire manuel.
// Présentation : panneau plein écran sur téléphone, panneau de 500 px qui glisse depuis la droite
// au-dessus d'un voile sur tablette (DESIGN.md §6.16).
// Elle reste montée (simplement masquée) quand on change de vue : ainsi la carte de saisie
// rapide en cours et le champ de scan ne perdent rien. `active` = vue affichée ; le focus
// automatique du champ de scan n'existe que dans ce cas.
// Ouverture par les boutons « Scanner » / « + » : location.state = { camera } ou { manual }.
export default function AddView({ active, onClose }) {
  const { queue, queueBusy, queueError, addAll, card, setCard, rangement, toggleRangement, keyboard,
    suggestRef, focusScanRef, scanCount, quickAdd, addItem } = useInventory()
  const scanRef = useRef(null) // champ de scan
  const formRef = useRef(null)
  const { state, key } = useLocation()
  const wantCamera = active && state?.camera ? key : null // change à chaque clic sur « Scanner »
  const wantManual = active && state?.manual ? key : null

  useEffect(() => {
    if (!active) return
    focusScanRef.current = () => scanRef.current?.focus()
    if (!wantManual) scanRef.current?.focus()
    return () => { focusScanRef.current = null }
  }, [active, focusScanRef, wantManual])

  // « + » : on arrive directement sur le formulaire manuel.
  useEffect(() => {
    if (!wantManual) return
    const first = formRef.current?.querySelector('input')
    first?.scrollIntoView?.({ block: 'center' })
    first?.focus()
  }, [wantManual])

  useEffect(() => {
    if (!active) return
    const onKey = (e) => { if (e.key === 'Escape' && !document.querySelector('.scanner')) onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [active, onClose])

  return (
    <div className="add-host" hidden={!active}>
      <div className="add-scrim" onClick={onClose} aria-hidden="true" />
      <div className="add-panel" role="region" aria-label="Ajouter un produit">
        <div className="add-head">
          <h2 className="view-title">Ajouter</h2>
          <button type="button" className="icon-btn" aria-label="Fermer" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.4"
              strokeLinecap="round" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <label className="switch">
          <input type="checkbox" role="switch" checked={rangement} onChange={(e) => toggleRangement(e.target.checked)} />
          <span className="switch-track" aria-hidden="true" />
          Mode rangement
        </label>
        <ScanPanel inputRef={scanRef} active={active} keyboard={keyboard} rangement={rangement} blocked={Boolean(card)}
          openCameraKey={wantCamera}
          onQueueScan={queue.scan}
          onEmptyEnter={() => { if (!suggestRef.current) return false; suggestRef.current(); return true }}
          onResult={(r) => setCard({ ...r, id: ++scanCount.current })} />
        {card && (
          <QuickAddCard key={card.id} scan={card} suggestRef={suggestRef} onAdd={quickAdd}
            onCancel={() => { setCard(null); scanRef.current?.focus() }} />
        )}
        {(rangement || queue.rows.length > 0) && (
          <RangementQueue rows={queue.rows} onPatch={queue.patch} onRemove={queue.remove}
            onAddAll={addAll} adding={queueBusy} error={queueError} />
        )}
        <div ref={formRef}>
          <ItemForm onAdd={addItem} onAdded={() => scanRef.current?.focus()} />
        </div>
      </div>
    </div>
  )
}
