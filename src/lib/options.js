// Listes de choix des formulaires et filtres.
export const UNITS = ['pièce', 'g', 'kg', 'mL', 'L', 'paquet']
export const CATEGORIES = ['laitier', 'légumes', 'fruits', 'viande', 'poisson', 'plats préparés', 'épicerie', 'autre']
// value = valeur stockée en base (contrainte CHECK du schéma), label = affichage.
export const LOCATIONS = [
  { value: 'frigo', label: 'Frigo' },
  { value: 'congélo', label: 'Congélo' },
  { value: 'placard', label: 'Placard' },
]
export const locationLabel = (value) => LOCATIONS.find((l) => l.value === value)?.label ?? value

// Catégorie stockée en base -> clé d'icône du design (DESIGN.md §5.1). Les valeurs en base ne changent pas :
// seul l'affichage est raccordé aux 18 icônes. Repli : « autre ».
export const ICON_BY_CATEGORY = {
  laitier: 'lait', légumes: 'legumes', fruits: 'fruits', viande: 'viande', poisson: 'poisson',
  'plats préparés': 'plat', épicerie: 'condiments', autre: 'autre',
}
export const iconForCategory = (category) => ICON_BY_CATEGORY[category] ?? 'autre'

// Recettes : unités du catalogue (stock) et des lignes de recette, rayons proposés (le champ reste libre).
export const STOCK_UNITS = ['g', 'ml', 'pièce']
export const RECIPE_UNITS = ['g', 'ml', 'pièce', 'càs', 'càc']
export const RAYONS = ['fruits et légumes', 'boucherie', 'poissonnerie', 'crèmerie', 'épicerie', 'surgelés', 'boulangerie', 'boissons', 'autre']
