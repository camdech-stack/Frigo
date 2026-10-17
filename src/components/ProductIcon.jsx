// Icône d'un produit. Pour l'instant une silhouette générique : le vrai design (une icône par
// catégorie) viendra plus tard ; il suffira de modifier ce composant, `category` est déjà passé.
export default function ProductIcon({ category }) {
  return (
    <span className="ov-icon" data-category={category || undefined} aria-hidden="true">
      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" focusable="false">
        <path d="M6 8h12l-1 12H7L6 8z" /><path d="M9 8V5h6v3" />
      </svg>
    </span>
  )
}
