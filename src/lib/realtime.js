// Fusion des changements en direct dans la liste locale. Fonctions pures :
// aucune dépendance à React ni à Supabase, donc faciles à tester.

// Tri par date de péremption croissante. Sans date : en fin de liste.
// Égalité : plus ancien ajout d'abord, puis id, pour un ordre identique
// sur tous les appareils (pas de saut de lignes d'un appareil à l'autre).
export function sortByExpiry(list) {
  return [...list].sort((a, b) => {
    if (a.expires_at !== b.expires_at) {
      if (!a.expires_at) return 1
      if (!b.expires_at) return -1
      return a.expires_at < b.expires_at ? -1 : 1
    }
    if ((a.added_at || '') !== (b.added_at || '')) return (a.added_at || '') < (b.added_at || '') ? -1 : 1
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
  })
}

// Insère ou remplace une ligne (dédoublonnage par id), ou la retire.
function upsert(list, row) {
  return [...list.filter((i) => i.id !== row.id), row]
}

// event = { eventType: 'INSERT' | 'UPDATE' | 'DELETE', new, old } (format postgres_changes).
// Retourne la nouvelle liste triée ; la liste ne contient que des produits 'in_stock'.
export function applyChange(list, event) {
  const { eventType } = event
  let next = list
  if (eventType === 'DELETE') {
    // Sans REPLICA IDENTITY FULL, `old` ne contient que l'id : ça suffit.
    const id = event.old?.id
    if (id !== undefined) next = list.filter((i) => i.id !== id)
  } else if (eventType === 'INSERT' || eventType === 'UPDATE') {
    const row = event.new
    if (!row || row.id === undefined) return list
    next = row.status === 'in_stock' ? upsert(list, row) : list.filter((i) => i.id !== row.id)
  }
  return sortByExpiry(next)
}
