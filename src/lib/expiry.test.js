import { describe, expect, it } from 'vitest'
import { daysLeft, formatDateFr, remainingLabel, todayIso, urgency } from './expiry'

describe('daysLeft', () => {
  it('vaut 0 pour un produit qui expire aujourd\'hui', () => {
    expect(daysLeft('2026-10-16', '2026-10-16')).toBe(0)
  })
  it('compte les jours futurs et passés', () => {
    expect(daysLeft('2026-10-19', '2026-10-16')).toBe(3)
    expect(daysLeft('2026-10-14', '2026-10-16')).toBe(-2)
  })
  it('traverse un changement d\'heure sans décalage', () => {
    expect(daysLeft('2026-10-26', '2026-10-24')).toBe(2)
    expect(daysLeft('2026-03-30', '2026-03-28')).toBe(2)
  })
  it('traverse un changement d\'année', () => {
    expect(daysLeft('2027-01-02', '2026-12-30')).toBe(3)
  })
})

describe('todayIso', () => {
  it('utilise la date locale', () => {
    expect(todayIso(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
})

describe('urgency', () => {
  it('applique les seuils', () => {
    expect(urgency(-3)).toBe('red')
    expect(urgency(0)).toBe('red')
    expect(urgency(2)).toBe('red')
    expect(urgency(3)).toBe('orange')
    expect(urgency(5)).toBe('orange')
    expect(urgency(6)).toBe('green')
  })
})

describe('remainingLabel', () => {
  it('formate en français', () => {
    expect(remainingLabel(-2)).toBe('expiré depuis 2 j')
    expect(remainingLabel(0)).toBe("aujourd'hui")
    expect(remainingLabel(1)).toBe('demain')
    expect(remainingLabel(3)).toBe('dans 3 j')
  })
})

describe('formatDateFr', () => {
  it('formate la date sans décalage', () => {
    expect(formatDateFr('2026-10-21')).toBe('mer. 21 oct.')
  })
})
