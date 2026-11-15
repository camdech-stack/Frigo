// Menu calculé par l'app (étape 6c) : fonctions pures, sans IA, sans accès à la base.
// Entrées : recettes mises à plat (voir toRecette) et stock = produits `in_stock`.
// Un produit du stock : { id, name, ingredient_id, quantity, unit, expires_at }.

import { daysLeft, todayIso } from './expiry.js'
import { formatQuantity } from './recipes.js'

// ---- Réglages (pondérations et bornes) : à modifier ici seulement ---------------------------
export const MAX_MANQUANTS_RESTE = 2 // mode reste : 2 ingrédients manquants au plus
export const LIMITE_RESTE = 5 // mode reste : nombre maximum de propositions
export const POIDS_MANQUANT = 1.5 // mode planifier : points retirés par ingrédient manquant
export const MALUS_ETIQUETTE = 2 // mode planifier : points retirés si l'étiquette principale est déjà prise
export const ETIQUETTES_PRINCIPALES = ['pates', 'riz', 'poulet', 'boeuf', 'poisson', 'soupe', 'vege']
export const REPAS_MIN = 3
export const REPAS_MAX = 7
export const REPAS_DEFAUT = 5
export const PERSONNES_DEFAUT = 2

const EPS = 1e-9
const round = (n) => Math.round(n * 1000) / 1000

// Urgence d'un produit (CLAUDE.md) : 3 si périmé ou ≤ 2 j, 2 si ≤ 5 j, 1 sinon (ou sans date).
export function urgenceJours(jours) {
  if (jours === null || jours === undefined) return 1
  if (jours <= 2) return 3
  if (jours <= 5) return 2
  return 1
}

// Recette de la base + ses lignes -> forme utilisée ici, avec le nom et le caractère « basique » de chaque ingrédient.
export function toRecette(recipe, lines, ingredientsById) {
  return {
    id: recipe.id, titre: recipe.titre, url: recipe.url, source: recipe.source,
    portions: recipe.portions, temps_min: recipe.temps_min, tags: recipe.tags ?? [],
    lignes: lines.map((l) => {
      const ing = ingredientsById.get(l.ingredient_id)
      return {
        ingredient_id: l.ingredient_id, nom: ing?.nom ?? '?', basique: Boolean(ing?.basique),
        quantite: l.quantite == null ? null : Number(l.quantite), unite: l.unite ?? null,
      }
    }),
  }
}

// Besoins pour `personnes` : quantité × (personnes / portions), lignes basiques exclues.
export function besoins(recette, personnes) {
  const facteur = recette.portions > 0 ? personnes / recette.portions : 1
  return recette.lignes
    .filter((l) => !l.basique)
    .map((l) => ({
      ingredient_id: l.ingredient_id, nom: l.nom, unite: l.unite ?? null,
      quantite: l.quantite == null ? null : round(l.quantite * facteur),
    }))
}

// Produit qui périme le plus tôt d'abord (sans date en dernier), puis par id pour un ordre stable.
function parPeremption(a, b) {
  const ea = a.expires_at ?? '9999-12-31'
  const eb = b.expires_at ?? '9999-12-31'
  return ea < eb ? -1 : ea > eb ? 1 : String(a.id).localeCompare(String(b.id))
}

// Couverture d'une recette par le stock. Retourne :
//  lignes       : une par besoin, avec etat 'couvert' | 'partiel' | 'absent'
//  manque       : [{ ingredient_id, nom, quantite, unite, etat }] (lignes partielles + absentes ; quantite = ce qui manque)
//  utilise      : produits consommés [{ item_id, nom, nomProduit, jours, urgence, quantite, unite, partiel, compte }]
//                 `compte` = leur urgence compte dans le score (ligne couverte et produit pas déjà compté ailleurs)
//  urgence      : somme des urgences des produits comptés
//  consommation : Map item_id -> quantité retirée du stock (pour la suite d'un menu)
// `claimed` : ids des produits déjà comptés par une recette précédente du menu (jamais compté deux fois).
export function couverture(recette, personnes, stock, { today = todayIso(), claimed = new Set() } = {}) {
  const restes = new Map(stock.map((i) => [i.id, Number(i.quantity)]))
  const parIngredient = new Map()
  for (const item of [...stock].sort(parPeremption)) {
    if (!item.ingredient_id) continue
    if (!parIngredient.has(item.ingredient_id)) parIngredient.set(item.ingredient_id, [])
    parIngredient.get(item.ingredient_id).push(item)
  }

  const lignes = []
  const consommation = new Map()
  const utilises = new Map() // item_id -> entrée `utilise`

  function noter(item, besoin, quantite, partiel) {
    const deja = utilises.get(item.id)
    if (deja) {
      deja.quantite = quantite == null || deja.quantite == null ? deja.quantite ?? quantite : round(deja.quantite + quantite)
      deja.partiel = deja.partiel && partiel
      return
    }
    const jours = item.expires_at ? daysLeft(item.expires_at, today) : null
    utilises.set(item.id, {
      item_id: item.id, nom: besoin.nom, nomProduit: item.name ?? besoin.nom, jours, urgence: urgenceJours(jours),
      quantite, unite: quantite == null ? null : item.unit, partiel, compte: false,
    })
  }

  for (const b of besoins(recette, personnes)) {
    // Produits de cet ingrédient encore disponibles, le plus pressé en premier.
    const items = (parIngredient.get(b.ingredient_id) ?? []).filter((i) => restes.get(i.id) > 0)
    if (!items.length) {
      lignes.push({ ...b, etat: 'absent', manque: { quantite: b.quantite, unite: b.unite } })
      continue
    }
    const memeUnite = b.quantite == null ? [] : items.filter((i) => i.unit === b.unite)
    if (!memeUnite.length) {
      // Quantité absente ou unités différentes : présence seulement, rien n'est retiré du stock.
      noter(items[0], b, null, false)
      lignes.push({ ...b, etat: 'couvert', manque: null })
      continue
    }
    let reste = b.quantite
    const pris = []
    for (const item of memeUnite) {
      if (reste <= EPS) break
      const prise = Math.min(reste, restes.get(item.id))
      restes.set(item.id, round(restes.get(item.id) - prise))
      consommation.set(item.id, round((consommation.get(item.id) ?? 0) + prise))
      reste = round(reste - prise)
      pris.push([item, prise])
    }
    const couvert = reste <= EPS
    pris.forEach(([item, prise]) => noter(item, b, prise, !couvert))
    lignes.push({ ...b, etat: couvert ? 'couvert' : 'partiel', manque: couvert ? null : { quantite: reste, unite: b.unite } })
  }

  const utilise = [...utilises.values()]
  for (const u of utilise) u.compte = !u.partiel && !claimed.has(u.item_id)
  utilise.sort((a, b) => (a.jours ?? Infinity) - (b.jours ?? Infinity))
  const manque = lignes
    .filter((l) => l.etat !== 'couvert')
    .map((l) => ({ ingredient_id: l.ingredient_id, nom: l.nom, quantite: l.manque.quantite, unite: l.manque.unite, etat: l.etat }))
  const urgence = utilise.filter((u) => u.compte).reduce((s, u) => s + u.urgence, 0)

  return { recette, personnes, lignes, manque, utilise, urgence, consommation, pourquoi: phrasePourquoi(utilise) }
}

// « Finit : courgette (1 j), crème fraîche (4 j) » : les produits rouges et orange que cette recette utilise.
function phrasePourquoi(utilise) {
  const jours = (j) => (j < 0 ? 'périmé' : `${j} j`)
  const pressants = utilise.filter((u) => u.compte && u.urgence >= 2)
  if (pressants.length) return 'Finit : ' + pressants.map((u) => `${u.nom} (${jours(u.jours)})`).join(', ')
  if (utilise.length) return 'Utilise : ' + utilise.slice(0, 3).map((u) => u.nom).join(', ')
  return 'Rien de ton frigo dans cette recette'
}

// « Courgette (200 g) », ou juste le nom sans quantité.
export function libelleManque(m) {
  return m.quantite == null ? m.nom : `${m.nom} (${formatQuantity(m.quantite, m.unite)})`
}

// Stock après la recette : les quantités consommées sont retirées, les produits vides disparaissent.
export function retirerDuStock(stock, consommation) {
  return stock
    .map((i) => (consommation.has(i.id) ? { ...i, quantity: round(Number(i.quantity) - consommation.get(i.id)) } : i))
    .filter((i) => !consommation.has(i.id) || i.quantity > EPS)
}

// État de départ d'un menu, et passage à la recette suivante.
const etatInitial = (stock) => ({ stock, claimed: new Set() })
function etatApres(etat, resultat) {
  const claimed = new Set(etat.claimed)
  resultat.utilise.filter((u) => u.compte).forEach((u) => claimed.add(u.item_id))
  return { stock: retirerDuStock(etat.stock, resultat.consommation), claimed }
}

// Affichage d'un menu déjà choisi : chaque recette est calculée avec ce que les précédentes ont laissé.
//  selection : [{ recette, personnes }]
export function evaluerSelection(selection, stock, { today = todayIso() } = {}) {
  let etat = etatInitial(stock)
  return selection.map(({ recette, personnes }) => {
    const resultat = couverture(recette, personnes, etat.stock, { today, claimed: etat.claimed })
    etat = etatApres(etat, resultat)
    return resultat
  })
}

// Étiquettes sans accents ni majuscules : « Pâtes » -> « pates », « Bœuf » -> « boeuf », « végétarien » -> « vege ».
function normaliser(tag) {
  return String(tag).toLowerCase().replace(/œ/g, 'oe').normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}
export function etiquettesPrincipales(recette) {
  const trouvees = new Set()
  for (const tag of recette.tags ?? []) {
    const t = normaliser(tag)
    for (const p of ETIQUETTES_PRINCIPALES) if (t === p || (p === 'vege' && t.startsWith('vege'))) trouvees.add(p)
  }
  return trouvees
}

// Tri commun : le meilleur d'abord. Égalités : moins de manquants, plus rapide (temps inconnu en dernier), titre.
function departager(a, b) {
  return (a.manque.length - b.manque.length)
    || ((a.recette.temps_min ?? Infinity) - (b.recette.temps_min ?? Infinity) || 0)
    || a.recette.titre.localeCompare(b.recette.titre, 'fr')
    || String(a.recette.id).localeCompare(String(b.recette.id))
}

// Mode « reste » : recettes faisables (2 manquants au plus, au moins un produit du frigo utilisé),
// les plus urgentes d'abord. Chaque proposition est indépendante : elles ne se partagent pas le stock.
export function cuisinerReste(recettes, stock, { personnes = PERSONNES_DEFAUT, today = todayIso(), limite = LIMITE_RESTE } = {}) {
  return recettes
    .map((r) => couverture(r, personnes, stock, { today }))
    .filter((c) => c.manque.length <= MAX_MANQUANTS_RESTE && c.utilise.some((u) => !u.partiel))
    .sort((a, b) => (b.urgence - a.urgence) || departager(a, b))
    .slice(0, limite)
}

// Mode « planifier » : choix glouton, un repas à la fois.
// Score = urgence − POIDS_MANQUANT × manquants − MALUS_ETIQUETTE si une étiquette principale est déjà prise.
// Après chaque choix, ce que la recette consomme est retiré du stock et ses produits ne comptent plus.
export function planifier(recettes, stock, { personnes = PERSONNES_DEFAUT, repas = REPAS_DEFAUT, today = todayIso() } = {}) {
  const n = Math.min(REPAS_MAX, Math.max(REPAS_MIN, Math.round(repas)))
  let etat = etatInitial(stock)
  const restantes = [...recettes]
  const etiquettesPrises = new Set()
  const choisis = []
  while (choisis.length < n && restantes.length) {
    let meilleur = null
    for (const r of restantes) {
      const c = couverture(r, personnes, etat.stock, { today, claimed: etat.claimed })
      const doublon = [...etiquettesPrincipales(r)].some((t) => etiquettesPrises.has(t))
      c.score = c.urgence - POIDS_MANQUANT * c.manque.length - (doublon ? MALUS_ETIQUETTE : 0)
      if (!meilleur || c.score - meilleur.score > EPS || (Math.abs(c.score - meilleur.score) <= EPS && departager(c, meilleur) < 0)) meilleur = c
    }
    restantes.splice(restantes.findIndex((r) => r.id === meilleur.recette.id), 1)
    etiquettesPrincipales(meilleur.recette).forEach((t) => etiquettesPrises.add(t))
    etat = etatApres(etat, meilleur)
    choisis.push(meilleur)
  }
  return choisis
}

// Produits rouges et orange dont l'ingrédient n'est dans aucune des recettes retenues.
// `recettes` : les recettes du menu. Trié du plus pressé au moins pressé.
export function produitsNonUtilises(stock, recettes, { today = todayIso() } = {}) {
  const dansMenu = new Set(recettes.flatMap((r) => r.lignes.map((l) => l.ingredient_id)))
  return stock
    .filter((i) => i.ingredient_id && i.expires_at && !dansMenu.has(i.ingredient_id))
    .map((item) => ({ item, jours: daysLeft(item.expires_at, today) }))
    .filter((p) => urgenceJours(p.jours) >= 2)
    .sort((a, b) => a.jours - b.jours || String(a.item.id).localeCompare(String(b.item.id)))
}

// Produits en stock sans ingrédient : on ne sait pas les rapprocher des recettes.
export const produitsNonAssocies = (stock) => stock.filter((i) => !i.ingredient_id)
