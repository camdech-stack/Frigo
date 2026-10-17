import { useEffect, useRef } from 'react'
import { useInventory } from '../lib/InventoryContext'
import ItemForm from './ItemForm'
import QuickAddCard from './QuickAddCard'
import RangementQueue from './RangementQueue'
import ScanPanel from './ScanPanel'

// Vue Ajouter : scan, saisie rapide, mode rangement, formulaire manuel.
// Elle reste montée (simplement masquée) quand on change de vue : ainsi la carte de saisie
// rapide en cours et le champ de scan ne perdent rien. `active` = vue affichée ; le focus
// automatique du champ de scan n'existe que dans ce cas.
export default function AddView({ active }) {
  const { queue, queueBusy, queueError, addAll, card, setCard, rangement, toggleRangement, keyboard,
    suggestRef, focusScanRef, scanCount, quickAdd, addItem } = useInventory()
  const scanRef = useRef(null) // champ de scan

  useEffect(() => {
    if (!active) return
    focusScanRef.current = () => scanRef.current?.focus()
    scanRef.current?.focus()
    return () => { focusScanRef.current = null }
  }, [active, focusScanRef])

  return (
    <div hidden={!active}>
      <h2 className="view-title">Ajouter</h2>
      <label className="switch">
        <input type="checkbox" role="switch" checked={rangement} onChange={(e) => toggleRangement(e.target.checked)} />
        <span className="switch-track" aria-hidden="true" />
        Mode rangement
      </label>
      <ScanPanel inputRef={scanRef} active={active} keyboard={keyboard} rangement={rangement} blocked={Boolean(card)}
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
      <ItemForm onAdd={addItem} onAdded={() => scanRef.current?.focus()} />
    </div>
  )
}
