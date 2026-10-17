// Icônes des aliments (DESIGN.md §5) : grille 24 x 24, trait 1,9, sans remplissage (sauf petits points).
// Décoratives : le nom du produit est toujours écrit à côté.
const DOT = 'var(--icon-stroke)'

const PATHS = {
  viande: <><path d="M10 13.4C9.3 12.5 9 11.2 9 9.5C9 6.5 11.5 4.5 14.5 4.5c3 0 5 2 5 4.8 0 3-2.3 5.7-5.3 5.7-1.8 0-3.3-.6-4.2-1.6z" /><path d="M10 13.4L6 17.4" /><circle cx="4.9" cy="17" r="1.3" /><circle cx="7" cy="19.1" r="1.3" /></>,
  poisson: <><path d="M3.5 12c2.8-4 7-5.5 11-3l5-2.5v11l-5-2.5c-4 2.5-8.2 1-11-3z" /><circle cx="8.3" cy="11.2" r=".7" fill={DOT} /></>,
  charcuterie: <><circle cx="12" cy="12" r="8" /><circle cx="9.2" cy="10" r=".9" fill={DOT} /><circle cx="14.6" cy="9.6" r=".9" fill={DOT} /><circle cx="12" cy="14.6" r=".9" fill={DOT} /></>,
  yaourt: <><path d="M5.5 8V6.5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1V8" /><path d="M6 8h12l-1.4 11a1.5 1.5 0 0 1-1.5 1.3H8.9A1.5 1.5 0 0 1 7.4 19z" /><path d="M8.5 13h7" /></>,
  lait: <><path d="M7 8l3-4.5h4L17 8v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" /><path d="M7 8h10M10 12.5h4" /></>,
  fromage: <><path d="M3 9l17.5-3.5V18H3z" /><circle cx="8" cy="14" r="1.2" /><circle cx="14" cy="12" r="1.2" /><circle cx="16.5" cy="15.5" r="1" /></>,
  oeufs: <><path d="M12 3.5c3.5 0 6 5 6 9a6 6 0 0 1-12 0c0-4 2.5-9 6-9z" /><path d="M9.5 14.5a2.5 2.5 0 0 0 2 2" /></>,
  fruits: <><path d="M12 8c-2-1.5-6-1-6 4 0 4 2.5 8 4.5 8 .9 0 1-.5 1.5-.5s.6.5 1.5.5c2 0 4.5-4 4.5-8 0-5-4-5.5-6-4z" /><path d="M12 8c0-2 .5-3.5 2-4.5" /></>,
  legumes: <><path d="M5 19l4.2-9.3a2.2 2.2 0 0 1 3.6-.7l2.2 2.2a2.2 2.2 0 0 1-.7 3.6z" /><path d="M13.5 9l2.5-4.5M15.5 11l4.5-2.5" /></>,
  herbes: <><path d="M5 19C5 10.5 10.5 5 19 5c0 8.5-5.5 14-14 14z" /><path d="M5 19L14 10" /></>,
  plat: <><path d="M3.5 11h17a8.5 8.5 0 0 1-17 0z" /><path d="M9 20.5h6" /><path d="M8 4.5c-.8 1 .8 2 0 3M12 4c-.8 1 .8 2 0 3.5M16 4.5c-.8 1 .8 2 0 3" /></>,
  restes: <><path d="M4 9h16v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /><path d="M3 9V7.5A1.5 1.5 0 0 1 4.5 6h15A1.5 1.5 0 0 1 21 7.5V9" /><path d="M9.5 14h5" /></>,
  condiments: <><path d="M7 4h10v3H7z" /><path d="M6.5 7h11v11a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2z" /><path d="M9 12h6v4H9z" /></>,
  pain: <path d="M4.5 10.5a4 4 0 0 1 3-6.5h9a4 4 0 0 1 3 6.5V19a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1z" />,
  boissons: <><path d="M10 3h4v3.5l2 2.5v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V9l2-2.5z" /><path d="M8 13h8" /></>,
  desserts: <><path d="M7.5 11h9L12 21z" /><path d="M7 11a5 5 0 0 1 10 0z" /></>,
  surgeles: <><path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" /><path d="M9.5 4.8L12 7l2.5-2.2M9.5 19.2L12 17l2.5 2.2" /></>,
  autre: <><path d="M5 8h14l-1 12H6z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></>,
  // Pictogramme de l'app (connexion, état vide)
  frigo: <><rect x="6" y="2.5" width="12" height="19" rx="2.5" /><path d="M6 10.5h12M9.5 6v2M9.5 13v3" /></>,
}

// Famille -> variable de teinte (tokens.css).
const TINT = {
  viande: 'meat', poisson: 'meat', charcuterie: 'meat',
  yaourt: 'dairy', lait: 'dairy', fromage: 'dairy', oeufs: 'dairy',
  fruits: 'produce', legumes: 'produce', herbes: 'produce',
  plat: 'meal', restes: 'meal', surgeles: 'frozen',
}
export const tintVar = (name) => `var(--tint-${TINT[name] ?? 'pantry'})`

export default function FoodIcon({ name, size = 28 }) {
  return (
    <svg viewBox="0 0 24 24" style={{ width: size, height: size }} fill="none" stroke="var(--icon-stroke)" strokeWidth="1.9"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {PATHS[name] ?? PATHS.autre}
    </svg>
  )
}
