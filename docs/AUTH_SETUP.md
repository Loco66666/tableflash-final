# TableFlash — Auth Setup (Sprint Supabase 2)

## Variables d'environnement
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_TABLEFLASH_AUTH_BYPASS=false` (par défaut)
- optionnel: `NEXT_PUBLIC_SITE_URL` pour la redirection logout

> Ne jamais exposer `service_role` côté client.

## Rôles
- `super_admin` → accès `/admin/*`
- `restaurant_owner`, `restaurant_staff` → accès `/dashboard/*`

## Routes protégées
- `/admin/*`
- `/dashboard/*`

Non protégées:
- `/`
- `/login`
- `/unauthorized`
- `/r/[restaurant]/table/[table]`

## Créer le premier super_admin
Après création d'un user Auth dans Supabase, exécuter SQL:

```sql
insert into public.profiles (id, role)
values ('<AUTH_USER_ID>', 'super_admin')
on conflict (id) do update set role = excluded.role;
```

ou

```sql
update public.profiles
set role = 'super_admin'
where id = '<AUTH_USER_ID>';
```

## Créer un restaurant_owner
```sql
update public.profiles
set role = 'restaurant_owner'
where id = '<AUTH_USER_ID>';
```

## Test rapide
1. Aller sur `/login`.
2. Se connecter avec email/mot de passe.
3. Vérifier redirection par rôle.
4. Tester `/admin` et `/dashboard` avec rôles non autorisés.

## Bypass temporaire
- Variable: `NEXT_PUBLIC_TABLEFLASH_AUTH_BYPASS`
- Toujours `false` par défaut.
- Passer à `true` uniquement pour debug local contrôlé.
