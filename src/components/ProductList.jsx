import { useState } from 'react'
import { useInventory } from '../lib/InventoryContext'
import { todayIso } from '../lib/expiry'
import { collapseOk, groupByUrgency, moreLabel } from '../lib/overview'
import ItemSheet from './ItemSheet'
import ProductRow from './ProductRow'
import SectionHeader from './SectionHeader'

// Sections « À manger vite » (rouge) / « Cette semaine » (orange) / « Plus tard » (vert), DESIGN.md §4.3.
// Les produits arrivent déjà triés par date ; une section vide n'est pas affichée. Un tap ouvre la feuille d'actions.
// `collapseLater` : « Plus tard » replié en « + N autres produits » (vue Aperçu).
const SECTIONS = [
  { key: 'urgent', title: 'À manger vite' },
  { key: 'soon', title: 'Cette semaine' },
  { key: 'ok', title: 'Plus tard' },
]

export default function ProductList({ items, collapseLater = false }) {
  const { markUsed, markThrown, changeDate } = useInventory()
  const [laterOpen, setLaterOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const today = todayIso()
  const groups = groupByUrgency(items, today)
  const selected = items.find((i) => i.id === selectedId) // disparaît tout seul si retiré (utilisé ailleurs…)

  return (
    <>
      {SECTIONS.map(({ key, title }) => {
        const all = groups[key]
        if (all.length === 0) return null
        const collapsed = collapseLater && key === 'ok' ? collapseOk(all, laterOpen) : { visible: all, hiddenCount: 0 }
        return (
          <section key={key} className="section" aria-label={title}>
            <SectionHeader title={title} count={all.length} />
            {collapsed.visible.length > 0 && (
              <ul className="rows">
                {collapsed.visible.map((i) => <ProductRow key={i.id} item={i} today={today} onOpen={setSelectedId} />)}
              </ul>
            )}
            {collapseLater && key === 'ok' && (
              <button type="button" className="btn btn-secondary more" aria-expanded={laterOpen}
                onClick={() => setLaterOpen((o) => !o)}>
                {laterOpen ? 'Replier' : moreLabel(collapsed.hiddenCount)}
              </button>
            )}
          </section>
        )
      })}
      {selected && (
        <ItemSheet item={selected} onUsed={markUsed} onThrown={markThrown} onChangeDate={changeDate}
          onClose={() => setSelectedId(null)} />
      )}
    </>
  )
}
