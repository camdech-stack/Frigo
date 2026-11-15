import { test } from 'node:test'
import assert from 'node:assert/strict'
import { matchIngredient, normalizeName, searchByName, suggestIngredient } from './matchIngredient.js'

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

// ---- Suggestion pour un produit du commerce ----
const shop = ['crème fraîche', 'crème liquide', 'courgette', 'spaghetti', 'pâtes', 'lait', 'lait de coco']
  .map((nom, i) => ({ id: String(i), nom }))
const suggest = (name, brand) => suggestIngredient(name, shop, { brand })?.ingredient.nom ?? null

test('produit : marque, pourcentage et mentions ignorés', () => {
  assert.equal(suggest('Crème fraîche épaisse 30% MG Président'), 'crème fraîche')
  assert.equal(suggest('Courgettes bio'), 'courgette')
  assert.equal(suggest('Spaghetti n°5 Panzani'), 'spaghetti')
})
test('produit : le plus précis gagne', () => {
  assert.equal(suggest('Lait de coco Cic'), 'lait de coco')
  assert.equal(suggest('Lait demi-écrémé 1 L'), 'lait')
})
test('produit : la marque n\'est pas un ingrédient', () => {
  assert.equal(suggest('Biscuits Lait Lu', 'Lait'), null)
})
test('produit : aucune suggestion sans correspondance', () => {
  assert.equal(suggest('Nutella 750 g Ferrero'), null)
  assert.equal(suggest(''), null)
})
