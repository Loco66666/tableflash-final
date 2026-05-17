# TableFlash — Mobile UI Rules

## Mobile-first

The main experience is mobile and tablet.

Target widths first:

- 360px
- 390px
- 430px
- 768px

Desktop is secondary.

## Layout rules

On mobile:

- one screen = one column
- one clear section at a time
- one primary action per screen
- no desktop grid
- no horizontal overflow
- no clipped text
- no broken labels
- no cards side-by-side if it harms readability

## Text rules

Forbidden:

- Établis / sement
- Command / es
- Évolut / ion
- labels broken letter by letter
- unclear short buttons

Buttons must say exactly what they do.

Bad:

- Preview
- Refresh
- Custom period
- Reorder

Better:

- Voir le menu client
- Actualiser les commandes
- Voir cette période
- Changer l’ordre des catégories

## Touch rules

Buttons and main actions:

- minimum height: 44px
- comfortable padding
- readable text
- clear tap target

## Visual style

The UI must match the TableFlash mockups:

- white background
- premium green accent
- rounded cards
- soft shadows
- clean icons
- large touch targets
- modern SaaS restaurant feel
- simple and polished
- no clutter

## Navigation

Main restaurateur navigation:

- Accueil
- Commandes
- Menu
- QR
- Plus

Inside Plus:

- Avis
- Statistiques
- Réglages
- Aide

If Avis is visible in the bottom nav for a specific version, keep labels short and readable.

## Responsive QA

Every screen must be checked at:

- 360px
- 390px
- 430px
- 768px
- 1024px
- 1366px

Validation:

- no horizontal scroll
- no clipped text
- no broken cards
- primary action visible
- bottom nav usable
- forms usable with finger