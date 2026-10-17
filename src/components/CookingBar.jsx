import { useInventory } from '../lib/InventoryContext'

// Bandeau du mode « Je cuisine », visible sur toutes les vues tant que l'écran est maintenu allumé.
export default function CookingBar() {
  const { wakeLock } = useInventory()
  if (!wakeLock.active) return null
  return (
    <div className="cooking-bar" role="status">
      <span>Écran maintenu allumé</span>
      <button type="button" onClick={wakeLock.stop}>Arrêter</button>
      {wakeLock.error && <small>{wakeLock.error}</small>}
    </div>
  )
}
