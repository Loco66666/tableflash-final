delete from public.restaurant_applications
where email in (
  'lebistrotduport@gmail.com',
  'latableverte@gmail.com',
  'sushiki.anglet@gmail.com'
);

insert into public.restaurant_applications (
  restaurant_name,
  owner_name,
  city,
  phone,
  email,
  restaurant_type,
  source,
  status
)
values
  (
    'Le Bistrot du Port',
    'Jean Dupont',
    'Bayonne, France',
    '06 12 34 56 78',
    'lebistrotduport@gmail.com',
    'Bistrot',
    'Google Recherche',
    'pending'
  ),
  (
    'La Table Verte',
    'Sophie Martin',
    'Biarritz, France',
    '06 23 45 67 89',
    'latableverte@gmail.com',
    'Cuisine saine',
    'Bouche-à-oreille',
    'pending'
  ),
  (
    'Sushi Ki',
    'Hiroshi Tanaka',
    'Anglet, France',
    '06 98 76 54 32',
    'sushiki.anglet@gmail.com',
    'Sushis',
    'Google Maps',
    'pending'
  );