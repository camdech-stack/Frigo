import { describe, expect, it } from 'vitest'
import { addDays, addMonths, daysBetween, formatDateFr } from './dates'

describe('addDays', () => {
  it('ajoute des jours, y compris à travers mois et années', () => {
    expect(addDays('2026-10-17', 3)).toBe('2026-10-20')
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02')
    expect(addDays('2028-02-27', 2)).toBe('2028-02-29')
  })
  it('ne bouge pas lors d\'un changement d\'heure', () => {
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30')
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26')
  })
  it('accepte un nombre négatif', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
})

describe('addMonths', () => {
  it('ajoute un mois calendaire', () => {
    expect(addMonths('2026-10-17', 1)).toBe('2026-11-17')
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-15')
  })
  it('se cale sur le dernier jour du mois', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29')
    expect(addMonths('2026-03-31', 1)).toBe('2026-04-30')
  })
})

describe('daysBetween', () => {
  it('compte les jours dans les deux sens', () => {
    expect(daysBetween('2026-10-17', '2026-10-24')).toBe(7)
    expect(daysBetween('2026-10-24', '2026-10-17')).toBe(-7)
    expect(daysBetween('2026-10-17', '2026-10-17')).toBe(0)
  })
  it('traverse un changement d\'heure', () => {
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2)
  })
})

describe('formatDateFr', () => {
  it('formate en français', () => {
    expect(formatDateFr('2025-10-21')).toBe('mar. 21 oct.')
  })
})
