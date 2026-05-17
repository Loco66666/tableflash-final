# TableFlash — Master Prompt for Cline / Codex

You are rebuilding TableFlash from scratch as a strict mobile-first restaurant SaaS.

Repository:

C:\Users\courj\Desktop\tableflash-final

## Goal

Recreate the provided TableFlash mockups as closely as possible, but as a real functional Next.js app.

The app must be production-quality from the UI perspective and functional with local data.

## Strict product rules

- Mobile-first from 360px to 768px.
- Desktop is secondary.
- One-column layout on mobile.
- No horizontal overflow.
- No clipped text.
- No broken labels.
- No vague buttons.
- One primary action per screen.
- Advanced options hidden in simple sections.
- No Supabase.
- No Auth.
- No Stripe.
- No backend.
- Use localStorage only through safe client-side stores.
- Never read localStorage during SSR-visible initial render.
- Do not use Date.now or Math.random in SSR-visible render.
- Do not show words like mock, demo, local, backend, fake, placeholder or test data in the UI.

## Visual target

The UI must match the generated TableFlash mockups:

- white background
- green premium accent
- rounded cards
- soft shadows
- clear Lucide-style icons
- large touch targets
- bottom mobile navigation
- simple SaaS restaurant feel
- polished production-ready interface

## Main restaurateur routes

- /dashboard
- /dashboard/orders
- /dashboard/menu
- /dashboard/qr
- /dashboard/reviews
- /dashboard/statistics
- /dashboard/settings

## Customer route

- /r/bistrot-des-halles/table/1

## Required project structure

src/
  app/
    page.tsx
    dashboard/
      page.tsx
      orders/
        page.tsx
      menu/
        page.tsx
      qr/
        page.tsx
      reviews/
        page.tsx
      statistics/
        page.tsx
      settings/
        page.tsx
    r/
      [restaurant]/
        table/
          [table]/
            page.tsx
  components/
    layout/
      AppShell.tsx
      MobileBottomNav.tsx
      PageHeader.tsx
    ui-custom/
      ActionCard.tsx
      StatCard.tsx
      StatusBadge.tsx
      SectionCard.tsx
      OrderCard.tsx
      ProductCard.tsx
      TableQrCard.tsx
      ReviewCard.tsx
      CustomerProductCard.tsx
      CustomerCartBar.tsx
  lib/
    data/
      seed.ts
    local-store/
      menuStore.ts
      ordersStore.ts
      settingsStore.ts
      reviewsStore.ts
      tablesStore.ts
    types.ts
    utils.ts

## Current development order

1. App foundation and navigation
2. Dashboard home
3. Orders
4. Menu
5. QR
6. Reviews
7. Statistics
8. Settings
9. Customer QR ordering flow
10. QA and polish

## Before coding

Always identify:

1. target route
2. user goal
3. primary action
4. mobile layout
5. tablet layout
6. desktop fallback
7. what must not be touched

## After coding

Always report:

1. modified files
2. target route
3. mobile behavior
4. tablet behavior
5. desktop behavior
6. removed or simplified elements
7. lint result
8. build result
9. known limitations

## First task

Create the full app foundation only.

Implement:

1. AppShell
2. MobileBottomNav
3. PageHeader
4. shared card components
5. local seed data
6. safe localStorage stores
7. route skeletons for all screens
8. global theme matching the mockups

Do not deeply implement all business logic yet.
Do not change the product scope.
Do not add backend.