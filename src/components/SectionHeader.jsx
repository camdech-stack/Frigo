// Titre de section en majuscules + compteur + filet (DESIGN.md §6.2).
export default function SectionHeader({ title, count }) {
  return (
    <h3 className="section-head">
      <span>{title}</span>
      <span className="section-count">{count}</span>
      <span className="section-rule" aria-hidden="true" />
    </h3>
  )
}
