import { describe, expect, it } from 'vitest'
import { applyChange, sortByExpiry } from './realtime'

const row = (id, expires_at, extra = {}) => ({ id, name: id, expires_at, status: 'in_stock', added_at: '2026-10-01', ...extra })

describe('applyChange', () => {
  it('INSERT ajoute et trie par date de péremption', () => {
    const list = [row('a', '2026-10-10'), row('c', '2026-10-30')]
    const out = applyChange(list, { eventType: 'INSERT', new: row('b', '2026-10-20') })
    expect(out.map((i) => i.id)).toEqual(['a', 'b', 'c'])
  })
  it('INSERT ignore un produit qui n\'est pas en stock', () => {
    const out = applyChange([], { eventType: 'INSERT', new: row('a', '2026-10-10', { status: 'used' }) })
    expect(out).toEqual([])
  })
  it('INSERT d\'un id déjà présent (ajout optimiste) ne crée pas de doublon', () => {
    const list = [row('a', '2026-10-10')]
    const out = applyChange(list, { eventType: 'INSERT', new: row('a', '2026-10-10') })
    expect(out).toHaveLength(1)
  })
  it('UPDATE remplace la ligne et retrie', () => {
    const list = [row('a', '2026-10-10'), row('b', '2026-10-20')]
    const out = applyChange(list, { eventType: 'UPDATE', new: row('a', '2026-10-25', { name: 'Neuf' }) })
    expect(out.map((i) => i.id)).toEqual(['b', 'a'])
    expect(out[1].name).toBe('Neuf')
  })
  it('UPDATE d\'une ligne inconnue l\'ajoute', () => {
    const out = applyChange([], { eventType: 'UPDATE', new: row('a', '2026-10-10') })
    expect(out).toHaveLength(1)
  })
  it('UPDATE vers used/thrown retire le produit', () => {
    const list = [row('a', '2026-10-10'), row('b', '2026-10-20')]
    expect(applyChange(list, { eventType: 'UPDATE', new: row('a', '2026-10-10', { status: 'used' }) }).map((i) => i.id)).toEqual(['b'])
    expect(applyChange(list, { eventType: 'UPDATE', new: row('b', '2026-10-20', { status: 'thrown' }) }).map((i) => i.id)).toEqual(['a'])
  })
  it('UPDATE d\'un produit non présent et non en stock ne fait rien', () => {
    const list = [row('a', '2026-10-10')]
    const out = applyChange(list, { eventType: 'UPDATE', new: row('z', '2026-10-10', { status: 'used' }) })
    expect(out.map((i) => i.id)).toEqual(['a'])
  })
  it('DELETE retire par id (old réduit à l\'id)', () => {
    const list = [row('a', '2026-10-10'), row('b', '2026-10-20')]
    expect(applyChange(list, { eventType: 'DELETE', old: { id: 'a' } }).map((i) => i.id)).toEqual(['b'])
  })
  it('DELETE d\'un id inconnu ou sans old ne casse rien', () => {
    const list = [row('a', '2026-10-10')]
    expect(applyChange(list, { eventType: 'DELETE', old: { id: 'zzz' } })).toHaveLength(1)
    expect(applyChange(list, { eventType: 'DELETE', old: {} })).toHaveLength(1)
  })
  it('ne modifie pas la liste d\'origine', () => {
    const list = [row('a', '2026-10-10')]
    applyChange(list, { eventType: 'DELETE', old: { id: 'a' } })
    expect(list).toHaveLength(1)
  })
})

describe('sortByExpiry', () => {
  it('met les produits sans date à la fin et départage de façon stable', () => {
    const list = [row('x', null), row('b', '2026-10-10'), row('a', '2026-10-10')]
    expect(sortByExpiry(list).map((i) => i.id)).toEqual(['a', 'b', 'x'])
  })
})
