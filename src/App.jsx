import { useEffect, useState } from 'react'
import { supabase, isConfigured } from './supabaseClient'
import { HashRouter } from 'react-router-dom'
import { InventoryProvider } from './lib/InventoryContext'
import FoodIcon from './components/FoodIcon'
import Shell from './components/Shell'

// Écran de connexion (email + mot de passe). Pas d'inscription dans l'app :
// le compte est créé à la main dans Supabase (Authentication > Users).
function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Connexion impossible : ' + error.message)
    setLoading(false)
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <span className="login-logo" aria-hidden="true"><FoodIcon name="frigo" size={44} /></span>
        <h1>Mon frigo</h1>
        <p className="login-sub">Connecte-toi pour retrouver ton frigo.</p>
        <input className="field" type="email" placeholder="Email" aria-label="Email" value={email} required
          autoComplete="email" onChange={(e) => setEmail(e.target.value)} />
        <input className="field" type="password" placeholder="Mot de passe" aria-label="Mot de passe" value={password} required
          autoComplete="current-password" onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Connexion…' : 'Se connecter'}</button>
        {error && <p className="error" role="alert">{error}</p>}
      </form>
    </main>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(!isConfigured)

  useEffect(() => {
    if (!isConfigured) return
    // Session lue dans localStorage (persistante) ; si elle est expirée et ne peut pas être
    // renouvelée, session = null et l'écran de connexion s'affiche, jamais une page blanche.
    supabase.auth.getSession()
      .then(({ data }) => setSession(data?.session ?? null))
      .catch(() => setSession(null))
      .finally(() => setReady(true))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (!isConfigured) {
    return (
      <div className="login-page"><div className="login-card">
        <h1>Configuration manquante</h1>
        <p className="error">
          VITE_SUPABASE_URL et/ou VITE_SUPABASE_ANON_KEY ne sont pas définies.
          Ajoute-les dans les secrets du repo GitHub puis relance le déploiement.
        </p>
      </div></div>
    )
  }
  if (!ready) return <div className="login-page"><p className="empty">Chargement…</p></div>
  if (!session) return <Login />
  // HashRouter (URL en #/…) : GitHub Pages ne sait pas servir une URL par chemin au rechargement.
  // Le provider est au-dessus du routeur : la liste et le canal temps réel survivent aux changements de vue.
  return (
    <InventoryProvider>
      <HashRouter>
        <Shell />
      </HashRouter>
    </InventoryProvider>
  )
}
