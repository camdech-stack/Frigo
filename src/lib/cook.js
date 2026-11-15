// Cuisiner (étape 7) : calcule les décomptes proposés pour une recette du menu.
// Fonctions pures, sans IA ni accès à la base : l'écran de confirmation les affiche, rien n'est écrit ici.
// Un produit du stock : { id, name, ingredient_id, quantity, unit, expires_at } (voir menu.js).

import { parPeremption } from './menu.js'
import { consume } from './quantity.js'

const round = (n) => Math.round(n * 1000) / 1000
const EPS = 1e-9

// Décompte proposé pour `menuEntry` ({ personnes }) cuisinée avec `recette` (voir toRecette dans menu.js).
// Retourne :
//  prelevements : [{ key, item_id, nom, nomProduit, expires_at, unite, quantite, max, auto, manque }]
//    - auto = true  : quantité calculée (même unité) = quantite × personnes / portions, prise d'abord sur le produit
//                     qui périme le plus tôt, jamais au-delà du stock (max). `manque` = ce qui reste introuvable (ou null).
//    - auto = false : unité différente ou quantité absente. Le produit est proposé avec quantite = null :
//                     la personne la remplit (ou décoche), rien n'est décompté automatiquement.
//  absents      : [{ ingredient_id, nom, quantite, unite }] lignes sans aucun produit en stock (« Pas trouvés dans le frigo »).
// Les ingrédients basiques ne sont jamais décomptés.
export function decompte(menuEntry, recette, stock) {
  const facteur = recette.portions > 0 ? menuEntry.personnes / recette.portions : 1
  // Stock encore disponible, produit par produit : deux lignes du même ingrédient ne prennent pas deux fois la même quantité.
  const restes = new Map(stock.map((i) => [i.id, Number(i.quantity)]))
  const prelevements = []
  const absents = []

  recette.lignes.forEach((ligne, index) => {
    if (ligne.basique) return
    const quantite = ligne.quantite == null ? null : round(ligne.quantite * facteur)
    const produits = stock
      .filter((i) => i.ingredient_id === ligne.ingredient_id && restes.get(i.id) > EPS)
      .sort(parPeremption)
    if (!produits.length) {
      absents.push({ ingredient_id: ligne.ingredient_id, nom: ligne.nom, quantite, unite: ligne.unite })
      return
    }
    const base = (item) => ({
      nom: ligne.nom, item_id: item.id, nomProduit: item.name ?? ligne.nom, expires_at: item.expires_at ?? null,
      unite: item.unit, max: restes.get(item.id),
    })

    const memeUnite = quantite == null ? [] : produits.filter((i) => i.unit === ligne.unite)
    if (!memeUnite.length) {
      // Unités différentes ou quantité absente : on propose le produit le plus pressé, quantité à remplir.
      prelevements.push({ ...base(produits[0]), key: `${index}-${produits[0].id}`, quantite: null, auto: false, manque: null })
      return
    }

    let reste = quantite
    for (const item of memeUnite) {
      if (reste <= EPS) break
      const prise = Math.min(reste, restes.get(item.id))
      prelevements.push({ ...base(item), key: `${index}-${item.id}`, quantite: round(prise), auto: true, manque: null })
      restes.set(item.id, round(restes.get(item.id) - prise))
      reste = round(reste - prise)
    }
    // Stock insuffisant : on prend tout ce qu'il y a, et on signale ce qui manque sur la dernière ligne prise.
    if (reste > EPS) prelevements.at(-1).manque = { quantite: reste, unite: ligne.unite }
  })

  return { prelevements, absents }
}

// Prélèvements validés -> changements à écrire, un par produit.
// `valeurs` : { [key]: texte saisi } pour les quantités modifiées ; `decoches` : Set de keys exclues.
// Une quantité vide, nulle ou illisible est ignorée ; un produit n'est jamais retiré au-delà de son stock.
// Retourne [{ item, consumed, remaining, patch }] ; patch = { quantity } ou { quantity: 0, status: 'used' }.
export function changements(prelevements, stock, { valeurs = {}, decoches = new Set() } = {}) {
  const parProduit = new Map() // item_id -> quantité totale demandée
  for (const p of prelevements) {
    if (decoches.has(p.key)) continue
    const texte = p.key in valeurs ? valeurs[p.key] : p.quantite
    const n = Number(String(texte ?? '').replace(',', '.'))
    if (!(n > 0)) continue
    parProduit.set(p.item_id, round((parProduit.get(p.item_id) ?? 0) + n))
  }
  const out = []
  for (const [itemId, demande] of parProduit) {
    const item = stock.find((i) => i.id === itemId)
    const result = item && consume(item.quantity, demande)
    if (!result) continue
    const patch = result.remaining > 0 ? { quantity: result.remaining } : { quantity: 0, status: 'used' }
    out.push({ item, consumed: result.consumed, remaining: result.remaining, patch })
  }
  return out
}
