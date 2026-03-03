# Documentation Technique — IKRI

> Ce document est destiné aux développeurs qui rejoignent le projet IKRI. Il décrit l'architecture, les conventions, et les procédures à suivre pour développer de manière cohérente.

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture technique](#2-architecture-technique)
3. [Stack technologique](#3-stack-technologique)
4. [Structure du projet](#4-structure-du-projet)
5. [Base de données (Prisma + Neon)](#5-base-de-données-prisma--neon)
6. [Routes API](#6-routes-api)
7. [Système d'authentification](#7-système-dauthentification)
8. [Système d'internationalisation (i18n)](#8-système-dinternationalisation-i18n)
9. [Système de constantes bilingues](#9-système-de-constantes-bilingues)
10. [Composants et navigation](#10-composants-et-navigation)
11. [Gestion des images (Cloudinary)](#11-gestion-des-images-cloudinary)
12. [Capacitor (wrapper mobile)](#12-capacitor-wrapper-mobile)
13. [Types TypeScript](#13-types-typescript)
14. [Conventions de code](#14-conventions-de-code)
15. [Guide : Ajouter une nouvelle fonctionnalité](#15-guide--ajouter-une-nouvelle-fonctionnalité)
16. [Guide : Ajouter une traduction](#16-guide--ajouter-une-traduction)
17. [Guide : Ajouter un nouveau modèle DB](#17-guide--ajouter-un-nouveau-modèle-db)
18. [Guide : Ajouter une route API](#18-guide--ajouter-une-route-api)
19. [Outils utiles](#19-outils-utiles)
20. [Déploiement](#20-déploiement)

---

## 1. Vue d'ensemble

**IKRI** (يكري) est une plateforme de partage de matériel agricole au Maroc. Elle permet aux :

- **Agriculteurs** (Farmer) : publier des demandes de matériel, réserver des machines, négocier des prix
- **Prestataires** (Provider) : publier des offres de machines, répondre aux demandes, gérer les réservations
- **Administrateurs** (Admin) : approuver les utilisateurs, gérer les templates de machines, superviser la plateforme


L'application fonctionne en **web** (navigateur) et en **mobile** (Android via Capacitor).

---

## 2. Architecture technique

```
┌──────────────────────────────────────────────────────┐
│                   Utilisateur                        │
│          (Navigateur ou App Android)                 │
└──────────────┬───────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────┐
│              Next.js App Router                      │
│  ┌─────────────────┐   ┌──────────────────────────┐  │
│  │  Pages / Layout  │   │  Composants React        │  │
│  │  (app/*.tsx)     │   │  (components/*.tsx)       │  │
│  └────────┬────────┘   └──────────┬───────────────┘  │
│           │                       │                   │
│           │    apiService.ts ◄────┘                   │
│           │         │                                 │
│           ▼         ▼                                 │
│  ┌──────────────────────────────────────────────┐    │
│  │         Route Handlers (app/api/**/route.ts)  │    │
│  │         (Backend côté serveur)                │    │
│  └──────────────────┬───────────────────────────┘    │
└─────────────────────┼────────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │   Prisma ORM Client    │
         └────────┬───────────────┘
                  │
                  ▼
         ┌────────────────────────┐
         │  PostgreSQL (Neon)     │
         │  Base de données cloud │
         └────────────────────────┘

Services externes :
  • Cloudinary → Stockage d'images (offres, demandes, profils)
  • Leaflet/OpenStreetMap → Cartes interactives
  • Capacitor → Wrapper natif Android (caméra, partage, filesystem)
```

**Flux de données typique :**
1. L'utilisateur interagit avec un composant React
2. Le composant appelle une fonction dans `services/apiService.ts`
3. `apiService.ts` fait un `fetch()` vers `/api/...`
4. Le Route Handler (dans `app/api/`) traite la requête côté serveur
5. Le handler utilise Prisma pour lire/écrire dans PostgreSQL
6. La réponse JSON remonte jusqu'au composant

---

## 3. Stack technologique

| Couche | Technologie | Version | Rôle |
|--------|-------------|---------|------|
| Framework | Next.js | 16 | App Router, SSR, Route Handlers |
| UI | React | 19 | Composants, hooks, state |
| Langage | TypeScript | 5 | Typage statique |
| Mobile | Capacitor | 8 | App Android native (WebView) |
| ORM | Prisma | 5.22 | Requêtes DB, migrations, types |
| Base de données | PostgreSQL | — | Neon (cloud serverless) |
| CSS | Tailwind CSS | 4 | Utility-first CSS |
| UI Components | shadcn/ui + Radix | — | Composants accessibles |
| Cartes | Leaflet + react-leaflet | 1.9 / 5.0 | Cartes interactives |
| Images | Cloudinary | — | Upload et stockage |
| Graphiques | Recharts | 3 | Tableaux de bord |
| Animations | Framer Motion | 12 | Transitions, animations |
| Icônes | Lucide React | — | Icônes SVG |
| PDF | jsPDF + jspdf-autotable | 3 / 5 | Génération de rapports |
| Formulaires | React Hook Form | 7 | Gestion de formulaires |

---

## 4. Structure du projet

```
code/
├── app/                          # ← POINT D'ENTRÉE Next.js
│   ├── layout.tsx                # Layout racine : AuthProvider + LanguageProvider
│   ├── page.tsx                  # Page principale : routeur SPA (gère toutes les vues)
│   ├── globals.css               # Styles globaux + imports Tailwind
│   ├── api/                      # ← BACKEND (Route Handlers)
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── register/route.ts
│   │   │   └── profile/route.ts
│   │   ├── offers/
│   │   │   ├── route.ts          # GET (liste) + POST (création)
│   │   │   └── [id]/route.ts     # GET + PUT + DELETE (par ID)
│   │   ├── demands/              # Même structure que offers/
│   │   ├── proposals/route.ts
│   │   ├── reservations/route.ts
│   │   ├── messages/route.ts
│   │   ├── machine-templates/route.ts
│   │   ├── users/route.ts
│   │   └── vip-requests/route.ts
│   ├── offers/[id]/page.tsx      # Page détail offre (accès direct par URL)
│   └── demands/[id]/page.tsx     # Page détail demande (accès direct par URL)
│
├── components/                   # ← COMPOSANTS UI
│   ├── AuthScreen.tsx            # Écran login/register
│   ├── Landing.tsx               # Page d'accueil publique (non connecté)
│   ├── FarmerDashboard.tsx       # Dashboard web (agriculteur)
│   ├── FarmerHome.tsx            # Dashboard mobile (agriculteur)
│   ├── ProviderDashboard.tsx     # Dashboard web (prestataire)
│   ├── ProviderHome.tsx          # Dashboard mobile (prestataire)
│   ├── AdminDashboard.tsx        # Dashboard admin
│   ├── AdminHome.tsx             # Home admin
│   ├── AdminMachineTemplates.tsx # Gestion templates machines
│   ├── PostOffer.tsx             # Formulaire publication offre
│   ├── PostDemand.tsx            # Formulaire publication demande
│   ├── OffersFeed.tsx            # Liste des offres (filtrable)
│   ├── DemandsFeed.tsx           # Liste des demandes (filtrable)
│   ├── MyOffers.tsx              # Mes offres
│   ├── MyDemands.tsx             # Mes demandes
│   ├── MyReservations.tsx        # Mes réservations
│   ├── MyProposals.tsx           # Mes propositions
│   ├── Messages.tsx              # Messagerie complète
│   ├── Profile.tsx               # Page profil
│   ├── UserSearch.tsx            # Recherche d'utilisateurs
│   ├── MapComponent.tsx          # Carte Leaflet
│   ├── DynamicMap.tsx            # Carte avec chargement dynamique
│   ├── BottomNav.tsx             # Navigation mobile (en bas)
│   ├── MobileNav.tsx             # Navigation mobile alternative
│   ├── NewHeader.tsx             # En-tête mobile
│   ├── MobileHeader.tsx          # En-tête mobile (web)
│   ├── Sidebar.tsx               # Sidebar web
│   ├── VoiceRecorder.tsx         # Enregistrement audio
│   ├── FileAttachment.tsx        # Pièces jointes
│   ├── ProposalModal.tsx         # Modal de proposition
│   ├── AvailabilityCalendar.tsx  # Calendrier de disponibilité
│   ├── AvailabilityDialog.tsx    # Dialog de disponibilité
│   ├── PendingApproval.tsx       # Écran d'attente d'approbation
│   ├── ui/                       # Composants shadcn/ui (Button, Input, Dialog, etc.)
│   ├── icons/                    # Icônes personnalisées
│   └── landing/                  # Sous-composants de la landing page
│
├── constants/                    # ← DONNÉES STATIQUES BILINGUES
│   ├── serviceTypes.ts           # Types de machines + services
│   ├── moroccoRegions.ts         # 12 régions du Maroc
│   ├── majorCities.ts            # Villes principales par région
│   └── templateFieldTranslations.ts  # Dictionnaires FR→AR pour formulaires
│
├── contexts/                     # ← CONTEXTES REACT (state global)
│   ├── AuthContext.tsx            # Authentification (login, logout, user)
│   └── LanguageContext.tsx        # Langue (fr/ar), fonction t(), isRTL
│
├── hooks/                        # ← HOOKS PERSONNALISÉS
│   ├── useLanguage.ts            # Accès au LanguageContext
│   ├── useAuth.ts                # Accès au AuthContext
│   ├── use-toast.ts              # Notifications toast (shadcn)
│   └── use-mobile.ts             # Détection taille écran mobile
│
├── lib/                          # ← UTILITAIRES PARTAGÉS
│   ├── prisma.ts                 # Singleton Prisma Client
│   ├── cloudinary.ts             # Configuration Cloudinary
│   ├── mobileUtils.ts            # Helpers Capacitor (camera, share)
│   ├── notifications.ts          # Envoi de notifications (messages système)
│   └── utils.ts                  # cn() pour Tailwind merge, etc.
│
├── prisma/                       # ← BASE DE DONNÉES
│   ├── schema.prisma             # Schéma complet (tables, relations, enums)
│   ├── seed.ts                   # Données de test
│   ├── seed-machines.ts          # Templates de machines
│   ├── update-machines-french.ts # Mise à jour noms FR
│   └── migrations/               # Historique des migrations SQL
│
├── services/                     # ← SERVICES CLIENT
│   ├── apiService.ts             # Client HTTP principal (~1050 lignes)
│   ├── geoService.ts             # Calcul de distances (Haversine)
│   └── localDb.ts                # IndexedDB pour messages hors-ligne
│
├── translations.ts               # ← TOUTES les traductions FR/AR (~3000 lignes)
├── types.ts                      # ← TYPES TypeScript partagés
├── capacitor.config.js           # Config Capacitor
├── next.config.mjs               # Config Next.js
├── tsconfig.json                 # Config TypeScript
└── package.json                  # Dépendances et scripts
```

---

## 5. Base de données (Prisma + Neon)

### 5.1 Modèles principaux

| Modèle | Table | Description |
|--------|-------|-------------|
| `User` | `users` | Utilisateurs (agriculteurs, prestataires, admins) |
| `MachineTemplate` | `machine_templates` | Templates de machines avec champs dynamiques (JSON) |
| `Offer` | `offers` | Offres de machines publiées par les prestataires |
| `AvailabilitySlot` | `availability_slots` | Créneaux de disponibilité des offres |
| `Demand` | `demands` | Demandes de matériel publiées par les agriculteurs |
| `Proposal` | `proposals` | Propositions faites sur les demandes + système de négociation |
| `Reservation` | `reservations` | Réservations de machines |
| `Message` | `messages` | Messages entre utilisateurs (texte, audio, fichiers) |

### 5.2 Enums

```prisma
enum UserRole      { Admin, Farmer, Provider, Both }
enum ApprovalStatus { pending, approved, denied }
enum DemandStatus  { waiting, negotiating, matched }
enum BookingStatus { waiting, negotiating, matched }
enum ReservationStatus { pending, approved, rejected, cancelled }
enum ProposalStatus { pending, accepted, rejected }
```

### 5.3 Relations clés

```
User ──1:N──> Offer           (un prestataire publie plusieurs offres)
User ──1:N──> Demand          (un agriculteur publie plusieurs demandes)
User ──1:N──> Reservation     (en tant que farmer ou provider)
User ──1:N──> Proposal        (un prestataire fait des propositions)
User ──1:N──> Message         (envoyés et reçus)

Offer ──N:1──> MachineTemplate (chaque offre peut référencer un template)
Offer ──1:N──> AvailabilitySlot
Offer ──1:N──> Reservation

Demand ──1:N──> Proposal      (une demande reçoit plusieurs propositions)
Demand ──1:N──> Message
```

### 5.4 Champs dynamiques (MachineTemplate)

Les templates de machines stockent la définition des champs dans `fieldDefinitions` (JSON) :

```json
[
  { "name": "BRAND", "label": "Marque", "type": "text", "required": true },
  { "name": "YEAR", "label": "Année de fabrication", "type": "number", "required": true },
  { "name": "CONDITION", "label": "État", "type": "select", "options": ["Neuf", "Excellent", "Bon", "Usagé"], "required": true }
]
```

Les offres stockent les valeurs remplies dans `customFields` (JSON) :

```json
{ "BRAND": "John Deere", "YEAR": 2020, "CONDITION": "Excellent" }
```

### 5.5 Commandes Prisma courantes

```bash
# Générer le client TypeScript à partir du schéma
npm run db:generate

# Créer une migration après modification du schéma
npm run db:migrate

# Appliquer les migrations sur la DB de production
npm run db:migrate:deploy

# Remplir la base avec des données de test
npm run db:seed

# Ouvrir l'interface graphique Prisma Studio
npm run db:studio

# Remettre la base à zéro
npm run db:reset
```

### 5.6 Modifier le schéma

1. Éditer `prisma/schema.prisma`
2. Lancer `npm run db:migrate` → donner un nom descriptif à la migration
3. Lancer `npm run db:generate` pour régénérer le client
4. Mettre à jour `types.ts` si nécessaire (les types frontend sont séparés des types Prisma)

---

## 6. Routes API

Toutes les routes sont dans `app/api/`. Chaque fichier `route.ts` exporte des fonctions nommées : `GET`, `POST`, `PUT`, `DELETE`.

### 6.1 Pattern standard d'une route

```typescript
// app/api/offers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const offers = await prisma.offer.findMany({
      include: { machineTemplate: true, availabilitySlots: true },
      orderBy: { createdAt: 'desc' },
    });

    // Transformer les données Prisma en format attendu par le frontend
    const formatted = offers.map(offer => ({
      _id: offer.id,
      // ... mapping des champs
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Validation...
    const newOffer = await prisma.offer.create({ data: { ... } });
    return NextResponse.json(newOffer, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

### 6.2 Convention de nommage des IDs

- **Base de données (Prisma)** : les champs s'appellent `id` (UUID)
- **API / Frontend** : les champs sont mappés en `_id` pour compatibilité historique
- Toujours mapper `id → _id` dans les Route Handlers avant de renvoyer au frontend

### 6.3 Routes existantes

| Route | Méthodes | Description |
|-------|----------|-------------|
| `/api/auth/register` | POST | Inscription (hash du mot de passe avec bcryptjs) |
| `/api/auth/login` | POST | Connexion (vérifie le hash, retourne l'utilisateur) |
| `/api/auth/profile` | GET, PUT | Profil utilisateur (lecture et mise à jour) |
| `/api/offers` | GET, POST | Liste filtrée + création d'offre |
| `/api/offers/[id]` | GET, PUT, DELETE | Offre unique |
| `/api/demands` | GET, POST | Liste + création de demande |
| `/api/demands/[id]` | GET, PUT, DELETE | Demande unique |
| `/api/proposals` | GET, POST, PUT | Propositions + négociation |
| `/api/reservations` | GET, POST, PUT | Réservations + double validation |
| `/api/messages` | GET, POST | Messagerie |
| `/api/machine-templates` | GET, POST, PUT | Templates de machines (admin) |
| `/api/users` | GET, PUT | Liste et gestion des utilisateurs |
| `/api/vip-requests` | GET, POST | Demandes VIP |

---

## 7. Système d'authentification

### 7.1 Fonctionnement

- **Pas de JWT dans les headers** : Le système actuel stocke l'utilisateur complet dans `localStorage` (clé : `ykri_current_user`)
- **AuthContext** (`contexts/AuthContext.tsx`) fournit : `currentUser`, `login()`, `logout()`, `register()`, `updateCurrentUser()`
- **Mot de passe** : hashé avec `bcryptjs` côté serveur, jamais envoyé en clair au frontend

### 7.2 Flux d'authentification

```
1. Utilisateur se connecte → AuthScreen.tsx
2. login(email, password) → apiService.loginUser()
3. POST /api/auth/login → vérifie bcrypt hash
4. Retourne l'objet User → stocké dans localStorage + state React
5. page.tsx redirige vers le dashboard approprié selon user.role
```

### 7.3 Rôles et approbation

| Rôle | Accès | Approbation requise |
|------|-------|-------------------|
| `Admin` | Dashboard admin, gestion utilisateurs, templates | Auto-approuvé |
| `Farmer` | Publier demandes, réserver machines, propositions | Approuvé par Admin |
| `Provider` | Publier offres, répondre aux demandes | Approuvé par Admin |
| `Both` | Les deux + sélecteur de mode (`activeMode`) | Approuvé par Admin |

Un utilisateur avec `approvalStatus: 'pending'` voit l'écran `PendingApproval.tsx`.

### 7.4 Utilisation dans un composant

```tsx
import { useAuth } from '@/contexts/AuthContext';

const MyComponent = () => {
  const { currentUser, logout } = useAuth();

  if (!currentUser) return <p>Non connecté</p>;

  return (
    <div>
      <p>Bienvenue {currentUser.name}</p>
      <p>Rôle : {currentUser.role}</p>
      <button onClick={logout}>Déconnexion</button>
    </div>
  );
};
```

---

## 8. Système d'internationalisation (i18n)

### 8.1 Architecture

Le système i18n est **custom** (pas de bibliothèque externe) :

```
translations.ts          ← Dictionnaire FR/AR (~3000 lignes)
contexts/LanguageContext.tsx  ← Provider + fonction t()
hooks/useLanguage.ts     ← Hook pour accéder au contexte
```

### 8.2 Fichier translations.ts

Structure du fichier :

```typescript
export const translations = {
  fr: {
    common: {
      save: 'Enregistrer',
      cancel: 'Annuler',
      // ...
    },
    auth: {
      login: 'Connexion',
      register: 'Inscription',
      // ...
    },
    offers: {
      title: 'Offres de matériel',
      // ...
    },
    // ... ~50 sections
  },
  ar: {
    common: {
      save: 'حفظ',
      cancel: 'إلغاء',
      // ...
    },
    // ... mêmes sections en arabe
  },
};
```

### 8.3 Utilisation

```tsx
const { t, language, setLanguage, isRTL } = useLanguage();

// Accéder à une traduction (notation par points)
<h1>{t('offers.title')}</h1>

// Gérer la direction RTL
<div style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
  {t('common.welcome')}
</div>

// Changer la langue
<button onClick={() => setLanguage(language === 'fr' ? 'ar' : 'fr')}>
  {language === 'fr' ? 'العربية' : 'Français'}
</button>
```

### 8.4 Fallback

Si une clé n'existe pas en arabe, le système retourne automatiquement la valeur française. Si aucune traduction n'existe, il retourne la clé elle-même.

### 8.5 Ajouter une traduction

1. Ouvrir `translations.ts`
2. Ajouter la clé dans la section `fr` **et** dans la section `ar`
3. Utiliser `t('section.cle')` dans le composant

---

## 9. Système de constantes bilingues

Certaines données statiques (types de machines, régions, villes) sont bilingues et stockées dans `constants/`.

### 9.1 serviceTypes.ts

```typescript
// Structure
export const MACHINE_TYPES = [
  { value: 'tracteur', name: 'Tracteur', nameAr: 'جرار' },
  { value: 'moissonneuse', name: 'Moissonneuse-batteuse', nameAr: 'حصادة دراسة' },
  // ...
];

// Helper
export function translateMachineName(value: string, language: 'fr' | 'ar'): string { ... }
```

### 9.2 moroccoRegions.ts / majorCities.ts

```typescript
export const MOROCCO_REGIONS = [
  { value: 'casablanca-settat', name: 'Casablanca-Settat', nameAr: 'الدار البيضاء-سطات' },
  // ...
];

export function getLocalizedRegionName(value: string, language: 'fr' | 'ar'): string { ... }
export function getLocalizedCityName(cityName: string, language: 'fr' | 'ar'): string { ... }
```

### 9.3 templateFieldTranslations.ts

Dictionnaires de traduction pour les champs dynamiques des formulaires (venant de MachineTemplate) :

```typescript
export const fieldLabelTranslations: Record<string, string> = {
  'Marque': 'الشركة المصنعة',
  'Modèle': 'الموديل',
  // ...
};

export function translateFieldLabel(label: string, language: 'fr' | 'ar'): string { ... }
export function translatePlaceholder(placeholder: string, language: 'fr' | 'ar'): string { ... }
export function translateSelectOption(option: string, language: 'fr' | 'ar'): string { ... }
export function translateCustomFieldKey(key: string, language: 'fr' | 'ar'): string { ... }
```

---

## 10. Composants et navigation

### 10.1 Navigation SPA

L'application utilise un système de **SPA** (Single Page Application) basé sur un état `view` dans `app/page.tsx` :

```typescript
type AppView =
  | 'dashboard' | 'profile' | 'postDemand' | 'postOffer'
  | 'offersFeed' | 'demandsFeed' | 'myDemands' | 'myOffers'
  | 'userSearch' | 'myReservations' | 'messages'
  | 'machineTemplates' | 'myProposals'
  | 'adminPending' | 'adminUsers' | 'adminFeed'
  | 'auth:login' | 'auth:register';
```

La navigation se fait via `setView('nomDeLaVue')` passé en prop à chaque composant.

### 10.2 Détection mobile vs web

```typescript
// page.tsx
const [isMobileApp, setIsMobileApp] = useState(false);

useEffect(() => {
  const maybeCapacitor = (window as any).Capacitor;
  const native = !!(maybeCapacitor?.isNativePlatform?.() || maybeCapacitor?.isNative);
  setIsMobileApp(native || window.innerWidth < 768);
}, []);
```

- **Mobile** : Affiche `FarmerHome`/`ProviderHome` + `BottomNav`/`NewHeader`
- **Web** : Affiche `FarmerDashboard`/`ProviderDashboard` + `Sidebar`/`MobileHeader`

### 10.3 Pattern d'un composant

Tous les composants suivent le même pattern :

```tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/services/apiService';
import { AppView, SetAppView } from '@/types';

interface MonComposantProps {
  setView: SetAppView;
}

const MonComposant: React.FC<MonComposantProps> = ({ setView }) => {
  const { t, language, isRTL } = useLanguage();
  const { currentUser } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await api.someFunction();
        setData(result);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <h1>{t('section.title')}</h1>
      {/* ... */}
    </div>
  );
};

export default MonComposant;
```

### 10.4 Composants UI (shadcn/ui)

Les composants de base (Button, Input, Dialog, Select, Card, etc.) sont dans `components/ui/`. Ils proviennent de [shadcn/ui](https://ui.shadcn.com/) et sont personnalisés localement.

Pour ajouter un nouveau composant shadcn :
```bash
npx shadcn@latest add [nom-du-composant]
```

---

## 11. Gestion des images (Cloudinary)

### 11.1 Configuration

```typescript
// lib/cloudinary.ts
export const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
```

### 11.2 Upload

L'upload se fait directement depuis le navigateur vers Cloudinary (sans passer par le serveur) :

```typescript
const formData = new FormData();
formData.append('file', imageFile);
formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

const response = await fetch(
  `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
  { method: 'POST', body: formData }
);

const data = await response.json();
const imageUrl = data.secure_url; // URL publique de l'image
```

### 11.3 Affichage

Les URLs Cloudinary sont stockées dans les champs `photoUrl` des offres et demandes. Utiliser `<Image>` de Next.js ou `<img>` standard.

---

## 12. Capacitor (wrapper mobile)

### 12.1 Configuration

```javascript
// capacitor.config.js
module.exports = {
  appId: 'com.ikri.app',
  appName: 'IKRI Platform',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    url: process.env.CAPACITOR_SERVER_URL || 'http://10.0.2.2:3000',
    cleartext: true // Pour HTTP en dev
  },
  plugins: {
    StatusBar: { style: 'Light', backgroundColor: '#4C9A2A' }
  }
};
```

### 12.2 Plugins utilisés

| Plugin | Usage |
|--------|-------|
| `@capacitor/camera` | Prise de photo pour les offres/demandes |
| `@capacitor/filesystem` | Lecture/écriture de fichiers |
| `@capacitor/share` | Partage natif |

### 12.3 Utilisation des plugins

```typescript
// lib/mobileUtils.ts
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export const takePhoto = async () => {
  const image = await Camera.getPhoto({
    quality: 80,
    resultType: CameraResultType.Base64,
    source: CameraSource.Camera,
  });
  return image.base64String;
};
```

### 12.4 Workflow de développement mobile

```bash
# 1. Serveur Next.js actif
npm run dev

# 2. Synchroniser les fichiers
npm run mobile:sync

# 3. Ouvrir Android Studio
npm run mobile:open:android

# 4. Lancer sur émulateur/appareil
# → Bouton ▶ dans Android Studio
```

---

## 13. Types TypeScript

Tous les types partagés entre le frontend et l'API sont dans `types.ts` :

### 13.1 Enums

```typescript
enum UserRole       { Admin, Farmer, Provider, Both }
enum ApprovalStatus { Pending, Approved, Denied }
enum DemandStatus   { Waiting, Negotiating, Matched }
enum BookingStatus  { Waiting, Negotiating, Matched }
enum ReservationStatus { Pending, Approved, Rejected }
enum ProposalStatus { Pending, Accepted, Rejected }
```

### 13.2 Interfaces principales

```typescript
interface User { _id, name, email, phone, role, approvalStatus, location, activeMode }
interface Offer { _id, providerId, equipmentType, description, priceRate, city, customFields, ... }
interface Demand { _id, farmerId, title, city, requiredService, serviceType, cropType, area, ... }
interface Proposal { _id, demandId, providerId, price, status, ... }
interface Reservation { _id, farmerId, offerId, providerId, status, ... }
interface Message { _id, senderId, receiverId, content, fileUrl, audioUrl, ... }
```

### 13.3 Types de navigation

```typescript
type AppView = 'dashboard' | 'profile' | 'postDemand' | ... ;
type SetAppView = Dispatch<SetStateAction<AppView>>;
```

---

## 14. Conventions de code

### 14.1 Général

- **Langage** : TypeScript strict (pas de `any` sauf pour les `customFields` JSON)
- **Composants** : Fonctions fléchées avec `React.FC<Props>`
- **Nommage** : PascalCase pour composants, camelCase pour variables/fonctions
- **Fichiers** : Un composant par fichier, nom = nom du composant
- **Directive** : Toujours `"use client"` en haut des composants interactifs

### 14.2 CSS / Tailwind

- Utiliser les classes Tailwind directement dans le JSX
- Utiliser `cn()` de `lib/utils.ts` pour combiner des classes conditionnelles
- Couleurs principales : `#4C9A2A` (vert IKRI), `#FF8C1A` (orange)
- Polices : `Oswald` (titres), `Nunito Sans` (corps)

```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  "p-4 rounded-lg",
  isRTL && "text-right",
  isActive ? "bg-green-600" : "bg-gray-200"
)}>
```

### 14.3 Imports

Ordre recommandé :
1. Modules React/Next
2. Hooks (`useLanguage`, `useAuth`)
3. Services (`apiService`)
4. Types
5. Composants enfants
6. Constantes

Utiliser les alias `@/` (configuré dans `tsconfig.json`) :

```typescript
import { useLanguage } from '@/hooks/useLanguage';    // ✅
import { useLanguage } from '../../hooks/useLanguage'; // ❌
```

### 14.4 Traductions

- **Toujours** utiliser `t('cle')` pour le texte visible
- **Jamais** de texte en dur en français ou en arabe dans le JSX
- Penser à ajouter la traduction arabe en même temps que la française

### 14.5 Direction RTL

- Utiliser `dir={isRTL ? 'rtl' : 'ltr'}` sur les conteneurs principaux
- Remplacer `left`/`right` Tailwind par `start`/`end` quand possible
- Tester l'interface en arabe après chaque modification de layout

---

## 15. Guide : Ajouter une nouvelle fonctionnalité

Exemple : ajouter une page "Historique des transactions"

### Étape 1 — Ajouter la vue

Dans `types.ts` :
```typescript
export type AppView = ... | 'transactionHistory';
```

### Étape 2 — Créer le composant

Créer `components/TransactionHistory.tsx` en suivant le pattern de la section 10.3.

### Étape 3 — Ajouter la route dans page.tsx

Dans `app/page.tsx`, ajouter dans le switch/condition de rendu :
```tsx
{view === 'transactionHistory' && <TransactionHistory setView={setView} />}
```

### Étape 4 — Ajouter la navigation

Dans `BottomNav.tsx` / `Sidebar.tsx`, ajouter un lien :
```tsx
<button onClick={() => setView('transactionHistory')}>
  {t('transactions.title')}
</button>
```

### Étape 5 — Ajouter les traductions

Dans `translations.ts` :
```typescript
fr: { transactions: { title: 'Historique', ... } },
ar: { transactions: { title: 'السجل', ... } }
```

### Étape 6 — Créer la route API si nécessaire

Créer `app/api/transactions/route.ts` avec les handlers GET/POST.

### Étape 7 — Ajouter le service client

Dans `services/apiService.ts`, ajouter les fonctions d'appel API.

---

## 16. Guide : Ajouter une traduction

### 16.1 Texte simple

```typescript
// translations.ts
fr: {
  maSection: {
    monTexte: 'Mon texte en français',
  }
},
ar: {
  maSection: {
    monTexte: 'النص بالعربية',
  }
}
```

Usage : `t('maSection.monTexte')`

### 16.2 Constante bilingue

Pour un nouveau type de machine dans `constants/serviceTypes.ts` :

```typescript
MACHINE_TYPES.push({
  value: 'nouveau_type',
  name: 'Nouveau Type',
  nameAr: 'نوع جديد'
});
```

Usage : `translateMachineName('nouveau_type', language)`

### 16.3 Champ de formulaire dynamique

Si le nouveau template de machine a un champ "Puissance" :

1. Ajouter dans `constants/templateFieldTranslations.ts` :
```typescript
fieldLabelTranslations['Puissance'] = 'القوة';
placeholderTranslations['Entrez la puissance'] = 'أدخل القوة';
```

---

## 17. Guide : Ajouter un nouveau modèle DB

### Étape 1 — Modifier le schéma Prisma

Dans `prisma/schema.prisma` :
```prisma
model Transaction {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  amount      Float
  type        String
  createdAt   DateTime @default(now())

  @@index([userId])
  @@map("transactions")
}
```

### Étape 2 — Créer la migration

```bash
npm run db:migrate
# Nom : "add_transaction_model"
```

### Étape 3 — Régénérer le client

```bash
npm run db:generate
```

### Étape 4 — Ajouter le type frontend

Dans `types.ts` :
```typescript
export interface Transaction {
  _id: string;
  userId: string;
  amount: number;
  type: string;
  createdAt: Date;
}
```

### Étape 5 — Créer la route API

`app/api/transactions/route.ts` → voir section 6.1.

### Étape 6 — Ajouter les fonctions dans apiService.ts

```typescript
export const getTransactions = async (): Promise<Transaction[]> => {
  const response = await apiFetch('/api/transactions');
  return response.json();
};
```

---

## 18. Guide : Ajouter une route API

### Structure du fichier

```
app/api/
  └── mon-endpoint/
      ├── route.ts              # GET (liste) + POST (création)
      └── [id]/
          └── route.ts          # GET + PUT + DELETE (par ID)
```

### Template de base

```typescript
// app/api/mon-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const data = await prisma.monModele.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    // Mapper id → _id pour le frontend
    const result = data.map(item => ({
      _id: item.id,
      ...item,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation
    if (!body.requiredField) {
      return NextResponse.json(
        { error: 'Champ requis manquant' },
        { status: 400 }
      );
    }

    const created = await prisma.monModele.create({
      data: { ... },
    });

    return NextResponse.json(
      { _id: created.id, ...created },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
```

---

## 19. Outils utiles

### 19.1 Prisma Studio (interface DB graphique)

```bash
npm run db:studio
# Ouvre http://localhost:5555
```

### 19.2 Scripts utilitaires

```bash
# Lister les utilisateurs
node scripts/list-users.js

# Supprimer des offres/demandes
node scripts/delete-offers-demands.js
```

### 19.3 Vérification du code

```bash
npm run lint          # ESLint
npx tsc --noEmit      # Vérification TypeScript sans build
```

### 19.4 Débogage

- **Console navigateur** : Tous les appels API sont loggés en console
- **Prisma Studio** : Visualiser et modifier les données directement
- **Android Logcat** : Dans Android Studio → Logcat pour les erreurs de l'app mobile

---

## 20. Déploiement

### 20.1 Web (Vercel)

Le déploiement est automatique via GitHub :

1. Push sur la branche `main`
2. Vercel détecte le changement et lance le build
3. Variables d'environnement à configurer dans **Vercel Dashboard → Settings → Environment Variables**

Variables requises sur Vercel :
- `DATABASE_URL`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
- `NEXT_PUBLIC_API_URL` → `/api`

### 20.2 Mobile (APK)

1. Dans Android Studio : **Build → Build Bundle / APK → Build APK**
2. L'APK est généré dans `android/app/build/outputs/apk/debug/`
3. Pour la production : configurer la signature dans `android/app/build.gradle`

### 20.3 Base de données

- Hébergée sur [Neon](https://neon.tech/)
- Les migrations sont appliquées automatiquement avec `npm run db:migrate:deploy`
- Faire un backup régulier via le dashboard Neon

---

## Annexe : Identité visuelle

| Attribut | Valeur |
|----------|--------|
| Couleur principale | `#4C9A2A` (vert) |
| Couleur secondaire | `#FF8C1A` (orange) |
| Police titres | Oswald |
| Police corps | Nunito Sans |
| Nom de l'app | IKRI (يكري) |

---

