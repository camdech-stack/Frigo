// Fusion d'un changement temps réel dans une liste de lignes (clé = id). Fonction pure.
// event = { eventType: 'INSERT' | 'UPDATE' | 'DELETE', new, old } (format postgres_changes).
// Sans REPLICA IDENTITY FULL, `old` d'un DELETE ne contient que l'id : ça suffit.
export function applyRowChange(rows, event) {
  if (event.eventType === 'DELETE') {
    const id = event.old?.id
    return id === undefined ? rows : rows.filter((r) => r.id !== id)
  }
  const row = event.new
  if (!row || row.id === undefined) return rows
  const i = rows.findIndex((r) => r.id === row.id)
  if (i === -1) return [...rows, row]
  const next = [...rows]
  next[i] = row
  return next
}
