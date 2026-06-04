# Vercel production checklist

## Variables d'environnement

Configurer dans Vercel, pour Production et Preview si necessaire :

Preflight local possible, sans afficher les secrets :

```bash
npm run check:prod-env
```

### Supabase

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` ou `SUPABASE_SERVICE_ROLE_KEY`

### OpenAI

- `OPENAI_API_KEY`

### Site

- `NEXT_PUBLIC_SITE_URL`

### Rate limit partage Redis / Upstash

Utiliser l'integration Redis du Marketplace Vercel ou Upstash, puis configurer une des paires suivantes :

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

ou :

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

Sans ces variables, l'application fonctionne avec un rate limit memoire local, mais ce fallback n'est pas suffisant pour une production multi-instance.

### Bypass auth

- Ne jamais activer `TABLEFLASH_AUTH_BYPASS` en production.
- `NEXT_PUBLIC_TABLEFLASH_AUTH_BYPASS` ne doit plus etre utilise. Le code ignore de toute facon le bypass en production.

## Tests de parcours QR avant mise en prod

1. Ouvrir un restaurant actif ou en essai.
2. Verifier qu'une table active existe.
3. Ouvrir `/r/{restaurant}/table/{table}`.
4. Ajouter un produit disponible au panier.
5. Envoyer une commande avec nom client et, si besoin, telephone/note.
6. Verifier dans `/dashboard/orders` que la commande apparait avec ses lignes.
7. Passer la commande en `accepted`, puis `paid`, puis `preparing`, puis `ready`, puis `served`.
8. Depuis le suivi client, verifier que le statut change correctement.
9. Envoyer un avis apres le statut `served`.
10. Verifier dans `/dashboard/reviews` que l'avis apparait.
11. Tester le rate limit en envoyant plusieurs commandes/avis depuis la meme table.

## Tests de securite

1. Appeler `/api/ai/product-description` sans session : doit retourner `401`.
2. Appeler `/api/ai/product-description` avec un role non autorise : doit retourner `403`.
3. Depasser le quota IA : doit retourner `429`.
4. Depasser le quota commande/avis : l'action doit retourner un message de temporisation.
5. Verifier les logs Vercel : aucune alerte `[rate-limit] Shared Redis/Upstash env vars are missing` ne doit apparaitre en production si Redis est bien configure.
