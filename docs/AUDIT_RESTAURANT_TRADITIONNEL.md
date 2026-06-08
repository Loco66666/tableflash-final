# Audit TableFlash - Cible restaurant traditionnel

Date: 2026-06-08

Objectif: passer TableFlash au crible avant le recentrage produit. Le but n'est pas d'ajouter des fonctions au hasard, mais de verifier que l'application donne envie a un restaurateur traditionnel de tester, puis de payer, parce qu'elle lui fait gagner du temps, limite les erreurs et ameliore l'experience client.

---

## 1. Verdict general

TableFlash a deja un socle exploitable pour un pilote: QR par table, menu, commandes, suivi client, avis, export CSV, statistiques, import photo, cockpit restaurateur.

Mais le produit n'est pas encore parfaitement aligne avec la nouvelle cible "restaurant traditionnel". Plusieurs zones gardent une logique fast-food/pizzeria: categories Pizza/Sandwich/Tacos, options pizza/tacos/burger, import IA pense pour cartes longues et menus complexes, menu client tres oriente commande rapide.

Avant de vendre a un restaurant traditionnel, il faut corriger trois choses:

1. La qualite percue: aucun texte casse, aucune categorie incoherente, aucune impression de bricolage.
2. Le modele metier: carte sobre, service a table, commande optionnelle, traduction simple, avis visibles.
3. Le parcours terrain: le restaurateur ouvre l'app et comprend en moins de 10 secondes si son service est pret.

---

## 2. Risques prioritaires

### P0 - A corriger avant toute demo serieuse

- Des textes affichent encore des caracteres casses dans plusieurs ecrans dashboard et client.
- Le menu client et le menu restaurateur contiennent encore une logique ciblee pizzeria/fast-food.
- Le mode "carte seule" existe partiellement via `orders_enabled`, mais il n'est pas assez visible ni assez separe du mode commande.
- Les reglages couplent encore trop fortement QR et commandes: un restaurant traditionnel doit pouvoir garder le QR actif meme si les commandes sont desactivees.
- La traduction du menu n'est pas encore presente comme experience produit.

Avancement technique 2026-06-08:

- Audit documente dans ce fichier.
- Normalisation menu partagee ajoutee pour familles traditionnelles.
- Menu client recentre sur familles traditionnelles.
- Mode carte seule ameliore: pas de panier ni bouton ajout quand les commandes sont desactivees.
- Reglages QR et commandes decouples: QR actif et commandes activees sont deux choix distincts.
- Import photo IA recentre sur cartes de restaurants traditionnels.
- Traduction menu V1 posee: colonnes JSON, edition EN cote restaurateur, bouton FR/EN cote client, fallback francais.

### Prerequis avant P1

Objectif: ne pas attaquer les finitions produit tant que la prod ne sait pas sauvegarder et relire les traductions du menu.

1. Appliquer la migration Supabase `011_add_menu_translations.sql` en production.
2. Verifier que les colonnes `translations` existent sur `menu_categories` et `menu_products`.
3. Tester en prod:
   - ouvrir `/dashboard/menu`,
   - modifier une categorie ou un produit,
   - renseigner une traduction anglaise,
   - sauvegarder,
   - ouvrir le menu client QR,
   - verifier que le bouton FR/EN apparait,
   - verifier que l'anglais s'affiche quand il existe,
   - verifier que le francais reste affiche quand une traduction manque.
4. Valider que le mode QR actif / commandes desactivees continue de fonctionner:
   - QR accessible,
   - carte visible,
   - aucun panier ni bouton de commande en mode carte seule.
5. Lancer les validations locales avant push:
   - `npm run lint`,
   - `npm run build`,
   - scan encodage visible sur les fichiers modifies.

SQL a executer dans Supabase si la migration n'a pas encore ete appliquee:

```sql
alter table public.menu_categories
  add column if not exists translations jsonb not null default '{}'::jsonb;

alter table public.menu_products
  add column if not exists translations jsonb not null default '{}'::jsonb;
```

SQL de verification:

```sql
select table_name, column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('menu_categories', 'menu_products')
  and column_name = 'translations'
order by table_name;
```

Resultat attendu:

- `menu_categories` / `translations` / `jsonb` / `'{}'::jsonb`
- `menu_products` / `translations` / `jsonb` / `'{}'::jsonb`

### P1 - A corriger

- L'import photo doit classer par familles traditionnelles: Entrees, Plats, Desserts, Boissons, Menus.
- Les sous-sections doivent rester visuelles dans la famille, pas devenir des categories principales parasites.
- Le menu client doit etre plus elegant et moins "application snack".
- Les commandes doivent rester optionnelles, avec un wording clair quand la carte est consultable seulement.
- Les statistiques doivent parler "service": midi/soir, table active, plat fort, avis, preparation du service.

### P2 - A traiter

- Traductions avancees multi-langues avec validation restaurateur.
- Menus du jour ou ardoise.
- Suggestions IA de nettoyage plus fines.
- Export comptable plus complet.
- Roles staff plus avances.

---

## 3. Accueil restaurateur

Etat actuel:

- Le cockpit de service existe.
- Il affiche commandes, menu, QR, avis, statistiques du jour, dernier avis et derniere commande.
- Il aide deja a comprendre l'etat general du restaurant.

Points forts:

- Bonne logique "ouvrir l'app et savoir quoi faire".
- Acces rapide aux zones critiques.
- Utile pendant un service accompagne.

Problemes:

- Certains textes sont encore casses dans le code dashboard.
- Le message de preparation melange parfois des sujets differents: produits indisponibles, QR, avis, commandes.
- Le mode actuel ne distingue pas assez "carte consultable uniquement" et "commande activee".
- Le restaurateur traditionnel peut avoir l'impression que l'app pousse la commande alors qu'il veut parfois seulement afficher une carte QR elegante.

Ce qu'il faut ajouter:

- Un bloc tres clair: "Mode actuel: Carte seule" ou "Mode actuel: Commandes activees".
- Un bouton rapide pour basculer le mode sans aller fouiller dans les reglages.
- Un indicateur "Pret pour le service" base sur: QR actifs, menu publie, avis configures, commande activee ou non selon le choix du restaurant.
- Une phrase terrain: "Votre carte QR est prete" plutot que seulement "Votre service est pret".

Decision:

- L'accueil doit devenir le cockpit de preparation du service, pas seulement un resume statistique.

---

## 4. Menu restaurateur

Etat actuel:

- CRUD produits/categories.
- Import photo multi-images.
- Pre-validation avant import.
- Gestion options/formules.
- Nettoyage menu.
- Suppression multiple.
- Indisponibilite produit.

Points forts:

- Gros gain de temps potentiel.
- Fonctionnellement puissant.
- La suppression multiple et la pre-validation vont dans le bon sens.

Problemes:

- La logique de familles est encore orientee Pizza/Sandwich/Tacos.
- Le nettoyage peut faire peur si le compteur semble trop eleve ou mal explique.
- Les categories generiques comme "Categorie" ont deja cree de la confusion.
- Les produits sans photo ne doivent pas etre presentes comme un probleme dur pour un restaurant traditionnel. Beaucoup de cartes traditionnelles n'ont pas besoin de photos.
- L'IA doit etre beaucoup plus stricte avant insertion, pour eviter de creer du nettoyage apres coup.

Ce qu'il faut ajouter:

- Familles principales fixes pour la cible:
  - Entrees
  - Plats
  - Desserts
  - Boissons
  - Menus
- Sous-section interne simple:
  - Exemple: Plats > Viandes, Poissons, Vegetarien
  - Exemple: Boissons > Vins, Boissons fraiches, Boissons chaudes
  - Exemple: Menus > Menu midi, Menu enfant
- Import photo optimise cartes traditionnelles:
  - lire cartes courtes,
  - detecter menus/formules,
  - ne pas inventer de categories snack,
  - proposer correction avant insertion.
- Nettoyage menu plus rassurant:
  - "Recommandations" au lieu de "problemes" pour photos manquantes,
  - "Corrections importantes" seulement pour doublons, prix absents, categories generiques, produits mal classes.

Decision:

- Le menu restaurateur est la priorite produit numero 1 apres l'audit, car c'est l'endroit ou le restaurateur juge si l'outil lui fait vraiment gagner du temps.

---

## 5. Menu client

Etat actuel:

- Le client voit les produits disponibles.
- Les options/formules peuvent etre choisies.
- Le prix final est calcule.
- Le suivi de commande et l'avis post-repas existent.

Points forts:

- Parcours QR complet.
- Panier, choix produit et suivi deja en place.
- Les produits indisponibles ne sont pas commandables.

Problemes:

- L'ordre des categories reste encore trop oriente Pizza/Sandwich/Tacos.
- Le message "Commandez a votre rythme" n'est pas adapte au mode carte seule.
- Le menu manque d'une experience plus elegante pour restaurant traditionnel.
- Pas encore de selection de langue visible.
- Les sous-sections doivent etre lisibles sans ajouter de complexite.

Ce qu'il faut ajouter:

- Mode carte seule:
  - cacher le panier,
  - afficher "Carte du restaurant",
  - garder une experience elegante de consultation.
- Mode commande activee:
  - afficher panier et ajout produit,
  - garder prix final clair,
  - garder options obligatoires nettes.
- Sections traditionnelles:
  - Entrees, Plats, Desserts, Boissons, Menus.
- Sous-sections visuelles dans la liste:
  - titre fin entre les produits,
  - pas de nouveau bouton complique.
- Langue:
  - bouton simple FR / EN au minimum,
  - textes produits traduits si disponibles,
  - fallback francais si non traduit.

Decision:

- Le menu client doit devenir premium, calme et lisible. Il ne doit plus donner une impression de fast-food.

---

## 6. Commandes

Etat actuel:

- Tableau commandes avec filtres.
- Compteurs service.
- Commandes urgentes.
- Notifications sonores et visuelles.
- Export CSV.
- Actions de statut.

Points forts:

- Deja adapte au service.
- Les notifications et compteurs sont tres utiles.
- Les transitions de statut sont presentes.

Problemes:

- Les commandes ne doivent pas etre le centre obligatoire du produit pour un restaurant traditionnel.
- Il faut verifier que les options et supplements restent toujours lisibles cote cuisine.
- Les sons navigateur dependent des permissions et du contexte utilisateur, donc il faut une explication claire dans l'app.

Ce qu'il faut ajouter:

- Un mode service encore plus lisible:
  - nouvelles commandes,
  - en preparation,
  - pretes a servir,
  - urgentes.
- Une ligne commande compacte:
  - numero commande,
  - table,
  - nom client si present,
  - heure,
  - total,
  - options/supplements.
- Une indication si les commandes sont desactivees:
  - "Carte seule activee, aucune commande client ne peut arriver."

Decision:

- Les commandes doivent etre excellentes, mais facultatives dans le discours produit.

---

## 7. QR / tables

Etat actuel:

- QR par table.
- Impression.
- Test lien client.
- Tables actives/inactives.

Points forts:

- Tres bon socle pour le service a table.
- Le restaurateur peut installer ses tables.

Problemes:

- Le QR doit porter le bon message selon le mode:
  - carte seule,
  - commande activee.
- Le restaurateur doit pouvoir verifier en 30 secondes que tous les QR de salle sont bons.

Ce qu'il faut ajouter:

- Apercu du texte client sur le QR selon le mode.
- Checklist installation:
  - tables creees,
  - QR actifs,
  - test client OK,
  - impression prete.
- Differencier salle, terrasse, bar de facon simple.

Decision:

- Le QR est un argument commercial majeur pour restaurants traditionnels. Il doit etre rassurant et propre.

---

## 8. Avis

Etat actuel:

- Avis post-repas.
- Reponse rapide.
- Priorisation avis faibles.
- Lien Google.

Points forts:

- Tres pertinent pour restaurants traditionnels.
- Peut devenir un vrai argument business.

Problemes:

- Il faut eviter de pousser Google trop tot ou trop fort apres chaque avis.
- Le restaurateur doit comprendre ce qui est visible client et ce qui reste interne.

Ce qu'il faut ajouter:

- Statut clair:
  - avis interne recu,
  - reponse preparee,
  - partage Google possible.
- Raccourci accueil:
  - "X avis a traiter",
  - "Y avis positifs a encourager".
- Message client post-avis plus premium.

Decision:

- Avis et satisfaction client doivent rester tres visibles dans le produit et dans la promesse commerciale.

---

## 9. Statistiques

Etat actuel:

- Commandes.
- CA.
- Panier moyen.
- Produit fort.
- Heure forte.
- Table active.
- Satisfaction.

Points forts:

- Bonne base de pilotage rapide.
- Utile pour restaurateur non technique.

Problemes:

- Certains libelles restent trop generiques.
- Les visuels/labels produits peuvent encore rappeler fast-food.
- Les statistiques doivent etre reliees au service midi/soir et a la salle.

Ce qu'il faut ajouter:

- Vue service:
  - midi,
  - soir,
  - semaine,
  - 30 jours.
- Indicateurs restaurant traditionnel:
  - plat le plus commande,
  - table/zone la plus active,
  - avis moyen,
  - commandes recues,
  - carte consultee si scans disponibles.
- Conseils simples:
  - "Ce plat marche bien",
  - "Cette table scanne beaucoup",
  - "Les avis sont a surveiller".

Decision:

- Les stats doivent aider a piloter, pas impressionner avec des graphiques.

---

## 10. Responsive mobile / tablette / PC

Etat actuel:

- L'app utilise deja beaucoup de grilles responsive.
- Les modales/sheets sont pensees mobile.
- Navigation bas de page presente.

Risques:

- Les modales longues peuvent devenir difficiles en tablette paysage.
- Certains boutons longs peuvent casser sur petits ecrans.
- Les listes horizontales de categories peuvent masquer des infos importantes.
- Les ecrans dashboard doivent etre verifies en:
  - mobile vertical,
  - tablette verticale,
  - tablette horizontale,
  - desktop.

Ce qu'il faut verifier avant demo:

- Accueil: aucun chevauchement, cockpit lisible.
- Menu restaurateur: import, validation, nettoyage, suppression multiple.
- Menu client: carte seule, commande activee, options produit, panier.
- Commandes: actions visibles sans scroll excessif.
- QR: impression et gestion tables.
- Avis: reponse rapide utilisable.
- Settings: bascule carte seule / commande activee.

Decision:

- Avant un vrai restaurant, chaque ecran critique doit etre teste sur mobile, tablette portrait, tablette paysage et desktop.

---

## 11. Mode carte seule vs commande activee

Etat actuel:

- `orders_enabled` permet de bloquer la creation de commande.
- Le menu public recoit `ordersEnabled`.
- Les reglages exposent une logique de commandes QR.

Problemes:

- Le mode n'est pas encore un vrai concept produit clair.
- QR et commandes sont trop couples dans les reglages.
- Cote client, le wording doit changer fortement selon le mode.

Mode attendu:

### Carte seule

- QR actif.
- Menu visible.
- Pas de panier.
- Pas de bouton ajouter.
- Pas de suivi commande.
- Message client: "Consultez la carte".
- Objectif: remplacer la carte papier ou la completer.

### Commande activee

- QR actif.
- Menu visible.
- Panier actif.
- Options visibles.
- Suivi commande actif.
- Avis post-repas actif si configure.
- Objectif: reduire les allers-retours table/serveur.

Decision:

- Ce mode doit etre visible dans l'accueil, les reglages, le menu client et le QR.

---

## 12. Audit technique rapide

Points a surveiller:

- Plusieurs fichiers contiennent encore des textes mal encodes visibles dans l'interface.
- La logique `getMenuFamily` existe a la fois cote restaurateur et cote client. Elle doit etre centralisee pour eviter des differences.
- La cible actuelle dans les helpers menu est encore trop large.
- Les reglages sauvegardent `qr_enabled` depuis `qrOrdersEnabled`, ce qui peut desactiver le QR quand on veut seulement couper les commandes.
- L'import IA contient encore des exemples pizza/tacos/burger dans le prompt, ce qui tire le produit dans l'ancienne direction.

Decision technique:

- Avant de coder l'etape 2, creer une petite couche de normalisation menu traditionnelle partagee:
  - familles principales,
  - sous-section,
  - tri,
  - libelles client,
  - libelles dashboard.

---

## 13. Ordre de travail recommande

### Etape 1 - Nettoyage qualite percue

Objectif: plus aucun texte casse dans les ecrans critiques.

Ecrans:

- Accueil dashboard
- Menu restaurateur
- Menu client
- Commandes
- Reglages
- Import IA

Critere:

- Aucune chaine visible avec caracteres casses.

### Etape 2 - Mode carte seule / commande activee

Objectif: le restaurateur choisit son usage sans ambiguite.

Livrables:

- Reglage clair.
- Accueil clair.
- Menu client adapte.
- QR adapte.

### Etape 3 - Normalisation menu restaurant traditionnel

Objectif: supprimer la logique fast-food comme logique produit.

Livrables:

- Familles principales fixes.
- Sous-sections visuelles.
- Import IA recentre.
- Menu client recentre.

### Etape 4 - Menu client premium

Objectif: experience elegante et rassurante pour client de restaurant traditionnel.

Livrables:

- Sections sobres.
- Carte seule impeccable.
- Options/formules visibles uniquement quand utiles.
- Prix final clair.

### Etape 5 - Traduction simple

Objectif: rendre la carte comprehensible aux clients etrangers.

Livrables:

- Choix de langue cote client.
- Traductions produit/categorie.
- Fallback francais.
- Edition simple cote restaurateur.

### Etape 6 - QA responsive terrain

Objectif: verifier service reel avant contact commercial.

Supports:

- mobile,
- tablette portrait,
- tablette paysage,
- desktop.

---

## 14. Conclusion

La suite logique n'est pas d'ajouter une grosse feature. La suite logique est de rendre TableFlash parfaitement credible pour un restaurant traditionnel.

Priorite immediate:

1. Corriger la qualite percue.
2. Clarifier carte seule vs commande activee.
3. Recentrer le menu sur les familles traditionnelles.
4. Rendre le menu client plus elegant.
5. Ajouter la traduction simple.

Une fois ces points faits, TableFlash aura un discours beaucoup plus fort:

"Votre carte QR elegante, traduisible et toujours a jour, avec commandes a table optionnelles et avis clients integres."
