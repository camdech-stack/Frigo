import { describe, expect, it } from 'vitest'
import { cleanBarcode, isStrictBarcode } from './barcode'

describe('cleanBarcode', () => {
  it('accepte un EAN-13 et retire espaces et retours chariot', () => {
    expect(cleanBarcode(' 3017620422003\r\n')).toEqual({ ok: true, code: '3017620422003' })
  })
  it('garde uniquement les chiffres', () => {
    expect(cleanBarcode('30176-2042 2003')).toEqual({ ok: true, code: '3017620422003' })
  })
  it('accepte 8 et 14 chiffres', () => {
    expect(cleanBarcode('12345678').ok).toBe(true)
    expect(cleanBarcode('12345678901234').ok).toBe(true)
  })
  it('refuse trop court, trop long et vide avec un message', () => {
    expect(cleanBarcode('1234567').ok).toBe(false)
    expect(cleanBarcode('123456789012345').ok).toBe(false)
    const empty = cleanBarcode('  ')
    expect(empty.ok).toBe(false)
    expect(empty.error).toMatch(/vide/)
    expect(cleanBarcode('abc').ok).toBe(false)
    expect(cleanBarcode(null).ok).toBe(false)
  })
})

describe('isStrictBarcode', () => {
  it('accepte des chiffres seuls et refuse le reste', () => {
    expect(isStrictBarcode('3017620422003')).toBe(true)
    expect(isStrictBarcode('https://exemple.fr/12345678')).toBe(false)
    expect(isStrictBarcode('1234567')).toBe(false)
  })
})
