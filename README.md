# Frigo

Inventaire de frigo avec dates de péremption : scan de code-barres, affichage sur tablette de cuisine, suggestions de recettes anti-gaspi. Application personnelle (voir `CLAUDE` pour la feuille de route).

## Stack
- Vite + React (JavaScript)
- Supabase : Postgres, Auth, Realtime, Edge Functions
- GitHub Pages + GitHub Actions pour l'hébergement

## Déploiement (GitHub Pages)
1. Supabase : exécuter `supabase/schema.sql` dans SQL Editor, créer un utilisateur (Authentication > Users).
2. GitHub : Settings > Secrets and variables > Actions, ajouter `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (clé `anon` uniquement).
3. GitHub : Settings > Pages > Source = **GitHub Actions**.
4. Tout push sur `main` build et déploie sur `https://<pseudo>.github.io/Frigo/`.

Les noms des variables sont dans `.env.example`. Ne jamais commiter de vraies valeurs.
