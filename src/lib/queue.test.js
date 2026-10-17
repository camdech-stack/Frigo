import { describe, expect, it } from 'vitest'
import { addScan, applyHabit, applyLookup, canAddAll, loadQueue, patchRow, removeRow, rowDate, rowsToItems, saveQueue } from './queue'

const memory = () => {
  const data = {}
  return { getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v } }
}
const found = { status: 'found', shelfDays: 9, product: { name: 'Yaourt', brand: 'Bio', category: 'laitier', image_url: '' } }

describe('addScan', () => {
  it('crée une ligne en recherche', () => {
    const { rows, isNew } = addScan([], '123', 'k1')
    expect(isNew).toBe(true)
    expect(rows[0]).toMatchObject({ barcode: '123', quantity: 1, lookup: 'pending', expires_at: null })
  })
  it('même code-barres : quantité +1, pas de nouvelle ligne', () => {
    const first = addScan([], '123', 'k1').rows
    const { rows, isNew } = addScan(first, '123', 'k2')
    expect(isNew).toBe(false)
    expect(rows).toHaveLength(1)
    expect(rows[0].quantity).toBe(2)
  })
})

describe('applyLookup', () => {
  it('remplit la ligne trouvée et mémorise la durée habituelle', () => {
    const rows = applyLookup(addScan([], '123', 'k1').rows, '123', found)
    expect(rows[0]).toMatchObject({ name: 'Yaourt', brand: 'Bio', category: 'laitier', cachedDays: 9, lookup: 'done', needsName: false })
  })
  it('produit inconnu : nom vide à compléter', () => {
    const rows = applyLookup(addScan([], '123', 'k1').rows, '123', { status: 'notfound' })
    expect(rows[0]).toMatchObject({ name: '', needsName: true, lookup: 'done' })
  })
  it('ne remplace pas un nom déjà tapé', () => {
    let rows = addScan([], '123', 'k1').rows
    rows = patchRow(rows, 'k1', { name: 'Mon nom' })
    expect(applyLookup(rows, '123', found)[0].name).toBe('Mon nom')
  })
})

describe('canAddAll', () => {
  it('exige des lignes nommées et sans recherche en cours', () => {
    expect(canAddAll([])).toBe(false)
    const pending = addScan([], '123', 'k1').rows
    expect(canAddAll(pending)).toBe(false)
    const unknown = applyLookup(pending, '123', { status: 'notfound' })
    expect(canAddAll(unknown)).toBe(false)
    expect(canAddAll(patchRow(unknown, 'k1', { name: ' ' }))).toBe(false)
    expect(canAddAll(patchRow(unknown, 'k1', { name: 'Pain' }))).toBe(true)
  })
})

describe('rowsToItems', () => {
  it('utilise la date choisie, sinon la suggestion', () => {
    let rows = applyLookup(addScan([], '123', 'k1').rows, '123', found) // habituel 9 j
    expect(rowDate(rows[0], '2026-10-17')).toBe('2026-10-26')
    rows = patchRow(rows, 'k1', { expires_at: '2026-11-01', quantity: 3 })
    const [item] = rowsToItems(rows, '2026-10-17')
    expect(item).toMatchObject({ name: 'Yaourt', barcode: '123', quantity: 3, unit: 'pièce', expires_at: '2026-11-01', location: 'frigo' })
  })
  it('retire une ligne', () => {
    const rows = addScan([], '123', 'k1').rows
    expect(removeRow(rows, 'k1')).toEqual([])
  })
})

describe('sauvegarde', () => {
  it('restaure la file (recherche interrompue = nom à compléter)', () => {
    const storage = memory()
    saveQueue(addScan([], '123', 'k1').rows, storage)
    const restored = loadQueue(storage)
    expect(restored[0]).toMatchObject({ barcode: '123', lookup: 'done', needsName: true })
  })
  it('tolère un contenu illisible', () => {
    const storage = memory()
    storage.setItem('frigo.rangementQueue', '{pas du json')
    expect(loadQueue(storage)).toEqual([])
  })
})

describe('applyHabit', () => {
  it('rafraîchit la durée habituelle d\'une ligne déjà identifiée', () => {
    const rows = applyLookup(addScan([], '123', 'k1').rows, '123', found)
    expect(applyHabit(rows, '123', 14)[0].cachedDays).toBe(14)
    expect(applyHabit(rows, '123', null)[0].cachedDays).toBe(9)
  })
})
