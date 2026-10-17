import { useCallback, useEffect, useRef, useState } from 'react'
import { lookupProduct, lookupShelfDays } from './products'
import { addScan, applyHabit, applyLookup, loadQueue, patchRow, removeRow, saveQueue } from './queue'

const newKey = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

// File d'attente du mode rangement, sauvegardée dans localStorage à chaque changement
// (donc restaurée si l'onglet se ferme). rowsRef évite les lectures périmées quand
// plusieurs scans s'enchaînent plus vite qu'un rendu.
export function useRangementQueue() {
  const rowsRef = useRef(null)
  if (rowsRef.current === null) rowsRef.current = loadQueue()
  const [rows, setRows] = useState(rowsRef.current)

  const update = useCallback((fn) => {
    rowsRef.current = fn(rowsRef.current)
    saveQueue(rowsRef.current)
    setRows(rowsRef.current)
  }, [])

  // Une ligne apparaît tout de suite ; le produit est identifié en arrière-plan.
  // Chaque recherche est indépendante : un scan ne peut pas en annuler un autre.
  const scan = useCallback(async (code) => {
    const { rows: next, isNew } = addScan(rowsRef.current, code, newKey())
    update(() => next)
    if (!isNew) {
      // Ligne déjà là : sa durée habituelle a pu changer depuis (ajout fait entre-temps).
      const days = await lookupShelfDays(code)
      update((cur) => applyHabit(cur, code, days))
      return
    }
    const result = await lookupProduct(code)
    update((cur) => applyLookup(cur, code, result))
  }, [update])

  // File restaurée après un rechargement : on relit les durées habituelles, qui ont
  // pu changer depuis la sauvegarde.
  useEffect(() => {
    const codes = [...new Set(rowsRef.current.filter((r) => r.expires_at === null).map((r) => r.barcode))]
    codes.forEach(async (code) => {
      const days = await lookupShelfDays(code)
      update((cur) => applyHabit(cur, code, days))
    })
  }, [update])

  const patch = useCallback((key, p) => update((cur) => patchRow(cur, key, p)), [update])
  const remove = useCallback((key) => update((cur) => removeRow(cur, key)), [update])
  const clear = useCallback(() => update(() => []), [update])

  return { rows, scan, patch, remove, clear }
}
