import { useId } from 'react'
import { RAYONS } from '../lib/options'

// Champ « rayon » : texte libre avec suggestions (rayons proposés + ceux déjà dans le catalogue).
export default function RayonInput({ value, onChange, catalog = [], ...rest }) {
  const listId = useId()
  const options = [...new Set([...RAYONS, ...catalog.map((i) => i.rayon).filter(Boolean)])].sort((a, b) => a.localeCompare(b, 'fr'))
  return (
    <>
      <input className="field" list={listId} value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
      <datalist id={listId}>{options.map((r) => <option key={r} value={r} />)}</datalist>
    </>
  )
}
