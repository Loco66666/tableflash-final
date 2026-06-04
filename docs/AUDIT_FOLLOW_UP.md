# Audit follow-up

## A surveiller plus tard

### Next.js / PostCSS audit npm

- Statut actuel : `npm audit` remonte 2 alertes moderees liees a `postcss < 8.5.10`, embarque par `next@16.2.6`.
- Decision : ne pas lancer `npm audit fix --force`, car npm propose un correctif inadapte qui reviendrait a changer fortement la version de Next.
- Action future : quand une version stable de Next embarque `postcss >= 8.5.10`, mettre a jour Next et `eslint-config-next`, puis valider.

Commandes de validation :

```bash
npm install next@latest eslint-config-next@latest
npm run lint
npx tsc --noEmit
npm run build
```

## Traite pendant l'audit

1. Creation de commande publique compatible avec la migration `007`.
2. Endpoint IA protege par authentification, roles et rate limit partage Redis/Upstash avec fallback memoire.
3. Garde-fou production sur le bypass d'authentification.
4. Rate limit Redis/Upstash et fallback memoire sur les commandes publiques et les avis.
5. Callback Supabase `/auth/callback` compatible avec les codes OAuth / magic links.
6. Types Supabase synchronises avec les migrations `007`, `008` et `009`.

## Priorites restantes

1. Configurer les variables Redis/Upstash dans Vercel si elles ne le sont pas encore. Voir `docs/VERCEL_PRODUCTION_CHECKLIST.md`.
2. Tester en conditions reelles le parcours QR : commande, suivi, service, avis. Voir `docs/VERCEL_PRODUCTION_CHECKLIST.md`.
3. Quand Next publie une version stable corrigeant PostCSS, faire la mise a jour controlee.
