import { describe, expect, it } from 'vitest'
import { offlineLabel } from './offline'

describe('offlineLabel', () => {
  it('sans donnée connue', () => expect(offlineLabel(null)).toBe('Hors ligne'))
  it('avec une heure HH:MM', () => {
    expect(offlineLabel(new Date(2025, 9, 20, 9, 5).getTime())).toBe('Hors ligne, données de 09:05')
  })
})
