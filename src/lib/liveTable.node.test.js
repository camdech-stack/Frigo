import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyRowChange } from './liveTable.js'

test('insertion, mise à jour sans doublon, suppression', () => {
  let rows = []
  rows = applyRowChange(rows, { eventType: 'INSERT', new: { id: 'a', nom: 'sel' } })
  rows = applyRowChange(rows, { eventType: 'INSERT', new: { id: 'a', nom: 'sel' } }) // écho temps réel
  assert.equal(rows.length, 1)
  rows = applyRowChange(rows, { eventType: 'UPDATE', new: { id: 'a', nom: 'sel fin' } })
  assert.deepEqual(rows, [{ id: 'a', nom: 'sel fin' }])
  rows = applyRowChange(rows, { eventType: 'DELETE', old: { id: 'a' } })
  assert.deepEqual(rows, [])
  assert.deepEqual(applyRowChange(rows, { eventType: 'DELETE', old: {} }), [])
})
