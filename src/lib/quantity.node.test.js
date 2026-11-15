import { test } from 'node:test'
import assert from 'node:assert/strict'
import { consume, halfOf, parseOffQuantity, toStockUnit } from './quantity.js'

test('conversions vers g, ml, pièce', () => {
  assert.deepEqual(toStockUnit(2, 'kg'), { quantity: 2000, unit: 'g' })
  assert.deepEqual(toStockUnit(1.5, 'L'), { quantity: 1500, unit: 'ml' })
  assert.deepEqual(toStockUnit(33, 'cL'), { quantity: 330, unit: 'ml' })
  assert.deepEqual(toStockUnit(250, 'mL'), { quantity: 250, unit: 'ml' })
  assert.deepEqual(toStockUnit(3, 'paquet'), { quantity: 3, unit: 'pièce' })
  assert.equal(toStockUnit(1, 'furlong'), null)
})
test('quantité Open Food Facts', () => {
  assert.deepEqual(parseOffQuantity('500 g'), { quantity: 500, unit: 'g' })
  assert.deepEqual(parseOffQuantity('1 kg'), { quantity: 1000, unit: 'g' })
  assert.deepEqual(parseOffQuantity('1,5 L'), { quantity: 1500, unit: 'ml' })
  assert.deepEqual(parseOffQuantity('75cl'), { quantity: 750, unit: 'ml' })
  assert.deepEqual(parseOffQuantity('4 x 125 g'), { quantity: 500, unit: 'g' })
  assert.equal(parseOffQuantity('6 yaourts'), null)
  assert.equal(parseOffQuantity(''), null)
  assert.equal(parseOffQuantity(undefined), null)
})
test('consommation partielle', () => {
  assert.deepEqual(consume(500, 200), { consumed: 200, remaining: 300 })
  assert.deepEqual(consume(2, 5), { consumed: 2, remaining: 0 }) // plus que le stock : borné
  assert.deepEqual(consume(0.3, 0.1), { consumed: 0.1, remaining: 0.2 })
  assert.equal(consume(5, 0), null)
  assert.equal(consume(5, 'abc'), null)
  assert.equal(halfOf(500), 250)
  assert.equal(halfOf(3), 1.5)
})
