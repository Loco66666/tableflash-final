# TableFlash - Contexte Audit Et Reprise

Derniere mise a jour: 2026-06-04

Ce fichier est le point d'entree obligatoire avant toute reprise de developpement.

## Regle De Reprise

Avant de coder:

1. Lire `AGENTS.md`.
2. Lire `docs/ROADMAP_MVP_RESTAURANT_PILOTE.md`.
3. Lire ce fichier.
4. Verifier `git status --short`.
5. Ne pas toucher aux changements utilisateur non lies a la tache.

## Etat Produit Actuel

TableFlash est un SaaS mobile-first pour restaurateurs:

- dashboard restaurateur,
- menu QR,
- QR par table,
- commandes client,
- suivi commande,
- avis apres repas,
- statistiques simples,
- settings restaurant,
- admin SaaS.

Le MVP pilote vise un service restaurant reel avec paiement sur place uniquement.

## Routes Critiques

Routes publiques:

- `/`
- `/site`
- `/site/tarifs`
- `/tarifs`
- `/comment-ca-marche`
- `/login`
- `/logout`
- `/auth/callback`
- `/unauthorized`
- `/r/[restaurant]`
- `/r/[restaurant]/table/[table]`

Dashboard restaurateur:

- `/dashboard`
- `/dashboard/orders`
- `/dashboard/menu`
- `/dashboard/qr`
- `/dashboard/reviews`
- `/dashboard/statistics`
- `/dashboard/settings`
- `/dashboard/help`
- `/dashboard/more`

Admin:

- `/admin`
- `/admin/restaurants`
- `/admin/restaurants/new`
- `/admin/restaurants/[id]`
- `/admin/requests`
- `/admin/analytics`

API:

- `/api/ai/product-description`

## Supabase - Tables Attendues

Tables coeur:

- `profiles`
- `restaurants`
- `restaurant_members`
- `restaurant_settings`
- `restaurant_tables`
- `menu_categories`
- `menu_products`
- `orders`
- `order_items`
- `restaurant_reviews`
- `restaurant_applications`
- `admin_events`
- `subscriptions`

Decision de nommage:

- Le depot actuel utilise `menu_products`.
- `menu_items` etait un ancien vocabulaire de brief.
- Ne pas renommer vers `menu_items` sans migration produit dediee.

## Supabase - Colonnes Critiques

`orders`:

- `order_number`
- `table_label`
- `order_type`
- `subtotal_cents`
- `total_cents`
- `currency`
- `payment_method`
- `payment_status`

`order_items`:

- `restaurant_id`
- `menu_item_id`
- `selected_options`
- `unit_price_cents`
- `total_cents`

`menu_products`:

- `options_config`
- `is_available`
- `is_featured`

`restaurant_reviews`:

- `status`
- `response`
- `response_saved`
- `suggest_google`

## Supabase - Storage

Bucket attendu:

- `menu-product-images`

Regle:

- les fichiers sont stockes sous le prefixe `{restaurant.id}/...`,
- upload/update/delete uniquement pour owner/staff du restaurant,
- lecture publique acceptee pour afficher les photos du menu QR.

## Validation Supabase Cible

Validation lecture seule effectuee le 2026-06-04 sur le projet Supabase cible:

- table `restaurants`: OK,
- colonne `orders.order_number`: OK,
- table `restaurant_reviews`: OK,
- colonne `menu_products.options_config`: OK,
- bucket `menu-product-images`: OK.
- colonnes `orders.table_label`, `orders.currency`, etc.: manquantes,
- colonnes normalisees `order_items.restaurant_id`, etc.: manquantes.

Conclusion:

- le schema distant est seulement partiellement aligne,
- la migration `010` reste necessaire dans le depot pour reconstruire ou reparer une base,
- prochaine etape: appliquer la migration `010` via Supabase SQL Editor ou CLI, puis tester le parcours restaurant complet sur la base cible.

## Auth Et Securite

Principes:

- aucun service role en composant client,
- aucun `restaurant_id` client de confiance,
- les Server Actions dashboard derivent toujours le restaurant via `getCurrentRestaurantContext()`,
- les routes dashboard exigent `restaurant_owner` ou `restaurant_staff`,
- les routes admin exigent `super_admin`,
- RLS ne doit pas etre desactivee.

## Validation Obligatoire

Commandes:

```bash
npm.cmd run lint
npm.cmd run build
git grep -I -n -e "<mojibake-C3>" -e "<mojibake-C2>" -e "<mojibake-E2>" -- src docs supabase
git status --short
git diff --stat
```

Tests manuels prioritaires:

1. Login admin.
2. Creer restaurant.
3. Login restaurant owner.
4. Creer categorie menu.
5. Creer produit disponible.
6. Ouvrir QR table.
7. Verifier produit visible.
8. Envoyer commande.
9. Traiter commande jusqu'a `served`.
10. Envoyer avis client.
11. Verifier avis dashboard.

## Ordre De Reprise

1. Stabiliser schema Supabase.
2. Corriger encodage/mojibake.
3. Valider lint/build.
4. Valider onboarding restaurant.
5. Valider menu.
6. Valider QR.
7. Valider commandes.
8. Valider avis.
9. Ajouter export commandes.
10. Ajouter refresh/live commandes.
11. Preparer pilote.

## Go/No-Go Pilote

Go si:

- schema coherent,
- migrations suffisantes,
- lint OK,
- build OK,
- aucun mojibake,
- QR bon restaurant/bonne table,
- commande client visible dashboard,
- produit indisponible non commandable,
- avis post-service fonctionnel.

No-go si:

- build echoue,
- table ou restaurant incorrect,
- commande invisible,
- RLS douteuse,
- service role expose,
- base non reconstruisible.
