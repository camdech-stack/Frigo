import { describe, expect, it } from 'vitest'
import { collapseOk, groupByUrgency, moreLabel, overviewCounts, overviewState } from './overview'

const TODAY = '2025-10-20'
const item = (id, expires_at) => ({ id, expires_at, name: id })

describe('groupByUrgency', () => {
  it('range par seuils : expiré et <= 2 j urgent, <= 5 j bientôt, sinon ça va', () => {
    const g = groupByUrgency([
      item('expire', '2025-10-18'), item('auj', '2025-10-20'), item('j2', '2025-10-22'),
      item('j3', '2025-10-23'), item('j5', '2025-10-25'), item('j6', '2025-10-26'),
    ], TODAY)
    expect(g.urgent.map((i) => i.id)).toEqual(['expire', 'auj', 'j2'])
    expect(g.soon.map((i) => i.id)).toEqual(['j3', 'j5'])
    expect(g.ok.map((i) => i.id)).toEqual(['j6'])
  })
  it('un produit sans date va dans « Ça va »', () => {
    expect(groupByUrgency([item('x', null)], TODAY).ok).toHaveLength(1)
  })
  it('garde l\'ordre reçu', () => {
    const g = groupByUrgency([item('a', '2025-10-19'), item('b', '2025-10-21')], TODAY)
    expect(g.urgent.map((i) => i.id)).toEqual(['a', 'b'])
  })
})

describe('overviewCounts', () => {
  it('compte urgent, bientôt et total', () => {
    const list = [item('a', '2025-10-19'), item('b', '2025-10-24'), item('c', '2025-12-01'), item('d', '2025-12-02')]
    expect(overviewCounts(list, TODAY)).toEqual({ urgent: 1, soon: 1, total: 4 })
  })
})

describe('collapseOk', () => {
  const list = [item('a', '2026-01-01'), item('b', '2026-01-02')]
  it('replié : rien de visible, N cachés', () => {
    expect(collapseOk(list, false)).toEqual({ visible: [], hiddenCount: 2 })
  })
  it('déplié : tout visible', () => {
    expect(collapseOk(list, true)).toEqual({ visible: list, hiddenCount: 0 })
  })
})

describe('libellés et état', () => {
  it('moreLabel gère le pluriel', () => {
    expect(moreLabel(1)).toBe('+ 1 autre produit')
    expect(moreLabel(4)).toBe('+ 4 autres produits')
  })
  it('overviewState', () => {
    expect(overviewState([], TODAY)).toBe('empty')
    expect(overviewState([item('a', '2026-01-01')], TODAY)).toBe('calm')
    expect(overviewState([item('a', '2025-10-20')], TODAY)).toBe('busy')
  })
})
