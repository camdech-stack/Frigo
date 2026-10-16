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
