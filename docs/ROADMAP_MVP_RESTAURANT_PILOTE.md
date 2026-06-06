# TableFlash - Roadmap MVP Restaurant Pilote

Version: 2026-06-06

Objectif: amener TableFlash d'un produit proche MVP a une plateforme fiable, exploitable par un restaurant pilote, puis capable d'accueillir progressivement 10, 50, 100, puis 1000 restaurants sans rupture produit, technique ou operationnelle.

Cette roadmap doit rester le fil directeur du projet. Toute nouvelle tache doit etre rattachee a une phase, un sprint, un risque ou un critere de validation de ce document.

---

## 1. Vision produit

TableFlash est un SaaS mobile-first pour restaurateurs.

Le restaurateur doit pouvoir:

1. Creer et maintenir son menu depuis un telephone.
2. Gerer les ruptures et disponibilites en quelques secondes.
3. Generer des QR codes fiables par table.
4. Recevoir des commandes clients sans friction.
5. Suivre les commandes pendant le service.
6. Encaisser sur place sans confusion.
7. Demander des avis apres le repas.
8. Voir les chiffres utiles du service.
9. Configurer son restaurant sans aide technique.
10. Faire confiance a l'outil pendant un vrai service.

Le client final doit pouvoir:

1. Scanner un QR.
2. Voir le bon restaurant et la bonne table.
3. Parcourir le menu sans explication.
4. Ajouter des produits au panier.
5. Envoyer une commande.
6. Suivre son statut.
7. Laisser un avis quand le repas est termine.

La promesse MVP:

- Menu QR.
- Commande a table.
- Paiement physique uniquement.
- Dashboard restaurateur mobile-first.
- QR par table.
- Avis post-repas.
- Statistiques simples.
- Onboarding restaurant pilote controle.

Hors MVP:

- Paiement Stripe client.
- Caisse complete.
- Impression cuisine avancee.
- Programme fidelite complet.
- Multi-sites avances.
- Stocks quantitatifs complexes.
- Marketplace.
- Application native.

---

## 2. Persona restaurateur

Le produit doit etre pense depuis le role d'un restaurateur en service.

Contexte reel:

- Il utilise souvent un telephone ou une tablette.
- Il est interrompu.
- Il n'a pas le temps de comprendre une interface compliquee.
- Il doit voir les nouvelles commandes vite.
- Il doit masquer un produit en rupture vite.
- Il doit imprimer ou partager un QR sans se tromper.
- Il doit savoir si le service est ouvert ou ferme.
- Il doit pouvoir deleguer a un staff sans risque de melange de restaurants.

Regle produit:

Si une action critique prend plus de 10 secondes en service, elle doit etre simplifiee.

Actions critiques:

- Accepter une commande.
- Marquer payee.
- Passer en preparation.
- Marquer prete.
- Marquer servie.
- Rendre un produit indisponible.
- Reactiver un produit.
- Copier un lien QR.
- Ouvrir le menu client.

---

## 3. Etat actuel synthetique

Deja present:

- Next.js App Router.
- Supabase SSR.
- Auth restaurateur/admin.
- Dashboard restaurateur protege.
- Admin protege.
- Menu dashboard connecte a Supabase via `menu_categories` et `menu_products`.
- QR dashboard connecte a `restaurant_tables`.
- Page client QR connectee.
- Creation de commandes publiques.
- Dashboard commandes.
- Avis client apres service.
- Dashboard avis.
- Statistiques simples.
- Settings restaurant.
- Rate limit public/IA en cours.
- Marketing public.

Statut des problemes avant pilote:

Traite le 2026-06-04:

- `CODEX_AUDIT_CONTEXT.md` cree.
- Migration de rattrapage ajoutee pour aligner le schema attendu par le code.
- `restaurant_reviews` aligne via migration `010`.
- `orders.order_number` aligne via migration `010`.
- `menu_products` confirme comme nom canonique du depot actuel.
- Bucket Storage `menu-product-images` documente et cree via migration `010`.
- Deux mojibakes reels corriges dans `src/app/r/[restaurant]/table/[table]/actions.ts`.
- `npm.cmd run lint` OK.
- `npm.cmd run build` OK.
- Grep mojibake OK.

Valide le 2026-06-05:

- Migration `010` appliquee sur l'environnement Supabase cible.
- Parcours QR complet valide sur vraie base: client scanne, commande, suivi, commande servie, avis post-repas.
- Dashboard restaurateur valide: commandes recues, transitions de statut, paiement sur place, refresh intelligent.
- Export commandes CSV disponible depuis `/dashboard/orders`.
- Aide restaurateur enrichie: checklist pilote, support, rituel avant/pendant/fin de service.
- Redis retire du chemin critique: fallback memoire accepte pour le pilote leger.
- Deploiement Vercel valide apres suppression de l'integration Redis suspendue.

Reste a traiter avant pilote terrain:

- Onboarder un vrai restaurant pilote avec nom, slug, tables et menu reels.
- Observer un service accompagne avec un restaurateur.
- Noter uniquement les frictions reelles observees pendant le service.
- Corriger les petites finitions terrain sans ajouter de feature lourde.
- Reporter Stripe, fidelite, stock quantitatif et refontes design apres retour terrain.
- Reporter Stripe hors MVP pilote, sauf decision business contraire.

---

## 4. Definition du MVP pilote

Le MVP pilote est atteint quand un restaurant peut faire un service reel limite avec TableFlash.

Le restaurant pilote doit pouvoir:

- Se connecter.
- Verifier son nom, son slug et ses reglages.
- Creer categories et produits.
- Ajouter photos produit.
- Masquer/reactiver un produit.
- Creer au moins 10 tables.
- Imprimer ou copier les QR.
- Recevoir une commande depuis une table.
- Faire progresser la commande jusqu'a servie.
- Voir le suivi cote client.
- Recevoir un avis apres service.
- Voir les statistiques de base.
- Exporter au minimum les commandes du jour en CSV.

Le MVP pilote n'est pas atteint si:

- Une commande peut disparaitre.
- Une table ouvre le mauvais restaurant.
- Un produit indisponible reste commandable.
- Le dashboard affiche un autre restaurant.
- La base ne peut pas etre reconstruite depuis les migrations.
- Le build production echoue.
- Un utilisateur client peut injecter un `restaurant_id`.
- Le service role est expose au client.

---

## 5. Phase 0 - Stabilisation immediate

Objectif: rendre le depot coherent, buildable et verifiable avant toute nouvelle feature.

### Sprint 0.1 - Nettoyage contexte et audit permanent

Taches:

1. Creer ou retrouver `CODEX_AUDIT_CONTEXT.md`.
2. Y documenter:
   - etat actuel,
   - schema Supabase attendu,
   - dernier audit,
   - routes critiques,
   - commandes de validation,
   - decisions produit.
3. Ajouter un lien vers cette roadmap.
4. Mettre a jour `docs/AUDIT_FOLLOW_UP.md` avec les incoherences restantes.

Critere d'acceptation:

- Un nouveau developpeur peut reprendre le projet sans demander "on en etait ou ?".

Validation:

- Lire `CODEX_AUDIT_CONTEXT.md`.
- Lire cette roadmap.
- Verifier que les deux documents ne se contredisent pas.

### Sprint 0.2 - Correction mojibake

Taches:

1. Corriger les deux messages mal encodes dans `src/app/r/[restaurant]/table/[table]/actions.ts`.
2. Relancer:
   - `git grep -I -n -e "Ã" -e "Â" -e "â" -- src docs supabase`
3. Corriger tout retour.
4. Verifier que les textes UI francais restent lisibles.

Critere d'acceptation:

- La commande `git grep` ne retourne rien.

### Sprint 0.3 - Build et lint

Taches:

1. Lancer `npm.cmd run lint`.
2. Lancer `npm.cmd run build`.
3. Corriger toute erreur TypeScript, Next ou runtime de build.
4. Documenter les erreurs corrigees.

Critere d'acceptation:

- Lint OK.
- Build OK.
- Pas de warning bloquant.

Note:

- `npm run lint` peut etre bloque par PowerShell. Utiliser `npm.cmd run lint`.

---

## 6. Phase 1 - Supabase fiable

Objectif: rendre la base reconstruisible, coherente et securisee.

### Sprint 1.1 - Audit schema reel vs migrations

Taches:

1. Comparer la base Supabase reelle avec les migrations du depot.
2. Verifier l'existence des tables:
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
3. Verifier les colonnes critiques:
   - `orders.order_number`
   - `orders.table_label`
   - `orders.order_type`
   - `orders.subtotal_cents`
   - `orders.total_cents`
   - `orders.currency`
   - `orders.payment_method`
   - `order_items.restaurant_id`
   - `order_items.menu_item_id`
   - `order_items.selected_options`
   - `menu_products.options_config`
4. Verifier le bucket:
   - `menu-product-images`
5. Verifier les policies RLS et Storage.

Critere d'acceptation:

- Un document liste exactement ce qui existe en base.
- Toute difference avec les migrations est connue.

### Sprint 1.2 - Migration de rattrapage schema

Taches:

1. Ajouter une migration idempotente pour aligner le schema.
2. Si `restaurant_reviews` est la table cible:
   - creer `restaurant_reviews` si absente,
   - migrer les donnees de `reviews` si necessaire,
   - ajouter indexes,
   - activer RLS,
   - ajouter policies staff/admin.
3. Si `reviews` est la table cible:
   - adapter le code et les types pour utiliser `reviews`.
4. Ajouter `orders.order_number` si absent.
5. Ajouter generation d'un numero de commande par restaurant si necessaire.
6. Ajouter contraintes utiles:
   - status commande,
   - payment status,
   - order type,
   - quantites positives,
   - prix positifs.
7. Ajouter indexes:
   - commandes par restaurant/date,
   - commandes par statut,
   - items par commande,
   - avis par restaurant/date,
   - produits par restaurant/categorie.

Critere d'acceptation:

- La base neuve peut etre creee avec les migrations.
- Les pages existantes ne cassent pas.

### Sprint 1.3 - RLS dashboard et public

Taches:

1. Verifier que `restaurant_owner` et `restaurant_staff` peuvent select/insert/update/delete:
   - categories,
   - produits,
   - tables,
   - commandes,
   - avis,
   - settings.
2. Verifier que staff ne peut pas lire un autre restaurant.
3. Verifier que public peut seulement lire:
   - restaurants actifs/trial,
   - tables actives,
   - categories actives,
   - produits disponibles.
4. Verifier que public ne peut pas lire dashboard data sensible.
5. Eviter toute policy recursive.
6. Ne jamais desactiver RLS.

Critere d'acceptation:

- Tests manuels RLS OK avec au moins:
  - super_admin,
  - restaurant_owner A,
  - restaurant_owner B,
  - anon.

### Sprint 1.4 - Storage images produit

Taches:

1. Creer bucket `menu-product-images`.
2. Definir si bucket public ou signe.
3. Si public:
   - lecture publique,
   - upload uniquement owner/staff du restaurant,
   - chemin force `restaurant.id/file`.
4. Ajouter documentation de setup.
5. Tester upload depuis dashboard menu.
6. Tester affichage public QR.

Critere d'acceptation:

- Un restaurateur peut ajouter une photo.
- La photo apparait sur le menu client.
- Un restaurateur ne peut pas ecrire dans le dossier d'un autre restaurant.

---

## 7. Phase 2 - Parcours restaurant pilote complet

Objectif: rendre le parcours de creation et d'exploitation fluide.

### Sprint 2.1 - Onboarding admin restaurant

Taches:

1. Tester creation restaurant depuis `/admin/restaurants/new`.
2. Tester creation via demande `/admin/requests`.
3. Verifier:
   - user auth cree,
   - profile cree,
   - restaurant cree,
   - restaurant_members cree,
   - settings cree,
   - tables par defaut creees,
   - slug unique.
4. Ajouter feedback clair en cas d'erreur.
5. Documenter comment transmettre les identifiants au restaurateur.

Critere d'acceptation:

- Un admin peut onboarder un restaurant en moins de 5 minutes.

### Sprint 2.2 - Premiere configuration restaurateur

Taches:

1. Tester login owner.
2. Verifier redirection `/dashboard`.
3. Verifier `/dashboard/settings`.
4. Verifier modification:
   - nom,
   - ville,
   - adresse,
   - telephone,
   - email,
   - lien Google Avis,
   - horaires,
   - commandes activees/desactivees,
   - QR active/desactive,
   - avis actives/desactives.
5. Verifier slug:
   - unicite,
   - liens QR revalides,
   - ancien slug gere ou documente.

Critere d'acceptation:

- Le restaurateur voit son propre restaurant partout.
- Aucun affichage "Le Bistrot des Halles" sauf si c'est vraiment son restaurant.

### Sprint 2.3 - Menu pilote

Taches:

1. Creer categories:
   - Entrees,
   - Plats,
   - Desserts,
   - Boissons.
2. Creer produits avec:
   - nom,
   - description,
   - prix,
   - prix promo optionnel,
   - photo optionnelle,
   - disponibilite,
   - recommandation.
3. Modifier produit.
4. Supprimer produit jamais commande.
5. Desactiver produit deja commande.
6. Masquer/reactiver categorie.
7. Tester IA description avec auth.
8. Tester rate limit IA.
9. Tester affichage public QR apres chaque changement.

Critere d'acceptation:

- Tout produit disponible apparait cote client.
- Tout produit indisponible disparait cote client.
- Le prix affiche est correct.
- Le restaurateur comprend comment rendre un produit indisponible.

### Sprint 2.4 - Tables et QR pilote

Taches:

1. Creer 10 tables.
2. Verifier slugs uniques.
3. Copier lien.
4. Ouvrir lien client.
5. Voir QR.
6. Imprimer selection.
7. Desactiver table.
8. Verifier que la table desactivee ne permet plus de commander.
9. Reactiver table.
10. Verifier le lien:
    - `/r/{restaurant.slug}/table/{table.slug}`

Critere d'acceptation:

- Installation QR faisable en moins de 15 minutes pour un petit restaurant.

---

## 8. Phase 3 - Commande client et service live

Objectif: rendre le service fiable pendant une vraie exploitation.

### Sprint 3.1 - Commande client end-to-end

Taches:

1. Ouvrir QR table active.
2. Ajouter produit au panier.
3. Modifier quantite.
4. Ajouter note client.
5. Ajouter nom client.
6. Ajouter telephone optionnel.
7. Envoyer commande.
8. Verifier creation dans:
   - `orders`,
   - `order_items`.
9. Verifier total euros et centimes.
10. Verifier `restaurant_id` derive serveur.
11. Verifier table correcte.
12. Verifier produits indisponibles rejetes au submit.
13. Verifier restaurant suspendu bloque.
14. Verifier commandes desactivees bloquees.

Critere d'acceptation:

- Un client peut commander sans aide.
- Une commande invalide ne peut pas etre creee.

### Sprint 3.2 - Dashboard commandes operationnel

Taches:

1. Afficher commandes recentes.
2. Afficher lignes commande.
3. Afficher table/zone.
4. Afficher notes client.
5. Filtrer:
   - a traiter,
   - en preparation,
   - pretes,
   - terminees.
6. Transitions:
   - pending -> accepted/payment_pending,
   - payment_pending -> paid,
   - paid -> preparing,
   - preparing -> ready,
   - ready -> served,
   - pending -> rejected.
7. Tester rollback UI si Server Action echoue.
8. Revalider routes client.

Critere d'acceptation:

- Le restaurateur peut traiter une commande en moins de 10 secondes.

### Sprint 3.3 - Temps reel ou refresh intelligent

Taches:

1. Choisir strategie MVP:
   - Supabase Realtime,
   - polling leger,
   - bouton refresh visible,
   - combinaison polling + son discret.
2. Implementer nouvelles commandes visibles sans reload manuel lourd.
3. Ajouter indicateur "derniere mise a jour".
4. Ajouter alerte visuelle nouvelle commande.
5. Eviter surcharge a 1000 restaurants.

Critere d'acceptation:

- Une nouvelle commande apparait cote restaurateur en moins de 10 secondes.

### Sprint 3.4 - Suivi client

Taches:

1. Apres commande, afficher statut.
2. Polling toutes les 10 secondes ou realtime.
3. Mapper statuts clairement:
   - recue,
   - acceptee,
   - payee,
   - en preparation,
   - prete,
   - servie,
   - refusee.
4. Afficher numero commande.
5. Afficher total.
6. Gerer refus.
7. Gerer table/restaurant indisponible.

Critere d'acceptation:

- Le client comprend l'etat de sa commande sans demander au serveur.

---

## 9. Phase 4 - Avis, reputation et satisfaction

Objectif: transformer la fin de repas en avis utile.

### Sprint 4.1 - Avis client fiable

Taches:

1. Autoriser avis seulement apres commande `served`.
2. Empecher doublon par commande.
3. Stocker:
   - rating,
   - comment,
   - table,
   - order,
   - customer name,
   - suggest_google.
4. Respecter `reviews_enabled`.
5. Rate limit avis.
6. Message clair si avis deja envoye.

Critere d'acceptation:

- Un client ne peut pas spammer les avis.

### Sprint 4.2 - Dashboard avis

Taches:

1. Afficher avis actifs.
2. Trier positifs et recents.
3. Archiver avis.
4. Sauver reponse restaurateur si cette fonctionnalite reste dans le scope.
5. Afficher lien Google Avis.
6. Guider vers settings si lien absent.

Critere d'acceptation:

- Le restaurateur sait quels avis traiter.

### Sprint 4.3 - Boucle Google avis

Taches:

1. Pour note >= 4, proposer lien Google.
2. Pour note < 4, remercier sans pousser Google agressivement.
3. Verifier wording non agressif.
4. Verifier lien configurable.

Critere d'acceptation:

- TableFlash aide la reputation sans mauvaise experience client.

---

## 10. Phase 5 - Stock, ruptures et 86

Objectif: eviter qu'un client commande un produit indisponible.

### Sprint 5.1 - Disponibilite MVP

Taches:

1. Garder `is_available` comme source de verite MVP.
2. Ajouter filtre dashboard "Indisponibles" pleinement connecte.
3. Ajouter acces rapide depuis dashboard home.
4. Ajouter confirmation claire:
   - "Visible sur le menu client"
   - "Masque du menu client"
5. Verifier disparition cote QR.

Critere d'acceptation:

- Un restaurateur met un produit en rupture en moins de 5 secondes.

### Sprint 5.2 - Mode 86 simple

Taches:

1. Ajouter notion UI "Rupture service".
2. Option: reactiver automatiquement demain.
3. Ajouter champ `unavailable_until` si necessaire.
4. Ajouter badge "Rupture".
5. Ajouter liste "A reactiver".

Critere d'acceptation:

- Le restaurateur peut distinguer un produit supprime d'une rupture temporaire.

### Sprint 5.3 - Stock quantitatif hors MVP

Reporter sauf demande pilote forte.

Possibles champs futurs:

- `stock_tracking_enabled`
- `stock_quantity`
- `stock_low_threshold`
- `stock_updated_at`

Critere pour lancer:

- Au moins 3 restaurants pilotes demandent un stock quantitatif.

---

## 11. Phase 6 - Exports et pilotage business

Objectif: donner au restaurateur les donnees utiles sans complexite.

### Sprint 6.1 - Export commandes CSV

Taches:

1. Ajouter export commandes du jour.
2. Colonnes:
   - date,
   - heure,
   - numero,
   - table,
   - statut,
   - total,
   - paiement,
   - produits,
   - note client.
3. Filtrer par periode:
   - aujourd'hui,
   - 7 jours,
   - 30 jours.
4. Export seulement restaurant courant.
5. Pas de donnees autres restaurants.

Critere d'acceptation:

- Le restaurateur peut recuperer ses commandes du jour en un clic.

### Sprint 6.2 - Export statistiques simple

Taches:

1. Export ventes par jour.
2. Export top produits.
3. Export avis.
4. Ajouter documentation rapide.

Critere d'acceptation:

- Un restaurant pilote peut transmettre ses donnees a son comptable ou manager.

### Sprint 6.3 - Dashboard statistiques utile

Taches:

1. Verifier exactitude:
   - CA estime,
   - nombre commandes,
   - panier moyen,
   - top produits,
   - tables actives,
   - note moyenne.
2. Exclure commandes refusees/annulees du CA.
3. Clarifier "estime" si paiement sur place.

Critere d'acceptation:

- Le restaurateur comprend l'activite en moins de 20 secondes.

---

## 12. Phase 7 - Paiement et Stripe

Objectif MVP: paiement sur place uniquement.

Decision actuelle:

- Pas de Stripe pour le pilote initial.
- TableFlash ne traite pas le paiement client.
- Le dashboard gere seulement le statut "a encaisser" puis "payee".

### Sprint 7.1 - Clarification paiement sur place

Taches:

1. Verifier textes marketing.
2. Verifier textes QR.
3. Verifier dashboard orders.
4. Verifier settings.
5. Supprimer toute confusion "paiement en ligne".

Critere d'acceptation:

- Le client comprend qu'il paie sur place.
- Le restaurateur comprend qu'il marque la commande payee manuellement.

### Sprint 7.2 - Stripe SaaS restaurateur hors pilote

Quand lancer:

- Apres pilote stable.
- Quand au moins 10 restaurants doivent etre factures.

Taches futures:

1. Installer Stripe.
2. Creer products/prices.
3. Checkout abonnement restaurateur.
4. Webhook.
5. Synchronisation `subscriptions`.
6. Blocage ou limitation selon statut abonnement.
7. Portail client Stripe.

Critere d'acceptation:

- La facturation restaurateur est automatisee sans bloquer les operations restaurant.

---

## 13. Phase 8 - Fidelite

Objectif MVP: ne pas construire maintenant.

Decision:

- La fidelite est un axe produit futur.
- Ne pas l'ajouter avant un pilote operationnel.

Hypotheses futures:

- QR client avec numero telephone.
- Compteur visites.
- Offres simples.
- Coupon apres X commandes.
- Integration avis.

Condition de lancement:

- Le parcours commande doit etre stable.
- Les restaurateurs pilotes doivent demander la fonctionnalite.

---

## 14. Phase 9 - Admin SaaS et exploitation

Objectif: gerer plusieurs restaurants sans operations manuelles dangereuses.

### Sprint 9.1 - Admin restaurants

Taches:

1. Liste restaurants.
2. Detail restaurant.
3. Suspendre/reactiver.
4. Voir:
   - statut,
   - plan,
   - owner,
   - commandes,
   - tables,
   - avis,
   - settings.
5. Journal admin events.

Critere d'acceptation:

- Un admin peut diagnostiquer un restaurant en moins de 2 minutes.

### Sprint 9.2 - Support pilote

Taches:

1. Ajouter checklist installation restaurant.
2. Ajouter mode support:
   - voir slug,
   - voir tables,
   - voir dernieres commandes,
   - voir erreurs recentes si disponibles.
3. Documenter procedure incident.

Critere d'acceptation:

- En cas de probleme pendant service, le support sait quoi verifier.

---

## 15. Phase 10 - Qualite, tests et non-regression

Objectif: ne pas casser les flux critiques.

### Sprint 10.1 - Tests manuels obligatoires

Avant chaque livraison:

1. Login admin.
2. Creer restaurant.
3. Login owner.
4. Creer categorie.
5. Creer produit.
6. Creer table.
7. Ouvrir QR.
8. Envoyer commande.
9. Traiter commande.
10. Laisser avis.
11. Archiver avis.
12. Exporter commandes si disponible.
13. Lancer lint.
14. Lancer build.
15. Verifier mojibake.

Commandes:

```bash
npm.cmd run lint
npm.cmd run build
git grep -I -n -e "<mojibake-C3>" -e "<mojibake-C2>" -e "<mojibake-E2>" -- src docs supabase
git status --short
git diff --stat
```

Critere d'acceptation:

- Tous les points critiques passent avant pilote.

### Sprint 10.2 - Tests automatises prioritaires

Ordre recommande:

1. Tests unitaires helpers:
   - prix,
   - slugs,
   - statuts commandes,
   - filtres commandes,
   - normalisation settings.
2. Tests Server Actions avec mocks Supabase si faisable.
3. Tests Playwright:
   - login,
   - dashboard menu,
   - dashboard QR,
   - QR client,
   - commande,
   - orders dashboard.

Critere d'acceptation:

- Les regressions majeures sont detectees avant merge/deploiement.

### Sprint 10.3 - QA responsive

Viewports:

- 360px
- 390px
- 430px
- 768px
- 1024px
- 1366px

Verifier:

- Pas d'overflow horizontal.
- Boutons minimum 44px.
- Textes non coupes.
- Modales utilisables.
- Bottom nav accessible.
- QR lisibles.
- Panier client utilisable.
- Dashboard orders lisible en service.

Critere d'acceptation:

- Le produit reste mobile-first.

---

## 16. Phase 11 - Production et scalabilite

Objectif: tenir 10, 50, 100, puis 1000 restaurants.

### Palier 10 restaurants

Priorites:

1. Build production OK.
2. Migrations propres.
3. RLS valide.
4. Rate limit Redis/Upstash configure.
5. Logs erreurs surveilles.
6. Support manuel possible.
7. Backups Supabase confirmes.

Risques:

- Schema incoherent.
- Mauvais slug QR.
- Mauvais restaurant affiche.
- Commandes non rafraichies.

Critere d'acceptation:

- 1 a 3 restaurants pilotes peuvent faire un service accompagne.

### Palier 50 restaurants

Priorites:

1. Onboarding admin solide.
2. Exports commandes.
3. Monitoring erreurs.
4. Procedures support.
5. Nettoyage logs sensibles.
6. Realtime/polling optimise.
7. Documentation restaurateur.

Risques:

- Trop de support manuel.
- Pas assez de visibilite incidents.
- Rate limit memoire en production.

Critere d'acceptation:

- Les restaurants peuvent etre onboardes sans intervention developpeur.

### Palier 100 restaurants

Priorites:

1. Tests automatises critiques.
2. Facturation SaaS ou process commercial clair.
3. Admin analytics.
4. Alerting.
5. Gestion incidents.
6. Monitoring performance Supabase.
7. Indexes verifies.

Risques:

- Requetes lentes.
- Dashboard admin insuffisant.
- Dette produit sur support.

Critere d'acceptation:

- L'equipe peut gerer support, onboarding et incidents sans ouvrir la base directement.

### Palier 1000 restaurants

Priorites:

1. Observabilite complete.
2. Requetes optimisees.
3. Realtime dimensionne ou polling controle.
4. Facturation automatisee.
5. Separation environnements stricte.
6. Procedures backup/restore testees.
7. Support outille.
8. Limites produits:
   - nombre tables,
   - nombre produits,
   - taille images,
   - quotas IA,
   - quotas commandes abusives.
9. Securite renforcee:
   - audit RLS,
   - audit secrets,
   - logs sans donnees sensibles,
   - tests cross-tenant.

Risques:

- Cout Supabase/Redis.
- Explosion stockage images.
- Trop de requetes polling.
- Support non scalable.
- Bugs multi-tenant.

Critere d'acceptation:

- Chaque restaurant est isole.
- Les performances restent stables.
- Les incidents sont detectes avant les clients.

---

## 17. Indicateurs de qualite produit

Mesures restaurant:

- Temps pour creer un produit: cible moins de 45 secondes.
- Temps pour mettre en rupture: cible moins de 5 secondes.
- Temps pour creer une table QR: cible moins de 20 secondes.
- Temps pour traiter une commande: cible moins de 10 secondes.
- Temps nouvelle commande visible dashboard: cible moins de 10 secondes.

Mesures client:

- Temps scan -> menu lisible: cible moins de 2 secondes percu.
- Temps ajout panier: cible instantane.
- Temps commande envoyee: cible moins de 2 secondes apres confirmation.
- Taux erreurs commande: cible proche 0.

Mesures techniques:

- Lint OK.
- Build OK.
- Pas de mojibake.
- Pas de `any`.
- Pas de `ts-ignore`.
- Pas de service role client.
- Pas de fuite cross-tenant.
- Pas de route critique non protegee.

---

## 18. Checklist go/no-go restaurant pilote

Statut au 2026-06-05:

- Go technique MVP pilote atteint sur le parcours complet teste.
- Prochaine validation: service accompagne avec un vrai restaurant.
- Gel fonctionnel recommande jusqu'au premier retour terrain.

Go pilote si:

- Lint OK.
- Build OK.
- Migrations coherentes.
- `restaurant_reviews` ou `reviews` aligne.
- `orders.order_number` aligne.
- Bucket images OK.
- RLS testee.
- Menu CRUD OK.
- QR CRUD OK.
- Commande client OK.
- Dashboard orders OK.
- Suivi client OK.
- Avis client OK.
- Settings OK.
- Export commandes du jour disponible ou decision explicite de report.
- Documentation support disponible.

No-go pilote si:

- La base ne peut pas etre reconstruite.
- Une page dashboard critique casse.
- Un client peut commander un produit indisponible.
- Une table peut pointer vers le mauvais restaurant.
- Une commande n'apparait pas cote restaurateur.
- Le build echoue.
- Des secrets sont exposes cote client.
- Un restaurant peut acceder aux donnees d'un autre.

---

## 18.1 Gel fonctionnel avant retour terrain

Statut au 2026-06-06:

- Le parcours pilote complet a ete valide.
- Le test avec restaurateur a deja ete realise.
- Le gel fonctionnel strict est leve.
- La suite ne doit pas etre une accumulation de gadgets: chaque ajout doit faire gagner du temps, reduire une erreur en service, ameliorer la satisfaction client ou augmenter la valeur percue de l'abonnement.

Ne pas lancer pour le moment:

- Stripe.
- Fidelite.
- Stock quantitatif avance.
- Refonte design.
- Nouvelle logique complexe de caisse, impression ou multi-site.
- Fonctionnalite lourde qui ne sert pas directement le restaurateur pendant le service.

Autorise maintenant:

- Corrections de bugs reels observes.
- Ameliorations du menu restaurateur si elles accelerent la creation, le nettoyage ou la gestion des ruptures.
- Ameliorations du menu client si elles rendent la commande plus simple et plus fiable.
- Ameliorations des commandes si elles reduisent le stress pendant le service.
- Ameliorations QR si elles facilitent l'installation terrain.
- IA utile uniquement si elle fait gagner du temps au restaurateur ou ameliore la qualite du menu.

Regle:

Si une idee ne peut pas etre expliquee en une phrase comme un gain restaurateur, elle est mise en attente.

---

## 18.2 Roadmap SaaS restaurateur professionnel

Objectif:

Faire passer TableFlash de MVP pilote fonctionnel a produit SaaS professionnel, convaincant pour un restaurateur qui veut gagner du temps, eviter les erreurs, ameliorer l'experience client et justifier un abonnement.

Principe directeur:

Le restaurateur doit sentir en moins de 15 minutes que TableFlash lui evite du travail manuel, clarifie son service et donne une image plus professionnelle a son restaurant.

### Priorite 1 - Menu restaurateur ultra efficace

Pourquoi:

Le menu est la premiere douleur d'installation. Si le restaurateur doit tout saisir a la main ou nettoyer trop longtemps, il abandonne.

Objectifs:

1. Importer un menu par plusieurs photos.
2. Detecter les familles principales: Pizza, Sandwich, Tacos, Plats, Salades, Assiettes, Pates, Boissons, Desserts, Menus et formules.
3. Garder les sous-sections visibles dans la liste sans creer de nouveaux boutons inutiles.
4. Detecter les formules, options et supplements.
5. Proposer un ecran de validation rapide avant import.
6. Permettre le nettoyage massif: selection multiple, suppression, indisponibilite, deplacement de categorie.
7. Detecter les doublons, categories vides, produits sans prix, produits sans photo.
8. Permettre des modeles d'options reutilisables: sauces, viandes, tailles, supplements, boissons, menus.

Critere de validation:

- Un restaurateur peut importer et rendre exploitable un menu papier en moins de 20 minutes.
- Une rupture produit peut etre geree en moins de 5 secondes.
- Une categorie mal importee peut etre corrigee sans supprimer les produits un par un.

### Priorite 2 - Menu client fluide et fiable

Pourquoi:

Le client doit commander sans appeler le serveur pour comprendre le menu.

Objectifs:

1. Navigation claire par familles principales.
2. Sections internes lisibles dans chaque famille.
3. Recherche produit.
4. Produits indisponibles jamais commandables.
5. Options obligatoires visibles avant ajout panier.
6. Supplements avec prix clair.
7. Total du produit mis a jour en direct.
8. Panier modifiable: modifier options, quantite, suppression.
9. Message clair sur le paiement sur place.
10. Suivi apres commande stable jusqu'a avis ou nouvelle commande.

Critere de validation:

- Un client peut scanner, choisir un produit avec options, envoyer la commande et suivre son statut sans explication.

### Priorite 3 - Commandes restaurateur mode service

Pourquoi:

Pendant le rush, le restaurateur ne doit pas chercher les informations importantes.

Objectifs:

1. Nouvelles commandes tres visibles.
2. Son de service active volontairement, testable et assez fort.
3. Rappel visuel/sonore tant qu'une commande n'est pas acceptee.
4. Numero de commande, table, nom client, heure, total et options visibles.
5. Chronometre depuis reception.
6. Alertes retard.
7. Colonnes ou filtres clairs: a accepter, en preparation, pretes, servies.
8. Mode rush: masquer servies, voir uniquement commandes actives.
9. Actions rapides: accepter, refuser, preparer, prete, servie, payee.
10. Export CSV conserve et fiable.

Critere de validation:

- Une commande peut etre comprise et traitee en moins de 10 secondes.
- Une nouvelle commande ne peut pas etre ratee si le dashboard est ouvert.

### Priorite 4 - Accueil cockpit restaurateur

Pourquoi:

L'accueil doit dire immediatement si le restaurant est pret pour le service.

Objectifs:

1. Etat service: ouvert/ferme.
2. Commandes activees/desactivees.
3. QR actifs.
4. Produits indisponibles.
5. Produits sans photo ou incomplets.
6. Avis a traiter.
7. Derniere commande recue.
8. Bouton "Demarrer le service".
9. Boutons rapides: commandes, importer menu, ruptures, imprimer QR, tester menu client.
10. Alertes utiles: categories vides, QR non imprimes, menu incomplet.

Critere de validation:

- En arrivant sur l'accueil, le restaurateur sait en moins de 5 secondes ce qui demande son attention.

### Priorite 5 - QR installation terrain

Pourquoi:

Le QR est le point d'entree client. Il doit etre simple a installer et impossible a confondre.

Objectifs:

1. Planche QR propre par table.
2. Export PDF pret a imprimer.
3. Formats utiles: A6, chevalet, sticker.
4. Nom restaurant et nom table visibles.
5. Bouton "Tester ce QR".
6. Statut actif/desactive clair.
7. Derniere commande par table.
8. Nombre de commandes par table.
9. Desactivation temporaire d'une table.
10. Suppression protegee si historique de commandes.

Critere de validation:

- Un restaurant peut installer ses QR en moins de 15 minutes sans aide technique.

### Priorite 6 - Avis et satisfaction client

Pourquoi:

Les avis donnent une valeur business visible au restaurateur.

Objectifs:

1. Avis apres commande servie.
2. Avis positif: encouragement partage Google.
3. Avis negatif: retour prive et ton rassurant.
4. Reponses assistees par IA.
5. Copie rapide d'une reponse.
6. Moyenne, avis positifs, avis a traiter.
7. Detection de mots frequents: attente, froid, service, prix.

Critere de validation:

- Le restaurateur peut traiter un avis en moins de 30 secondes.

### Priorite 7 - Statistiques utiles

Pourquoi:

Les statistiques doivent aider a prendre des decisions simples.

Objectifs:

1. Nombre de commandes du jour.
2. Chiffre d'affaires estime.
3. Panier moyen.
4. Produits les plus vendus.
5. Produits jamais commandes.
6. Tables les plus actives.
7. Heures de pic.
8. Taux d'avis.
9. Note moyenne.
10. Export conserve.

Critere de validation:

- Le restaurateur peut savoir ce qui marche aujourd'hui sans ouvrir un tableur.

### IA autorisee dans le produit

L'IA doit rester un accelerateur, pas une dependance fragile.

Cas autorises:

1. Import menu par photo.
2. Nettoyage de menu: noms, categories, doublons.
3. Detection options/formules.
4. Descriptions produit courtes.
5. Reponse aux avis.
6. Assistant "pret pour le service".

Cas a eviter avant validation terrain:

- IA conversationnelle generale sans action concrete.
- Recommandations complexes non verifiables.
- Automatisation qui modifie le menu sans validation restaurateur.

### Ordre d'execution a partir du 2026-06-06

1. Finaliser menu restaurateur professionnel.
2. Finaliser menu client avec options/formules propres.
3. Renforcer commandes en mode service.
4. Construire accueil cockpit.
5. Ameliorer QR installation terrain.
6. Ajouter IA avis et satisfaction.
7. Ajouter statistiques metier.
8. Refaire un test terrain complet.
9. Ensuite seulement discuter Stripe SaaS, fidelite ou stock avance.

### Phrase de valeur cible

TableFlash doit pouvoir etre presente ainsi:

"Prenez votre menu en photo, installez vos QR, recevez les commandes a table, suivez le service et recuperez des avis clients sans outil complique."

---

## 19. Ordre de travail recommande

Ne pas commencer par Stripe, fidelite, stock avance ou refonte design.

Ordre strict:

1. Stabiliser schema Supabase. Fait.
2. Corriger mojibake. Fait.
3. Valider lint/build. Fait.
4. Tester onboarding admin. A refaire sur vrai restaurant pilote.
5. Tester settings restaurant. Valide sur base actuelle.
6. Tester menu dashboard. Valide sur base actuelle.
7. Tester QR dashboard. Valide sur base actuelle.
8. Tester commande client. Valide sur base actuelle.
9. Tester dashboard orders. Valide sur base actuelle.
10. Tester suivi client. Valide sur base actuelle.
11. Tester avis. Valide sur base actuelle.
12. Ajouter exports commandes. Fait.
13. Ajouter refresh/live commandes. Refresh intelligent fait.
14. Finaliser menu restaurateur professionnel.
15. Finaliser menu client options/formules.
16. Renforcer commandes mode service.
17. Construire accueil cockpit.
18. Ameliorer QR installation terrain.
19. Ajouter IA avis et satisfaction.
20. Ajouter statistiques metier.
21. Refaire un test terrain complet.
22. Ensuite seulement: Stripe SaaS, fidelite, stock avance.

---

## 20. Regle de decision produit

Chaque nouvelle idee doit repondre a au moins une question:

1. Est-ce que cela aide le restaurateur pendant le service ?
2. Est-ce que cela evite une erreur client ?
3. Est-ce que cela reduit le support ?
4. Est-ce que cela rend le pilote plus fiable ?
5. Est-ce que cela permet de scaler a plus de restaurants ?

Si la reponse est non, reporter.

---

## 21. Definition du produit final cible

TableFlash produit final doit etre:

- Simple pour un petit restaurant.
- Fiable pendant un service.
- Multi-tenant sans fuite.
- Mobile-first.
- Rapide.
- Facile a onboarder.
- Facile a supporter.
- Capable d'absorber de nombreux restaurants.
- Clair sur son modele de paiement.
- Sobre en fonctionnalites inutiles.

Le restaurateur ne doit jamais penser:

- "Je ne sais pas ou cliquer."
- "Est-ce que cette commande est bien partie ?"
- "Pourquoi ce produit est encore visible ?"
- "Pourquoi ce QR ouvre un autre restaurant ?"
- "Je dois appeler le support pour changer mon menu."

Le client final ne doit jamais penser:

- "Est-ce le bon restaurant ?"
- "Est-ce la bonne table ?"
- "Ma commande a-t-elle ete envoyee ?"
- "Je peux commander ce produit ou non ?"

---

## 22. Prochaine action immediate

La prochaine reprise de developpement doit commencer par:

1. Lire ce fichier.
2. Lire `docs/AUDIT_FOLLOW_UP.md`.
3. Verifier ou creer `CODEX_AUDIT_CONTEXT.md`.
4. Verifier que le dernier deploiement Vercel est vert.
5. Lancer lint/build avant toute modification.
6. Rattacher chaque nouvelle feature a la section 18.2.

Priorite absolue:

- Finaliser le menu restaurateur professionnel.
- Corriger le regroupement des familles et sous-sections.
- Fiabiliser import photo, options, formules et nettoyage massif.
- Ensuite finaliser le menu client avec options/formules propres.
- Puis renforcer commandes mode service et accueil cockpit.
