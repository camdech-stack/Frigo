import { supabase } from '../supabaseClient'
import { useInventory } from '../lib/InventoryContext'
import { clearSnapshot } from '../lib/offline'

// Réglages existants : clavier à l'écran (champ de scan) et déconnexion.
export default function SettingsView() {
  const { keyboard, setKeyboard } = useInventory()
  return (
    <>
      <h2 className="view-title">Réglages</h2>
      <section className="panel">
        <label className="check">
          <input type="checkbox" checked={keyboard} onChange={(e) => setKeyboard(e.target.checked)} />
          Clavier à l'écran
        </label>
        <p className="hint">Désactive-le si tu utilises une douchette : le clavier ne s'ouvre plus sur le champ de scan.</p>
      </section>
      <section className="panel">
        <button className="secondary" onClick={() => { clearSnapshot(); supabase.auth.signOut() }}>Déconnexion</button>
      </section>
    </>
  )
}
