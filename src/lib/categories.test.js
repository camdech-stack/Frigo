import { describe, expect, it } from 'vitest'
import { mapCategory } from './categories'
import { CATEGORIES } from './options'

describe('mapCategory', () => {
  it('convertit en:dairies en laitier', () => {
    expect(mapCategory(['en:dairies'])).toBe('laitier')
  })
  it('donne la priorité au tag le plus précis (en fin de liste)', () => {
    expect(mapCategory(['en:groceries', 'en:meals', 'en:pizzas'])).toBe('plats préparés')
    expect(mapCategory(['en:plant-based-foods', 'en:fruits'])).toBe('fruits')
  })
  it('ignore les tags inconnus et retombe sur le premier qui correspond', () => {
    expect(mapCategory(['en:dairies', 'en:truc-inconnu'])).toBe('laitier')
  })
  it('retourne autre sans correspondance ou entrée invalide', () => {
    expect(mapCategory(['en:inconnu'])).toBe('autre')
    expect(mapCategory([])).toBe('autre')
    expect(mapCategory(undefined)).toBe('autre')
  })
  it('ne retourne que des catégories de l\'appli', () => {
    for (const tag of ['en:cheeses', 'en:fishes', 'en:sodas', 'fr:viandes']) {
      expect(CATEGORIES).toContain(mapCategory([tag]))
    }
  })
})
