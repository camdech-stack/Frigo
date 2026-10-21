import { test } from 'node:test'
import assert from 'node:assert/strict'
import { matchIngredient, normalizeName, searchByName } from './matchIngredient.js'

const catalog = ['courgette', 'crème fraîche', 'crème liquide', 'oeuf', 'ail', 'pomme de terre', 'sel', 'poivre']
  .map((nom, i) => ({ id: String(i), nom }))
const nom = (name) => matchIngredient(name, catalog)?.ingredient.nom ?? null

test('normalisation : accents, majuscules, ligature, pluriel', () => {
  assert.equal(normalizeName('Crème Fraîche'), 'creme fraiche')
  assert.equal(normalizeName('Œufs'), 'oeuf')
  assert.equal(normalizeName("gousses d'ail"), 'gousse ail')
})
test('singulier/pluriel et accents', () => {
  assert.equal(nom('courgettes'), 'courgette')
  assert.equal(nom('Oeufs'), 'oeuf')
  assert.equal(nom('pommes de terre'), 'pomme de terre')
})
test('mots en commun', () => {
  assert.equal(nom('crème fraîche épaisse'), 'crème fraîche')
  assert.equal(nom('crème liquide'), 'crème liquide')
})
test('aucun rapprochement', () => {
  assert.equal(nom('sauce soja'), null)
  assert.equal(nom(''), null)
})
test('recherche dans une liste', () => {
  assert.deepEqual(searchByName('cour', catalog).map((x) => x.nom), ['courgette'])
  assert.deepEqual(searchByName('creme', catalog).map((x) => x.nom), ['crème fraîche', 'crème liquide'])
  assert.equal(searchByName('', catalog).length, catalog.length)
})
