import { useEffect, useState } from 'react'
import { supabase, isConfigured } from './supabaseClient'
import Inventory from './components/Inventory'

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
    <form className="card" onSubmit={handleSubmit}>
      <h1>Frigo</h1>
      <input type="email" placeholder="Email" value={email} required
        autoComplete="email" onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Mot de passe" value={password} required
        autoComplete="current-password" onChange={(e) => setPassword(e.target.value)} />
      <button type="submit" disabled={loading}>{loading ? 'Connexion…' : 'Se connecter'}</button>
      {error && <p className="error">{error}</p>}
    </form>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(!isConfigured)

  useEffect(() => {
    if (!isConfigured) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (!isConfigured) {
    return (
      <div className="card">
        <h1>Configuration manquante</h1>
        <p className="error">
          VITE_SUPABASE_URL et/ou VITE_SUPABASE_ANON_KEY ne sont pas définies.
          Ajoute-les dans les secrets du repo GitHub puis relance le déploiement.
        </p>
      </div>
    )
  }
  if (!ready) return <div className="card">Chargement…</div>
  return session ? <Inventory /> : <Login />
}
