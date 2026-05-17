# TableFlash — QA Checklist

Use this checklist before every commit.

## Global

- [ ] npm run lint passes
- [ ] npm run build passes
- [ ] no console error
- [ ] no hydration error
- [ ] no horizontal overflow
- [ ] no clipped text
- [ ] no broken labels
- [ ] no non-functional button
- [ ] no forbidden UI wording

## Mobile widths

Check:

- [ ] 360px
- [ ] 390px
- [ ] 430px
- [ ] 768px

For each width:

- [ ] one-column layout
- [ ] bottom nav usable
- [ ] primary action visible
- [ ] buttons are at least 44px high
- [ ] cards do not overflow
- [ ] forms are usable

## Desktop fallback

Check:

- [ ] 1024px
- [ ] 1366px
- [ ] layout remains clean
- [ ] desktop does not break mobile decisions

## Orders

- [ ] accept order works
- [ ] refuse order works
- [ ] mark paid works
- [ ] start preparation works
- [ ] mark ready works
- [ ] mark served works
- [ ] filters work
- [ ] refresh keeps data

## Menu

- [ ] add product works
- [ ] edit product works
- [ ] category filter works
- [ ] search works
- [ ] out of stock works
- [ ] promo works
- [ ] refresh keeps data

## QR

- [ ] add table works
- [ ] activate/deactivate works
- [ ] copy link works
- [ ] view QR works
- [ ] print preparation screen works

## Reviews

- [ ] reply works
- [ ] archive works
- [ ] suggest Google works for positive reviews
- [ ] Google link is configurable

## Settings

- [ ] establishment settings save
- [ ] opening hours save
- [ ] order settings save
- [ ] QR settings save
- [ ] Google review link saves
- [ ] appearance setting saves

## Customer flow

- [ ] customer menu loads
- [ ] unavailable products are hidden
- [ ] add to basket works
- [ ] quantity changes work
- [ ] note works
- [ ] confirm order creates dashboard order
- [ ] tracking screen is clear
- [ ] review prompt appears after meal