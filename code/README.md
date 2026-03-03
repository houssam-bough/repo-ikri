# IKRI — Plateforme de Partage de Matériel Agricole

**IKRI** (يكري) est une application web et mobile qui met en relation les agriculteurs et les prestataires de services agricoles au Maroc. Elle permet de publier des offres de machines, poster des demandes, réserver du matériel, et communiquer via messagerie intégrée.

> **Stack** : Next.js 16 · React 19 · TypeScript 5 · Capacitor 8 · Prisma · PostgreSQL (Neon) · Tailwind CSS · Cloudinary

---

## Table des matières

1. [Prérequis](#prérequis)
2. [Installation rapide (Web)](#installation-rapide-web)
3. [Configuration du fichier .env](#configuration-du-fichier-env)
4. [Lancer sur Android Studio (étape par étape)](#lancer-sur-android-studio-étape-par-étape)
5. [Scripts npm disponibles](#scripts-npm-disponibles)
6. [Structure du projet](#structure-du-projet)
7. [Routes API](#routes-api)
8. [Internationalisation (i18n)](#internationalisation-i18n)
9. [Déploiement](#déploiement)

---

## Prérequis

| Outil | Version minimale | Téléchargement |
|-------|-----------------|----------------|
| **Node.js** | 18.x ou supérieur | https://nodejs.org/ |
| **npm** | 9.x (inclus avec Node) | — |
| **Android Studio** | Hedgehog (2023.1) ou + | https://developer.android.com/studio |
| **JDK** | 17 | Installé via Android Studio ou [Adoptium](https://adoptium.net/) |
| **Git** | 2.x | https://git-scm.com/ |

> **Note :** Pas besoin de Docker. La base de données est hébergée sur [Neon](https://neon.tech/) (PostgreSQL cloud).

---

## Installation rapide (Web)

```bash
# 1. Cloner le dépôt
git clone https://github.com/houssam-bough/repo-ikri.git
cd repo-ikri/code

# 2. Installer les dépendances
npm install

# 3. Copier et remplir le fichier d'environnement
cp .env.example .env
# → Voir la section "Configuration du fichier .env" ci-dessous

# 4. Générer le client Prisma
npm run db:generate

# 5. Appliquer les migrations sur la base de données
npm run db:migrate:deploy

# 6. (Optionnel) Peupler la base avec des données de test
npm run db:seed
npm run db:seed:machines

# 7. Lancer le serveur de développement
npm run dev
```

Ouvrir **http://localhost:3000** dans le navigateur.

---

## Configuration du fichier .env

Copier `.env.example` vers `.env` et remplir chaque variable :

```env
# ─── Base de données (Neon PostgreSQL) ───
# Créer un projet sur https://console.neon.tech/ → copier la connection string
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"

# ─── Cloudinary (Upload d'images) ───
# Créer un compte sur https://console.cloudinary.com/
# Dashboard → Cloud Name et Settings → Upload Presets (unsigned)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="votre_cloud_name"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="votre_upload_preset"

# ─── API URL ───
# Garder /api pour le développement local et la production Vercel
NEXT_PUBLIC_API_URL="/api"

# ─── Capacitor (Développement mobile) ───
# Émulateur Android : http://10.0.2.2:3000
# Appareil physique (même Wi-Fi) : http://VOTRE_IP_LOCALE:3000
# APK pointant vers la production : https://repo-ikri.vercel.app
CAPACITOR_SERVER_URL="http://10.0.2.2:3000"
```

| Variable | Description | Où l'obtenir |
|----------|-------------|--------------|
| `DATABASE_URL` | URL de connexion PostgreSQL | [Neon Console](https://console.neon.tech/) → Dashboard → Connection string |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Nom du cloud Cloudinary | [Cloudinary Dashboard](https://console.cloudinary.com/) |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Preset d'upload (unsigned) | Cloudinary → Settings → Upload → Upload Presets |
| `NEXT_PUBLIC_API_URL` | Chemin de base de l'API | Toujours `/api` |
| `CAPACITOR_SERVER_URL` | URL du serveur pour l'app mobile | Voir tableau ci-dessus |

---

## Lancer sur Android Studio (étape par étape)

### Étape 0 — Installer Android Studio

1. Télécharger Android Studio depuis https://developer.android.com/studio
2. Pendant l'installation, cocher **Android SDK**, **Android SDK Platform-Tools**, et **Android Virtual Device (AVD)**
3. Au premier lancement, suivre le wizard pour installer le SDK Android (API 34 recommandé)
4. Vérifier que le JDK 17 est configuré : **File → Project Structure → SDK Location → JDK**

### Étape 1 — Préparer le projet (à faire une seule fois)

```bash
cd repo-ikri/code

# Installer les dépendances si pas encore fait
npm install

# Vérifier que le .env est bien rempli (voir section précédente)
```

### Étape 2 — Construire le projet web + synchroniser Capacitor

```bash
# Build Next.js + copie dans le dossier android/
npm run mobile:build
```

> Cette commande exécute `next build` puis `cap sync`. Elle copie le build web dans `android/app/src/main/assets/public/`.

### Étape 3 — Ouvrir dans Android Studio

```bash
npm run mobile:open:android
```

> Cela ouvre le dossier `android/` dans Android Studio. Attendre que Gradle finisse l'indexation et la synchronisation (barre de progression en bas).

### Étape 4 — Configurer un émulateur ou un appareil

**Option A — Émulateur :**
1. Dans Android Studio : **Tools → Device Manager → Create Virtual Device**
2. Choisir un appareil (ex: Pixel 7)
3. Sélectionner l'image système **API 34** (la télécharger si nécessaire)
4. Terminer la création et lancer l'émulateur
5. Dans `.env`, vérifier : `CAPACITOR_SERVER_URL="http://10.0.2.2:3000"`

**Option B — Appareil physique :**
1. Activer le **Mode développeur** sur votre téléphone (Paramètres → À propos → taper 7× sur Numéro de build)
2. Activer le **Débogage USB** (Paramètres → Options pour les développeurs)
3. Brancher le téléphone en USB et accepter l'autorisation de débogage
4. Dans `.env`, mettre : `CAPACITOR_SERVER_URL="http://VOTRE_IP_LOCALE:3000"`
   - Trouver votre IP : `ipconfig` (Windows) → adresse IPv4 du Wi-Fi
   - Le PC et le téléphone doivent être sur le **même réseau Wi-Fi**

### Étape 5 — Lancer le serveur Next.js

```bash
# Dans un terminal séparé, garder le serveur actif :
npm run dev
```

> Le serveur doit tourner sur `http://localhost:3000` pendant tout le développement mobile.

### Étape 6 — Lancer l'application

**Depuis le terminal :**
```bash
npm run mobile:run:android
```

**Ou depuis Android Studio :**
1. Sélectionner l'appareil/émulateur dans la barre d'outils en haut
2. Cliquer sur le bouton ▶ **Run** (ou `Shift + F10`)

### Étape 7 — Développement itératif

Après chaque modification du code web :
```bash
# Re-synchroniser les fichiers web dans le projet Android
npm run mobile:sync
```

> Pas besoin de `mobile:build` complet si seul le code source change. `mobile:sync` suffit pour les changements rapides. Si les modifications ne se reflètent pas, faire un `mobile:build` complet.

### Résumé du workflow mobile

```
npm run dev              ← Garder le serveur actif (terminal 1)
                          
# Après modifications :
npm run mobile:sync      ← Synchroniser les fichiers
                          
# Premier lancement ou build complet :
npm run mobile:build     ← Build + sync
npm run mobile:open:android  ← Ouvrir Android Studio
# Puis ▶ Run dans Android Studio
```

---

## Scripts npm disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Démarre le serveur Next.js en mode développement |
| `npm run build` | Build de production Next.js |
| `npm run start` | Démarre le serveur en mode production |
| `npm run lint` | Vérifie le code avec ESLint |
| `npm run db:generate` | Génère le client Prisma à partir du schéma |
| `npm run db:migrate` | Crée et applique une nouvelle migration (dev) |
| `npm run db:migrate:deploy` | Applique les migrations existantes (production) |
| `npm run db:seed` | Peuple la base avec les données de test (utilisateurs, offres) |
| `npm run db:seed:machines` | Peuple les templates de machines agricoles |
| `npm run db:update:machines` | Met à jour les noms de machines en français |
| `npm run db:reset` | Remet la base à zéro (supprime toutes les données + re-migrate) |
| `npm run db:studio` | Ouvre Prisma Studio (interface graphique pour la DB) |
| `npm run mobile:build` | Build Next.js + sync Capacitor |
| `npm run mobile:sync` | Synchronise les fichiers web vers Android |
| `npm run mobile:open:android` | Ouvre le projet Android dans Android Studio |
| `npm run mobile:run:android` | Lance l'app sur un appareil/émulateur connecté |

---

## Structure du projet

```
code/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Layout racine (AuthProvider, LanguageProvider)
│   ├── page.tsx                # Page d'accueil / routeur principal
│   ├── globals.css             # Styles globaux
│   ├── api/                    # Routes API (backend)
│   │   ├── auth/               # Inscription, connexion, profil
│   │   ├── offers/             # CRUD offres
│   │   ├── demands/            # CRUD demandes
│   │   ├── proposals/          # Propositions sur demandes
│   │   ├── reservations/       # Réservations de matériel
│   │   ├── messages/           # Messagerie
│   │   ├── machine-templates/  # Templates de machines
│   │   ├── users/              # Gestion utilisateurs
│   │   └── vip-requests/       # Demandes VIP
│   ├── offers/[id]/            # Page détail d'une offre
│   └── demands/[id]/           # Page détail d'une demande
│
├── components/                 # Composants React (~40 fichiers)
│   ├── AuthScreen.tsx          # Écran d'authentification
│   ├── Landing.tsx             # Page d'accueil publique
│   ├── FarmerDashboard.tsx     # Dashboard agriculteur
│   ├── ProviderDashboard.tsx   # Dashboard prestataire
│   ├── AdminDashboard.tsx      # Dashboard administrateur
│   ├── PostOffer.tsx           # Formulaire de publication d'offre
│   ├── PostDemand.tsx          # Formulaire de publication de demande
│   ├── OffersFeed.tsx          # Liste des offres
│   ├── DemandsFeed.tsx         # Liste des demandes
│   ├── Messages.tsx            # Système de messagerie
│   ├── MapComponent.tsx        # Carte Leaflet
│   ├── BottomNav.tsx           # Barre de navigation mobile
│   ├── ui/                     # Composants UI réutilisables (shadcn/ui)
│   └── ...
│
├── constants/                  # Données statiques bilingues (FR/AR)
│   ├── serviceTypes.ts         # Types de machines et services
│   ├── moroccoRegions.ts       # Régions du Maroc
│   ├── majorCities.ts          # Villes principales
│   └── templateFieldTranslations.ts  # Traductions des champs de formulaire
│
├── contexts/                   # Contextes React
│   ├── AuthContext.tsx          # Authentification (JWT)
│   └── LanguageContext.tsx      # Gestion de la langue (FR/AR)
│
├── hooks/                      # Hooks personnalisés
│   ├── useLanguage.ts          # Accès aux traductions
│   ├── useAuth.ts              # Accès à l'authentification
│   ├── use-toast.ts            # Notifications toast
│   └── use-mobile.ts           # Détection mobile
│
├── lib/                        # Utilitaires partagés
│   ├── prisma.ts               # Instance Prisma Client
│   ├── cloudinary.ts           # Configuration Cloudinary
│   ├── mobileUtils.ts          # Utilitaires Capacitor
│   ├── notifications.ts        # Système de notifications
│   └── utils.ts                # Fonctions utilitaires (cn, etc.)
│
├── prisma/                     # Base de données
│   ├── schema.prisma           # Schéma de la DB (modèles, enums)
│   ├── seed.ts                 # Script de seed principal
│   ├── seed-machines.ts        # Seed des templates de machines
│   └── migrations/             # Historique des migrations
│
├── services/                   # Services client
│   ├── apiService.ts           # Client HTTP pour toutes les routes API
│   ├── geoService.ts           # Géolocalisation
│   └── localDb.ts              # Stockage local (messages hors-ligne)
│
├── translations.ts             # Fichier de traductions FR/AR (~3000 lignes)
├── types.ts                    # Types TypeScript partagés
│
├── android/                    # Projet natif Android (Capacitor)
├── public/                     # Assets statiques (images, icônes, splash)
├── styles/                     # CSS additionnels
├── scripts/                    # Scripts utilitaires (nettoyage DB, etc.)
│
├── capacitor.config.js         # Configuration Capacitor
├── next.config.mjs             # Configuration Next.js
├── tailwind / postcss           # Configuration Tailwind CSS
├── tsconfig.json               # Configuration TypeScript
└── package.json                # Dépendances et scripts
```

---

## Routes API

Toutes les routes sont sous `/api/` (Next.js Route Handlers).

| Endpoint | Méthodes | Description |
|----------|----------|-------------|
| `/api/auth/register` | POST | Inscription d'un utilisateur |
| `/api/auth/login` | POST | Connexion (retourne un JWT) |
| `/api/auth/profile` | GET, PUT | Profil de l'utilisateur connecté |
| `/api/offers` | GET, POST | Liste et création d'offres |
| `/api/offers/[id]` | GET, PUT, DELETE | Détail, modification, suppression d'une offre |
| `/api/demands` | GET, POST | Liste et création de demandes |
| `/api/demands/[id]` | GET, PUT, DELETE | Détail, modification, suppression d'une demande |
| `/api/proposals` | GET, POST | Propositions sur des demandes |
| `/api/reservations` | GET, POST | Réservations de matériel |
| `/api/messages` | GET, POST | Messagerie entre utilisateurs |
| `/api/machine-templates` | GET | Templates de machines (champs dynamiques) |
| `/api/users` | GET | Liste des utilisateurs (admin) |
| `/api/vip-requests` | GET, POST | Demandes de passage VIP |

---

## Internationalisation (i18n)

L'application supporte le **français** (par défaut) et l'**arabe** (RTL).

- **Fichier principal** : `translations.ts` contient toutes les chaînes FR/AR
- **Contexte** : `LanguageContext.tsx` gère la langue courante (`'fr'` ou `'ar'`)
- **Hook** : `useLanguage()` retourne `{ t, language, setLanguage, isRTL }`
- **Constantes bilingues** : `constants/` contient les données avec champs `name` (FR) et `nameAr` (AR)
- **Traductions de champs** : `constants/templateFieldTranslations.ts` pour les formulaires dynamiques

Utilisation dans un composant :
```tsx
const { t, language, isRTL } = useLanguage();
return <h1 style={{ direction: isRTL ? 'rtl' : 'ltr' }}>{t('welcome')}</h1>;
```

---

## Déploiement

- **Web** : Déployé automatiquement sur [Vercel](https://vercel.com/) via le repo GitHub
- **Base de données** : Hébergée sur [Neon](https://neon.tech/) (PostgreSQL serverless)
- **Images** : Stockées sur [Cloudinary](https://cloudinary.com/)
- **Mobile** : Build APK via Android Studio (Build → Build Bundle / APK → Build APK)

---

## Identité visuelle

| Élément | Valeur |
|---------|--------|
| Couleur principale | `#4C9A2A` (vert) |
| Couleur secondaire | `#FF8C1A` (orange) |
| Police titres | Oswald |
| Police corps | Nunito Sans |
| Nom de l'app | IKRI (يكري) |
| App ID | `com.ikri.app` |
- When changing Prisma models run `npm run db:generate` and `npm run db:migrate` (or `prisma migrate dev`) as needed.
- The Capacitor project lives in `android/`; run `cap sync` after building the web app to update native assets.

If you want, I can:
- create an `archives/` folder and move backups there before deleting
- open a PR with the cleanup and README changes
- produce a short contributor guide for the mobile workflow

— End of summary —
