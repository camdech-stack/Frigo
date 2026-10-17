import { iconForCategory } from '../lib/options'
import FoodIcon, { tintVar } from './FoodIcon'

// Tuile d'icône teintée (DESIGN.md §6.4). `category` = valeur stockée en base ; `size` : '' (48/64),
// 'lg' (produit scanné 72/88) ou 'sm' (sélecteur de catégorie : l'icône seule, sans fond propre).
export default function CategoryTile({ category, name, size = '' }) {
  const icon = name ?? iconForCategory(category)
  return (
    <span className={'tile ' + size} style={{ background: tintVar(icon) }} aria-hidden="true">
      <FoodIcon name={icon} size="var(--tile-icon)" />
    </span>
  )
}
