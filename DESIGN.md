# Mon frigo : direction artistique v3

Spécifications design à appliquer à l'app existante (Vite + React, PWA, CSS simple avec variables, une seule page, GitHub Pages) et à suivre pour tous les écrans à venir. Les valeurs chiffrées sont dans `tokens.css` (même dossier). Ce document dit où et comment les utiliser.

Décisions validées :
- Thème clair uniquement. Pas de mode sombre.
- Pastille de péremption carrée (chiffre + unité) sur téléphone et sur iPad. Pas de pastille allongée.

Maquettes de référence : liste téléphone et liste iPad paysage (pastille carrée), saisie rapide téléphone et iPad, planche d'icônes.

---

## 0. Consignes pour Claude Code

1. Objectif : changer l'habillage visuel de la structure existante. Ne pas modifier les fonctionnalités, la logique de données, ni l'ordre des écrans.
2. Aucune nouvelle dépendance npm. CSS simple, variables CSS uniquement.
3. Copier `tokens.css` dans `src/styles/` et l'importer une seule fois au point d'entrée.
4. Remplacer toutes les couleurs, rayons, tailles de texte et ombres écrits en dur par les variables du fichier. Toute nouvelle valeur visuelle doit d'abord exister comme variable.
5. Supprimer tout ce qui concerne un thème sombre dans l'app existante (media query `prefers-color-scheme: dark`, variables ou classes de thème sombre, bascule de thème). Ne pas en ajouter.
6. Police : Nunito (graisses 500, 700, 800, 900). Pour que la PWA marche hors ligne, la télécharger en fichiers `.woff2` dans `public/fonts/`, la déclarer avec `@font-face` (`font-display: swap`) et l'ajouter au précache du service worker. Ne pas dépendre d'un CDN à l'exécution.
7. Les écrans existants (connexion, liste filtrable, formulaire d'ajout, carte de saisie rapide, mode rangement, scan caméra plein écran) gardent leur structure : on applique les composants et règles ci-dessous. Si un élément n'a pas d'équivalent dans ce document, appliquer les principes de la section 1 et le signaler dans le compte rendu.
8. Les écrans à venir (vue cuisine plein écran, recettes suggérées) sont décrits en section 8 : les construire directement dans cette direction.
9. À la fin : vérifier la checklist de la section 10.

---

## 1. Principes

- Ambiance : chaleureuse, simple, colorée. Fond crème, encre brune, un seul accent terracotta pour l'action principale. La couleur forte est réservée à la péremption.
- Formes : coins arrondis partout, mais jamais de bouton ni de pastille ronds (pas de `border-radius: 999px` ni `50%`). Un bouton est un rectangle aux coins arrondis, une pastille de péremption est un carré aux coins arrondis.
- Relief : à plat. Les cartes ont une ombre pleine sans flou (`--shadow-card`, `--shadow-key`). Seul le panneau iPad a une ombre diffuse.
- Pas de dégradés, pas d'emoji, pas de texte fin, pas de bordure colorée sur le côté d'une carte.
- Règles fixes de l'app :
  - Code couleur de péremption : rouge (expiré ou 2 jours ou moins), orange (3 à 5 jours), vert (6 jours et plus). Toujours accompagné du texte des jours restants. La couleur seule ne porte jamais l'information.
  - Cibles tactiles : 48 px minimum sur téléphone, 56 px sur tablette.
  - Contrastes : AA minimum partout (voir section 3.3).
  - Mobile d'abord. Une main sur téléphone : les actions principales sont dans le bas de l'écran.
- Rouge, orange et vert ne servent à rien d'autre que la péremption (ni progression, ni validation, ni décor). Pour "terminé" ou "sélectionné", utiliser l'encre.

---

## 2. Points de rupture et gabarits

| Contexte | Largeur | Gabarit |
| --- | --- | --- |
| Téléphone | moins de 768 px | En-tête, filtres, liste en une colonne, barre d'actions en bas |
| Tablette portrait | 768 à 1023 px | Comme le téléphone mais avec les tailles "tablette" du tableau 3.2 et une liste en 2 colonnes |
| Tablette paysage et plus | 1024 px et plus | Rail latéral à gauche (280 px) + zone principale en 2 colonnes |

La variante tablette portrait n'a pas été maquettée : la déduire des principes. Utiliser `env(safe-area-inset-*)` sur les barres fixes.

---

## 3. Tokens

Les valeurs exactes sont dans `tokens.css`. Résumé :

### 3.1 Couleurs

| Variable | Valeur | Usage |
| --- | --- | --- |
| `--color-bg` | #FFF4E6 | Fond de page |
| `--color-surface` | #FFFFFF | Cartes, champs, boutons secondaires |
| `--color-surface-sunken` | #F9E8D0 | Rail latéral tablette |
| `--color-line` | #EAD3B6 | Filets, bordures douces, ombres |
| `--color-ink` | #3A2A1F | Texte principal, bordures fortes, filtre actif |
| `--color-ink-muted` | #7A5A44 | Texte secondaire |
| `--color-primary` | #C2410C | Bouton principal |
| `--color-on-primary` | #FFFFFF | Texte sur bouton principal |
| `--color-danger` | #C62828 | Messages d'erreur de formulaire |

Statuts de péremption (fond / texte) :

| Statut | Fond | Texte |
| --- | --- | --- |
| Rouge | #C62828 | #FFFFFF |
| Orange | #F5A623 | #3A2200 |
| Vert | #2E7D32 | #FFFFFF |

### 3.2 Typographie (Nunito)

| Rôle | Téléphone | Tablette | Graisse |
| --- | --- | --- | --- |
| Titre d'écran | 32 px, interligne 1.1, -0.5 px | 38 px, -0.6 px | 900 |
| Titre de section (majuscules) | 13 px, espacement 1.4 px | 15 px, espacement 1.6 px | 900 |
| Nom du produit (ligne) | 18 px | 23 px | 800 |
| Détail (emplacement, quantité) | 14 px | 16 px | 700 |
| Chiffre de pastille | 26 px | 36 px | 900 |
| Unité de pastille | 12 px | 14 px | 800 |
| Mot "Expiré" dans la pastille | 15 px | 19 px | 900 |
| Libellé de filtre | 16 px | 19 px | 700 (800 si actif) |
| Bouton principal | 19 px | 21 px | 900 |
| Bouton secondaire | 17 px | 18 px | 800 |
| Question ("Il se garde combien de temps ?") | 20 px | 23 px | 900 |
| Nom du produit scanné | 24 px | 28 px | 900 |
| Titre de bouton de durée | 32 px | 38 px | 900 |
| Date de bouton de durée | 15 px | 17 px | 700 |

Taille de texte minimale : 12 px (uniquement l'unité de la pastille sur téléphone), 14 px partout ailleurs.

### 3.3 Contrastes vérifiés (ratio calculé)

Encre sur fond 12,6 ; texte secondaire sur fond 5,7 ; blanc sur terracotta 5,2 ; blanc sur rouge 5,6 ; texte brun foncé sur orange 7,4 ; blanc sur vert 5,1.
Si une couleur est modifiée, revérifier 4,5:1 pour le texte normal et 3:1 pour le texte de 24 px et plus.

### 3.4 Espacement et rayons

Échelle d'espacement : 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32 (`--space-1` à `--space-11`).
Rayons : voir `tokens.css` (`--radius-*`). Correspondance rapide : chips et tuiles 14, pastille de péremption 14 (16 en tablette), boutons 16, bouton principal 18, lignes produit 18 (20 en tablette), boutons de durée 20 (22), carte produit scanné 22.

---

## 4. Règles de péremption (logique d'affichage)

Calculer `joursRestants` en jours calendaires locaux (date du jour à minuit, pas en multiples de 24 h), recalculé à l'ouverture et à minuit.

### 4.1 Statut

| Jours restants | Statut |
| --- | --- |
| négatif (expiré) ou 0 à 2 | rouge |
| 3 à 5 | orange |
| 6 et plus | vert |

### 4.2 Libellés de la pastille (deux lignes : chiffre puis unité)

- expiré : "Expiré" puis "hier" si -1, sinon "N j" (N = jours de retard)
- 0 : "0" puis "jour"
- 1 : "1" puis "jour"
- 2 ou plus : "N" puis "jours"
- 100 ou plus : "99+" puis "jours"

### 4.3 Sections de la liste

Les sections suivent les statuts, dans cet ordre :
- "À manger vite" : rouge (expirés et 0 à 2 jours)
- "Cette semaine" : orange (3 à 5 jours)
- "Plus tard" : vert (6 jours et plus)

Dans chaque section, tri par jours restants croissants, expirés en premier. Une section vide n'est pas affichée. Le compteur de la section affiche le nombre de produits. Le filtre d'emplacement s'applique avant le regroupement.

---

## 5. Icônes des aliments

18 icônes de catégorie, dessinées sur une grille de 24 x 24, trait de 1.9 px, `stroke-linecap="round"`, `stroke-linejoin="round"`, sans remplissage (sauf les petits points signalés). Couleur de trait : `var(--icon-stroke)`. Rendu dans une tuile arrondie teintée (section 6.4). L'icône est décorative (`aria-hidden="true"`) puisque le nom du produit est toujours écrit.

À créer comme composant `<FoodIcon name="..." size={28} />` qui renvoie un `<svg viewBox="0 0 24 24" fill="none" stroke="var(--icon-stroke)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">`.

### 5.1 Famille, teinte, icône

| Clé | Nom affiché | Teinte (variable) |
| --- | --- | --- |
| `viande` | Viande | `--tint-meat` |
| `poisson` | Poisson | `--tint-meat` |
| `charcuterie` | Charcuterie | `--tint-meat` |
| `yaourt` | Yaourt | `--tint-dairy` |
| `lait` | Lait | `--tint-dairy` |
| `fromage` | Fromage (sert aussi pour le beurre) | `--tint-dairy` |
| `oeufs` | Oeufs | `--tint-dairy` |
| `fruits` | Fruits | `--tint-produce` |
| `legumes` | Légumes | `--tint-produce` |
| `herbes` | Salades, herbes | `--tint-produce` |
| `plat` | Plat cuisiné | `--tint-meal` |
| `restes` | Restes | `--tint-meal` |
| `condiments` | Sauces, pots | `--tint-pantry` |
| `pain` | Pain | `--tint-pantry` |
| `boissons` | Boissons | `--tint-pantry` |
| `desserts` | Desserts | `--tint-pantry` |
| `surgeles` | Surgelés | `--tint-frozen` |
| `autre` | Autre (défaut) | `--tint-pantry` |

Un produit sans catégorie reconnue utilise `autre`. Si l'app a déjà des catégories ou un mapping depuis le code-barres, le raccorder à ces clés.

### 5.2 Tracés SVG (contenu à placer dans le `<svg>`)

```html
<!-- viande -->
<path d="M10 13.4C9.3 12.5 9 11.2 9 9.5C9 6.5 11.5 4.5 14.5 4.5c3 0 5 2 5 4.8 0 3-2.3 5.7-5.3 5.7-1.8 0-3.3-.6-4.2-1.6z"/><path d="M10 13.4L6 17.4"/><circle cx="4.9" cy="17" r="1.3"/><circle cx="7" cy="19.1" r="1.3"/>

<!-- poisson (l'oeil est plein) -->
<path d="M3.5 12c2.8-4 7-5.5 11-3l5-2.5v11l-5-2.5c-4 2.5-8.2 1-11-3z"/><circle cx="8.3" cy="11.2" r=".7" fill="var(--icon-stroke)"/>

<!-- charcuterie (les 3 points sont pleins) -->
<circle cx="12" cy="12" r="8"/><circle cx="9.2" cy="10" r=".9" fill="var(--icon-stroke)"/><circle cx="14.6" cy="9.6" r=".9" fill="var(--icon-stroke)"/><circle cx="12" cy="14.6" r=".9" fill="var(--icon-stroke)"/>

<!-- yaourt -->
<path d="M5.5 8V6.5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1V8"/><path d="M6 8h12l-1.4 11a1.5 1.5 0 0 1-1.5 1.3H8.9A1.5 1.5 0 0 1 7.4 19z"/><path d="M8.5 13h7"/>

<!-- lait -->
<path d="M7 8l3-4.5h4L17 8v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z"/><path d="M7 8h10M10 12.5h4"/>

<!-- fromage -->
<path d="M3 9l17.5-3.5V18H3z"/><circle cx="8" cy="14" r="1.2"/><circle cx="14" cy="12" r="1.2"/><circle cx="16.5" cy="15.5" r="1"/>

<!-- oeufs -->
<path d="M12 3.5c3.5 0 6 5 6 9a6 6 0 0 1-12 0c0-4 2.5-9 6-9z"/><path d="M9.5 14.5a2.5 2.5 0 0 0 2 2"/>

<!-- fruits -->
<path d="M12 8c-2-1.5-6-1-6 4 0 4 2.5 8 4.5 8 .9 0 1-.5 1.5-.5s.6.5 1.5.5c2 0 4.5-4 4.5-8 0-5-4-5.5-6-4z"/><path d="M12 8c0-2 .5-3.5 2-4.5"/>

<!-- legumes -->
<path d="M5 19l4.2-9.3a2.2 2.2 0 0 1 3.6-.7l2.2 2.2a2.2 2.2 0 0 1-.7 3.6z"/><path d="M13.5 9l2.5-4.5M15.5 11l4.5-2.5"/>

<!-- herbes -->
<path d="M5 19C5 10.5 10.5 5 19 5c0 8.5-5.5 14-14 14z"/><path d="M5 19L14 10"/>

<!-- plat -->
<path d="M3.5 11h17a8.5 8.5 0 0 1-17 0z"/><path d="M9 20.5h6"/><path d="M8 4.5c-.8 1 .8 2 0 3M12 4c-.8 1 .8 2 0 3.5M16 4.5c-.8 1 .8 2 0 3"/>

<!-- restes -->
<path d="M4 9h16v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M3 9V7.5A1.5 1.5 0 0 1 4.5 6h15A1.5 1.5 0 0 1 21 7.5V9"/><path d="M9.5 14h5"/>

<!-- condiments -->
<path d="M7 4h10v3H7z"/><path d="M6.5 7h11v11a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2z"/><path d="M9 12h6v4H9z"/>

<!-- pain -->
<path d="M4.5 10.5a4 4 0 0 1 3-6.5h9a4 4 0 0 1 3 6.5V19a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1z"/>

<!-- boissons -->
<path d="M10 3h4v3.5l2 2.5v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V9l2-2.5z"/><path d="M8 13h8"/>

<!-- desserts -->
<path d="M7.5 11h9L12 21z"/><path d="M7 11a5 5 0 0 1 10 0z"/>

<!-- surgeles -->
<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/><path d="M9.5 4.8L12 7l2.5-2.2M9.5 19.2L12 17l2.5 2.2"/>

<!-- autre -->
<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>

<!-- frigo (pictogramme de l'app, connexion et icône PWA) -->
<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M6 10.5h12M9.5 6v2M9.5 13v3"/>
```

Les tracés sont un premier jet : si un dessin est jugé peu lisible à l'usage, le signaler plutôt que de le redessiner sans validation.

---

## 6. Composants

Dimensions "téléphone / tablette". Les états communs (pressé, focus) sont en 6.12.

### 6.1 FilterChip (filtre d'emplacement : Tous, Frigo, Congélo, Placard)
- Téléphone : rangée horizontale, gap 8, hauteur min 48, padding horizontal 20, rayon 14, bordure 2 px, texte 16.
- Tablette paysage : liste verticale dans le rail, gap 8, hauteur min 56, padding horizontal 18, texte aligné à gauche, texte 19.
- Actif : fond `--color-ink`, bordure `--color-ink`, texte `--color-ink-inverse`, graisse 800.
- Inactif : fond `--color-surface`, bordure `--color-line`, texte `--color-ink`, graisse 700.

### 6.2 SectionHeader
Ligne flex, alignée au centre : titre en majuscules + compteur + filet. Titre et compteur en `--color-ink-muted`, graisse 900. Filet : hauteur 2 px, `flex: 1`, `--color-line`, rayon 1.
- Téléphone : gap 10, marges 14 en haut et 8 en bas (16 au-dessus des sections suivantes), texte 13.
- Tablette : gap 12, marge basse 12, 22 au-dessus des sections suivantes, texte 15.

### 6.3 ProductRow (une ligne ou carte produit, entièrement cliquable)
Un seul `<button>` (ou élément cliquable équivalent) qui contient, de gauche à droite : tuile d'icône, bloc texte, pastille de péremption.
- Téléphone : hauteur min 72, padding 6 6 6 12, gap 12, rayon 18, fond `--color-surface`, ombre `--shadow-card`. Espace entre lignes : 8. Une colonne.
- Tablette : hauteur min 96, padding 10 10 10 14, gap 16, rayon 20, même fond et ombre. Grille de 2 colonnes, gap 12.
- Bloc texte : nom (ellipse sur une ligne) puis détail "Emplacement · quantité ou précision" en `--color-ink-muted`.

### 6.4 CategoryTile (tuile d'icône)
- Téléphone : 48 x 48, rayon 14, icône 28.
- Tablette : 64 x 64, rayon 18, icône 38.
- Produit scanné (carte de saisie) : 72 puis 88 (tablette), rayon 18 puis 22, icône 42 puis 52.
- Fond : la teinte de la famille (section 5.1).

### 6.5 ExpiryBadge (pastille de péremption)
Une seule forme, carrée, sur téléphone et sur tablette.
- Téléphone : 60 x 60, rayon 14 (`--radius-badge`), chiffre 26 / 900, unité 12 / 800, interligne 1 puis 1.3.
- Tablette : 76 x 76, rayon 16 (`--radius-badge-lg`), chiffre 36 / 900, unité 14 / 800.
- Deux lignes centrées (chiffre puis unité), ne rétrécit pas (`flex: none`), alignée à droite de la ligne.
- Couleurs : fond et texte du statut (3.1). Libellés : 4.2.

### 6.6 PrimaryButton ("Scanner")
Hauteur 60 (68 en tablette), rayon 18, fond `--color-primary`, texte `--color-on-primary`, 19 / 900 (21), pictogramme de scan 26 (28) à gauche du texte, gap 10 (12). Téléphone : prend toute la largeur restante de la barre du bas. Tablette : pleine largeur du rail, sous "Ajouter à la main".

### 6.7 SecondaryButton (contour : "Ajouter à la main", "Autre date")
Hauteur 56 (60 dans le panneau tablette), rayon 16, bordure 2 px `--color-ink`, fond `--color-surface`, texte `--color-ink` 17 / 800 (18), pictogramme 22 à 24 à gauche.

### 6.8 IconButton (carré arrondi, jamais rond)
- Bouton "+" de la barre du bas : 60 x 60, rayon 18, bordure 2 px `--color-ink`, fond `--color-surface`, pictogramme 26.
- Fermer, rechercher : 52 x 52 (56 en tablette), rayon 16, bordure 2 px `--color-line`, fond `--color-surface`, pictogramme 24 à 26.
- Toujours un `aria-label`.

### 6.9 TextButton ("Passer")
Largeur 132 (140), hauteur 56 (60), sans fond ni bordure, texte `--color-ink-muted` 17 / 800 souligné, rayon 16 pour la zone de focus.

### 6.10 BottomBar (téléphone)
Fixée en bas, padding 12 16 20 plus `env(safe-area-inset-bottom)`, fond `--color-bg`, bordure haute 2 px `--color-line`, gap 10. Le contenu de la liste prévoit un espace en bas égal à la hauteur de la barre pour que la dernière ligne reste accessible.

### 6.11 Rail latéral (tablette paysage)
Largeur 280, padding 32 20 28, fond `--color-surface-sunken`, bordure droite 2 px `--color-line`, colonne flex. Contenu de haut en bas : titre d'écran 38, sous-titre "date du jour · N produits" en `--color-ink-muted` 17 / 700, étiquette "Emplacement" (13 / 900 majuscules, espacement 1.4), 4 filtres, espace flexible, "Ajouter à la main", "Scanner". Marge de 36 avant l'étiquette.

### 6.12 États communs
- Pressé : `transform: translateY(1px)` et ombre réduite d'1 px, 120 ms. Pas d'effet de survol requis (tactile), un léger assombrissement de fond est toléré à la souris.
- Focus visible : anneau `--focus-ring` (3 px, couleur encre), pour clavier et douchette.
- Désactivé : opacité 0,5, pas de changement de forme.
- Mouvement réduit : désactiver les transitions (déjà dans `tokens.css`).

### 6.13 DurationButton (saisie rapide)
Quatre boutons en grille 2 x 2, gap 12 (14). Hauteur min 104 (124), rayon 20 (22), fond `--color-surface`, ombre `--shadow-key`, sans bordure. Contenu centré en colonne, gap 6 :
1. Titre : "+3 j", "+1 sem", "+2 sem", "+1 mois" (32 / 38, 900).
2. Date obtenue : "mar. 20 oct." (15 / 17, 700, `--color-ink-muted`).
3. Étiquette du statut résultant : petit rectangle arrondi (padding 3 12, rayon `--radius-tag-sm` 10, 14 / 900, 15 en tablette) avec "3 jours", "7 jours", "14 jours", "31 jours", coloré selon 4.1.
Durées : +3 jours, +7 jours, +14 jours, +1 mois calendaire. Un tap valide immédiatement la date, sans confirmation, et passe au produit suivant de la file.

### 6.14 ProductSummaryCard (produit scanné)
Carte rayon 22, fond `--color-surface`, ombre `--shadow-card`, padding 16, gap 14 (16), alignée au centre. Tuile d'icône (6.4), puis : étiquette "Code-barres lu" (13 / 800 majuscules, espacement 1, `--color-ink-muted`), nom (24 / 28, 900, interligne 1.15), précision (conditionnement) 15 / 17 en `--color-ink-muted`.

### 6.15 StepProgress (progression du rangement)
Texte "Rangement · 2 sur 5" (16 / 19, 900) et en dessous des segments : flex 1, hauteur 8, rayon 4, gap 6. Segment fait : `--color-ink-muted`. Segment en cours : `--color-ink`. Segment à venir : `--color-line`.
Écart volontaire par rapport aux maquettes, où les segments faits étaient verts : le vert est réservé à la péremption.

### 6.16 QuickEntry (carte de saisie rapide), assemblage
Ordre : en-tête (fermer + progression) → ProductSummaryCard → question "Où tu le ranges ?" + trois FilterChip (Frigo, Congélo, Placard, largeur égale, hauteur 48 puis 56) → question "Il se garde combien de temps ?" → grille de DurationButton → barre du bas (SecondaryButton "Autre date" qui prend la place restante + TextButton "Passer").
- Téléphone : écran plein, barre du bas fixée, contenu qui n'est jamais masqué par la barre.
- Tablette : panneau à droite, largeur 500, pleine hauteur, fond `--color-bg`, bordure gauche 2 px `--color-line`, ombre `--shadow-panel`, padding 28, au-dessus d'un voile `--color-scrim` qui recouvre la liste. Entrée : glissement depuis la droite en 220 ms (`--ease-out`). Barre du bas du panneau : padding 14 28 24.
L'emplacement choisi est mémorisé d'un produit à l'autre dans une même session de rangement.

### 6.17 Formulaires (connexion, ajout manuel)
- Champ texte : hauteur 56, rayon 14, bordure 2 px `--color-line`, fond `--color-surface`, texte 18 / 700, padding horizontal 16. Focus : bordure `--color-ink` + `--focus-ring`. Erreur : bordure et message en `--color-danger`, message 15 / 700 sous le champ.
- Étiquette : au-dessus du champ, 16 / 800, marge basse 8.
- Sélecteur de catégorie : grille de 3 colonnes (4 en tablette) de tuiles cliquables ; chaque tuile : hauteur min 80, rayon 16, bordure 2 px `--color-line`, fond de la teinte de famille, icône 32 centrée + nom 14 / 800 dessous. Sélectionnée : bordure 3 px `--color-ink`.
- Quantité : bouton moins, nombre (24 / 900), bouton plus ; boutons 56 x 56, rayon 14, bordure 2 px `--color-ink`.
- Date de péremption : les 4 DurationButton + SecondaryButton "Autre date" qui ouvre le sélecteur de date natif.
- Validation : PrimaryButton pleine largeur dans la barre du bas.

---

## 7. Écrans existants : comment les restyler

### 7.1 Connexion
Fond `--color-bg`, contenu centré verticalement. Carte de 420 px maximum, rayon 22, fond `--color-surface`, ombre `--shadow-card`, padding 28. En haut : pictogramme frigo (section 5.2) dans une tuile 72 x 72, rayon 20, fond `--color-primary`, trait `--color-on-primary`. Titre "Mon frigo" 32 / 900, sous-titre en `--color-ink-muted`. Champs selon 6.17, PrimaryButton pleine largeur (hauteur 60). Messages d'erreur sous le champ concerné.

### 7.2 Liste filtrable par emplacement
Téléphone : en-tête (titre 32 + "N produits" en muted aligné à droite sur la même ligne de base) → rangée de FilterChip → sections avec ProductRow → BottomBar (bouton "+" carré arrondi + PrimaryButton "Scanner"). Tablette paysage : rail (6.11) + zone principale avec marges 28 32 0, sections en grille de 2 colonnes. Le comportement du filtre ne change pas.

### 7.3 Formulaire d'ajout
Mêmes composants que 6.17, dans une page ou une carte selon la structure actuelle. En tablette : carte centrée de 640 px maximum.

### 7.4 Carte de saisie rapide et mode rangement (file de produits)
Voir 6.16. Le mode rangement est cette carte répétée sur chaque produit de la file, avec StepProgress. Fin de file : écran de confirmation simple (tuile avec coche en encre, "N produits rangés", PrimaryButton "Retour au frigo"). Annulation : après un tap sur une durée, afficher 5 secondes un message discret en bas ("Ajouté · Annuler") : carte rayon 16, fond `--color-ink`, texte `--color-ink-inverse` 16 / 800, bouton Annuler souligné.

### 7.5 Scan caméra plein écran
Le flux caméra occupe tout l'écran. Par-dessus :
- Voile sombre `rgba(0,0,0,0.5)` autour d'un cadre de visée aux coins arrondis (rayon 28), avec quatre coins en trait de 4 px de couleur #FFF4E6.
- En haut : IconButton "Fermer" à gauche et bouton lampe à droite (52 x 52, rayon 16, fond `--color-surface`).
- En bas : feuille de rayon 24 24 0 0, fond `--color-surface`, avec l'instruction "Place le code-barres dans le cadre" (18 / 800) et un SecondaryButton "Saisir à la main".
- Au code détecté : transition vers la carte de saisie rapide (6.16) avec le produit reconnu.
- Mode douchette : un indicateur "Prêt à scanner" (texte 16 / 800 dans un rectangle arrondi rayon 12, fond `--color-surface`) en haut de la liste ou de la saisie.

---

## 8. Écrans à venir (à construire dans cette direction)

Ces écrans n'ont pas été maquettés : ce sont des directives. Les écarts raisonnables sont acceptés, mais en respectant les principes de la section 1 et les composants de la section 6.

### 8.1 Vue cuisine plein écran (iPad paysage, lue à 2 m)
- Plein écran, sans rail ni barre d'actions. Seule commande : un bouton discret "Quitter" en haut à droite (56 x 56, rayon 16, fond `--color-surface`, bordure `--color-line`).
- En-tête : "Mon frigo" 44 / 900 à gauche ; date et heure en 28 / 800 `--color-ink-muted` à droite.
- Section "À manger vite" en haut, en 3 colonnes de grandes cartes : tuile d'icône 88 (icône 52), nom 30 / 900, détail 20 / 700, pastille carrée 112 x 112 (rayon 20, chiffre 52 / 900, unité 18 / 800). Rayon de carte 24, padding 14.
- Sections "Cette semaine" et "Plus tard" plus compactes : cartes de la liste tablette (6.3) en 2 colonnes. S'il y a trop de produits pour tenir sans défiler, afficher les plus urgents et un compteur "+ N autres produits" plutôt qu'un défilement (l'écran n'est pas touché pendant la lecture).
- Texte jamais sous 20 px sauf l'unité de pastille. Pour les textes de détail, privilégier `--color-ink` plutôt que `--color-ink-muted` (contraste plus fort à distance).
- Rafraîchissement : recalcul des jours à minuit. Si possible, garder l'écran allumé tant que cette vue est ouverte (Screen Wake Lock, avec repli silencieux si indisponible).

### 8.2 Recettes suggérées
- Tri par nombre de produits "à manger vite" utilisés, puis par temps de préparation.
- Carte de recette : rayon 20, fond `--color-surface`, ombre `--shadow-card`, padding 16. Ligne du haut : tuile d'icône `plat` (64) + titre 24 / 900 + durée dans une étiquette neutre (rectangle arrondi rayon 12, fond `--color-surface-sunken`, texte `--color-ink`, pas de couleur de statut). Dessous : "Utilise" suivi de petites étiquettes par ingrédient du frigo (nom + "2 j"), colorées selon le statut de ce produit, rayon `--radius-tag` 12, texte 15 / 800.
- Tablette : liste de recettes à gauche (grille 2 colonnes) ; détail en panneau à droite comme la saisie rapide (500 px, même ombre et voile). Téléphone : liste puis détail en page.
- Détail : ingrédients en lignes de 56 px avec case à cocher carrée arrondie (28 x 28, rayon 8, bordure 2 px `--color-ink`, coche en encre), puis étapes numérotées dans des carrés arrondis 40 x 40 (rayon 12, fond `--color-surface-sunken`).
- Pas de photo imposée. Si des visuels de recettes sont ajoutés plus tard, rayon 18 et ratio 4:3.

### 8.3 États vides
Liste vide : tuile 88 avec le pictogramme frigo, titre "Le frigo est vide" (24 / 900), texte en `--color-ink-muted`, PrimaryButton "Scanner" dessous. Aucune illustration supplémentaire.

---

## 9. PWA

- `<meta name="color-scheme" content="light">` et `<meta name="theme-color" content="#FFF4E6">`.
- Manifest : `background_color` et `theme_color` à `#FFF4E6`.
- Icône d'app : carré arrondi `--color-primary` (#C2410C) avec le pictogramme frigo en #FFF4E6, marge de sécurité de 20 % pour l'icône "maskable".
- Barres fixes : `padding` avec `env(safe-area-inset-top/bottom)`. Pas de fausse barre d'état.
- Précacher la police Nunito (woff2) avec le reste de l'app.

---

## 10. Checklist de recette visuelle

- [ ] Aucune couleur, aucun rayon, aucune ombre en dur : tout vient des variables.
- [ ] Aucune trace de mode sombre (pas de media query, pas de variables ou de bascule de thème).
- [ ] Rouge, orange, vert uniquement sur les indicateurs de péremption (et jamais sans texte des jours).
- [ ] Pastille de péremption carrée partout : 60 x 60 sur téléphone, 76 x 76 sur tablette, deux lignes.
- [ ] Aucun bouton ou pastille rond ou en gélule : tous les coins sont ceux des tokens.
- [ ] Cibles tactiles : 48 px minimum sur téléphone, 56 px sur tablette (y compris "Passer" et les boutons icône).
- [ ] Texte jamais sous 14 px (12 px seulement pour l'unité de la pastille sur téléphone).
- [ ] Contrastes AA vérifiés sur la liste, la saisie rapide et le formulaire.
- [ ] Sections "À manger vite / Cette semaine / Plus tard" correctes, expirés en premier.
- [ ] Libellés de pastille : "0 jour", "1 jour", "N jours", "Expiré / hier".
- [ ] Icône de catégorie présente sur chaque produit (repli `autre`), décorative.
- [ ] Panneau de saisie tablette : voile, ombre, glissement 220 ms, respect de `prefers-reduced-motion`.
- [ ] PWA : theme-color clair, police en local, hors ligne OK.
