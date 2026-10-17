import { useState } from 'react'
import { useInventory } from '../lib/InventoryContext'
import { daysLeft, remainingLabel, todayIso } from '../lib/expiry'
import { locationLabel } from '../lib/options'
import { collapseOk, groupByUrgency, moreLabel, overviewCounts, overviewState } from '../lib/overview'
import OverviewSheet from './OverviewSheet'
import ProductIcon from './ProductIcon'

// Chaque groupe porte son signal en texte ET en forme (symbole), pas seulement en couleur.
const GROUPS = {
  urgent: { title: 'Urgent', hint: 'à manger en priorité', symbol: '!' },
  soon: { title: 'Bientôt', hint: 'dans les 5 jours', symbol: '◔' },
  ok: { title: 'Ça va', hint: 'rien ne presse', symbol: '✓' },
}

function Row({ item, today, level, onOpen }) {
  const label = item.expires_at ? remainingLabel(daysLeft(item.expires_at, today)) : 'sans date'
  return (
    <li>
      <button type="button" className={`ov-row ${level}`} onClick={() => onOpen(item.id)}
        aria-label={`${item.name}, ${label} : ouvrir les actions`}>
        <ProductIcon category={item.category} />
        <span className="ov-row-main">
          <strong className="ov-name">{item.name}</strong>
          <span className="ov-meta">{item.quantity} {item.unit} · {locationLabel(item.location)}</span>
        </span>
        <span className="ov-days">{label}</span>
      </button>
    </li>
  )
}

function Group({ level, items, count = items.length, today, onOpen, children }) {
  const g = GROUPS[level]
  return (
    <section className={`ov-group ${level}`} aria-label={g.title}>
      <h3 className="ov-group-title">
        <span className="ov-symbol" aria-hidden="true">{g.symbol}</span>
        {g.title} <span className="ov-group-count">({count})</span>
        <small>{g.hint}</small>
      </h3>
      {items.length > 0 && (
        <ul className="ov-list">
          {items.map((i) => <Row key={i.id} item={i} today={today} level={level} onOpen={onOpen} />)}
        </ul>
      )}
      {children}
    </section>
  )
}

// Vue Aperçu : « que dois-je manger en priorité ? » en 3 secondes.
// Les données viennent du provider (temps réel inclus) ; `today` est recalculé à chaque rendu,
// et le provider re-rend toutes les minutes et à minuit.
export default function OverviewView() {
  const { items, loading, loadError, reload, markUsed, markThrown, wakeLock } = useInventory()
  const [okOpen, setOkOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const today = todayIso()
  const selected = items.find((i) => i.id === selectedId) // disparaît tout seul si retiré (utilisé ailleurs…)

  if (loading) return <p className="empty">Chargement…</p>
  if (loadError) {
    return (
      <div className="panel">
        <p className="error" role="alert">{loadError}</p>
        <button onClick={() => reload()}>Réessayer</button>
      </div>
    )
  }

  const state = overviewState(items, today)
  const counts = overviewCounts(items, today)
  const groups = groupByUrgency(items, today)
  const ok = collapseOk(groups.ok, okOpen)

  return (
    <div className="ov">
      <div className="ov-head">
        <h2 className="view-title">Aperçu</h2>
        {wakeLock.supported ? (
          !wakeLock.active && <button type="button" className="ov-cook" onClick={wakeLock.start}>Je cuisine</button>
        ) : (
          <span className="ov-unsupported">Écran allumé non disponible sur cet appareil</span>
        )}
      </div>

      <div className="ov-counters">
        <div className="ov-counter urgent"><b>{counts.urgent}</b><span>Urgent</span></div>
        <div className="ov-counter soon"><b>{counts.soon}</b><span>Bientôt</span></div>
        <div className="ov-counter total"><b>{counts.total}</b><span>Total en stock</span></div>
      </div>

      {state === 'empty' ? (
        <div className="ov-message">
          <strong>Ton frigo est vide pour l'instant</strong>
          <p>Ajoute ton premier produit avec l'onglet « Ajouter » : scanne un code-barres ou saisis-le à la main.</p>
        </div>
      ) : (
        <>
          {state === 'calm' ? (
            <div className="ov-message calm">
              <strong>Rien d'urgent aujourd'hui</strong>
              <p>Aucun produit n'expire dans les 2 prochains jours.</p>
            </div>
          ) : (
            <Group level="urgent" items={groups.urgent} today={today} onOpen={setSelectedId} />
          )}
          {groups.soon.length > 0 && <Group level="soon" items={groups.soon} today={today} onOpen={setSelectedId} />}
          {groups.ok.length > 0 && (
            <Group level="ok" items={ok.visible} count={groups.ok.length} today={today} onOpen={setSelectedId}>
              <button type="button" className="ov-more" aria-expanded={okOpen} onClick={() => setOkOpen((o) => !o)}>
                {okOpen ? 'Replier' : moreLabel(ok.hiddenCount)}
              </button>
            </Group>
          )}
        </>
      )}

      {selected && (
        <OverviewSheet item={selected} onUsed={markUsed} onThrown={markThrown} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}
