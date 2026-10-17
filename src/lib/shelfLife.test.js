import { describe, expect, it } from 'vitest'
import { chooseShelfDays, needsPackagingCheck, sourceLabel } from './shelfLife'
import { durationOptions, shelfDaysToRemember, suggestFor } from './quickAdd'

describe('chooseShelfDays', () => {
  it('le cache (durée habituelle) passe avant tout', () => {
    expect(chooseShelfDays({ cachedDays: 12, location: 'congélo', category: 'viande' }))
      .toEqual({ days: 12, source: 'habituel' })
  })
  it('l\'emplacement passe avant la catégorie', () => {
    expect(chooseShelfDays({ location: 'congélo', category: 'laitier' })).toEqual({ days: 90, source: 'estimation' })
    expect(chooseShelfDays({ location: 'placard', category: 'viande' })).toEqual({ days: 180, source: 'estimation' })
  })
  it('sinon la catégorie, avec « autre » en repli', () => {
    expect(chooseShelfDays({ location: 'frigo', category: 'laitier' }).days).toBe(10)
    expect(chooseShelfDays({ location: 'frigo', category: 'poisson' }).days).toBe(2)
    expect(chooseShelfDays({ location: 'frigo', category: 'inconnue' }).days).toBe(7)
  })
  it('ignore un cache invalide', () => {
    expect(chooseShelfDays({ cachedDays: 0, location: 'frigo', category: 'fruits' }).days).toBe(7)
    expect(chooseShelfDays({ cachedDays: null, location: 'frigo', category: 'légumes' }).days).toBe(5)
  })
})

describe('étiquettes', () => {
  it('rappelle l\'emballage pour viande, poisson, plats préparés', () => {
    expect(needsPackagingCheck('viande')).toBe(true)
    expect(needsPackagingCheck('plats préparés')).toBe(true)
    expect(needsPackagingCheck('laitier')).toBe(false)
  })
  it('libellés de transparence', () => {
    expect(sourceLabel('habituel')).toBe('habituel pour ce produit')
    expect(sourceLabel('estimation')).toBe('estimation')
  })
})

describe('quickAdd', () => {
  it('calcule les 4 dates des boutons', () => {
    const o = durationOptions('2026-01-31')
    expect(o.map((x) => x.date)).toEqual(['2026-02-03', '2026-02-07', '2026-02-14', '2026-02-28'])
    expect(o[0].label).toBe('+3 j')
  })
  it('suggère une date à partir de la durée choisie', () => {
    expect(suggestFor({ location: 'frigo', category: 'laitier' }, '2026-10-17'))
      .toMatchObject({ date: '2026-10-27', days: 10, source: 'estimation' })
  })
  it('mémorise la durée seulement si positive', () => {
    expect(shelfDaysToRemember('2026-10-24', '2026-10-17')).toBe(7)
    expect(shelfDaysToRemember('2026-10-17', '2026-10-17')).toBeNull()
    expect(shelfDaysToRemember('2026-10-10', '2026-10-17')).toBeNull()
    expect(shelfDaysToRemember('', '2026-10-17')).toBeNull()
  })
})
