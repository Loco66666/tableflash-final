# TableFlash — Mobile-first Roadmap

## Sprint 1 — App foundation

Goal: create the mobile-first foundation without deep business logic.

Tasks:

1. AppShell
2. MobileBottomNav
3. PageHeader
4. shared cards
5. global visual theme
6. route skeletons
7. local seed data
8. safe localStorage helpers

Validation:

- all routes open
- no horizontal overflow
- mobile navigation works
- desktop remains usable
- lint passes
- build passes

## Sprint 2 — Accueil

Route:

- /dashboard

Goal:

The restaurant owner immediately understands:

- service status
- orders needing attention
- reviews needing attention
- products out of stock
- quick actions

Primary action:

- Voir les commandes

Validation:

- dashboard matches the mockup
- actions route correctly
- stats derive from local data where possible

## Sprint 3 — Commandes

Route:

- /dashboard/orders

Goal:

Manage orders in less than 10 seconds.

Required actions:

- accept order
- refuse order
- mark as paid
- start preparation
- mark ready
- mark served

Validation:

- order status changes
- filters work
- data persists after refresh

## Sprint 4 — Menu

Route:

- /dashboard/menu

Goal:

Manage products easily from a phone.

Required actions:

- add product
- edit product
- add category
- search product
- filter by category
- mark available/out of stock
- enable simple promo

Validation:

- form is mobile-friendly
- product list remains readable
- data persists after refresh

## Sprint 5 — QR

Route:

- /dashboard/qr

Goal:

Create and manage table QR codes quickly.

Required actions:

- add table
- activate/deactivate table
- copy customer link
- view QR
- prepare print selection

Validation:

- create a table and access its QR in under 30 seconds

## Sprint 6 — Avis

Route:

- /dashboard/reviews

Goal:

Use reviews as a reputation tool.

Required actions:

- reply
- archive
- suggest Google review for positive reviews
- manage Google review link

Validation:

- review workflow is simple
- no aggressive customer wording

## Sprint 7 — Statistiques

Route:

- /dashboard/statistics

Goal:

Show useful business numbers without BI complexity.

Required sections:

- orders
- estimated sales
- average basket
- customer rating
- activity chart
- top products
- active tables
- insights

Validation:

- restaurant owner understands the service in under 20 seconds

## Sprint 8 — Réglages

Route:

- /dashboard/settings

Goal:

Configure the restaurant without help.

Required sections:

- Établissement
- Horaires
- Commandes
- QR
- Avis Google
- Apparence

Validation:

- settings are simple
- sections are collapsible
- data persists after refresh

## Sprint 9 — Customer QR flow

Route:

- /r/bistrot-des-halles/table/1

Goal:

Customer orders without explanation.

Required flow:

- view menu
- filter categories
- add to basket
- confirm order
- follow order status
- leave review after meal

Validation:

- customer can order smoothly on mobile

## Sprint 10 — Final QA

Checks:

- mobile 360px
- mobile 390px
- mobile 430px
- tablet 768px
- tablet 1024px
- desktop 1366px
- lint
- build
- hydration
- localStorage
- navigation
- order flow
- menu flow
- QR flow
- review flow