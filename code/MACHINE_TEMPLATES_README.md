# Machine Templates System

## Vue d'ensemble

Ce système permet de gérer dynamiquement tous les types de machines agricoles avec leurs spécifications propres. Chaque type de machine a des champs personnalisés adaptés à ses caractéristiques.

## Catégories de machines et leurs spécifications

### 1. Travail du sol (Labour & Préparation)
- **Tracteurs** (4 gammes de puissance)
  - Marque, Modèle, Année, État
  - Puissance (CV), Transmission, Traction (4x2/4x4)
  - Équipements spéciaux

- **Charrues** (portées, semi-portées)
  - Nombre de corps, Largeur de travail
  - Profondeur max, Type (réversible ou non)

- **Autres équipements** (Sous-soleuses, Cover-crops, Rotavators, Herses, Cultivateurs)
  - Largeur de travail, Type de rotor
  - Spécifications techniques

### 2. Semis & Plantation
- **Semoirs** (monograines, céréales, directs)
  - Nombre de rangs, Largeur de travail
  - Capacité de la trémie, Types de graines compatibles

- **Planteuses** (patates, légumes, canne à sucre)
  - Nombre de rangs, Écartement inter-rangs
  - Écartement sur le rang, Capacité

### 3. Irrigation
- **Pompes et systèmes d'irrigation**
  - Débit (m³/h), Pression (bars)
  - Longueur du tuyau, Source d'énergie
  - Type (diesel, électrique, PTO)

### 4. Fertilisation et Traitement
- **Épandeurs** (engrais, fumier)
  - Capacité, Largeur d'épandage
  - Type d'épandage (centrifuge, pneumatique, hérissons)

- **Pulvérisateurs et Atomiseurs**
  - Capacité du réservoir, Largeur de pulvérisation
  - Type de pompe, Type de rampe

### 5. Récolte
- **Moissonneuses-batteuses**
  - Largeur de coupe, Capacité de la trémie
  - Puissance moteur, Cultures compatibles

- **Ensileuses, Faucheuses, Faneuses, Andaineurs**
  - Largeur de travail, Nombre de rotors
  - Type de rotor

- **Presses à balles**
  - Type de balle (ronde/cubique)
  - Dimension des balles, Type de liage

- **Arracheuses et Récolteuses spécialisées**
  - Nombre de rangs, Capacité de stockage
  - Cultures compatibles

### 6. Fourrage & Élevage
- Mélangeuses, Broyeurs, Remorques, Tondeuses, Chargeurs
- Spécifications selon le type

### 7. Transport
- **Remorques agricoles** (plusieurs capacités)
  - Capacité de charge, Longueur de plateau
  - Basculante (oui/non), Nombre d'essieux

### 8. Travaux connexes (BTP)
- **Engins de terrassement** (Mini-pelles, Chargeuses, Bulldozers, etc.)
  - Poids en ordre de marche, Puissance moteur
  - Capacité du godet, Profondeur de fouille

### 9. Arboriculture & Viticulture
- Broyeurs, Tailleuses, Pulvérisateurs, Secoueurs, Plateformes
- Spécifications adaptées

### 10. Services technologiques
- **Drones agricoles**
  - Charge utile max, Autonomie de vol
  - Capacité du réservoir, Superficie couverte
  - Fonctionnalités (GPS RTK, caméra, etc.)

- **Équipements connectés** (Stations météo, GPS, Capteurs)
  - Connectivité, Autonomie batterie
  - Fonctionnalités et mesures

## Utilisation

### 1. Initialiser les templates de machines

Pour créer tous les templates de machines dans la base de données :

```bash
cd code
pnpm db:seed:machines
```

Cette commande va créer **environ 70 types de machines** avec leurs spécifications adaptées.

### 2. Gestion via l'interface Admin

Les administrateurs peuvent gérer les templates de machines via l'interface "Manage Machines" :
- Voir tous les templates
- Créer de nouveaux templates
- Modifier les champs dynamiques
- Activer/désactiver des templates

### 3. Utilisation dans les formulaires

Quand un prestataire publie une offre :
1. Il sélectionne le type de machine dans la liste
2. Le formulaire affiche automatiquement les champs appropriés
3. Il remplit les spécifications (marque, modèle, puissance, etc.)
4. Ces données sont stockées dans `customFields`

## Structure de données

Chaque machine template contient :

```typescript
{
  name: string              // Nom de la machine
  description: string       // Catégorie et sous-catégorie
  isActive: boolean         // Actif/Inactif
  fieldDefinitions: [       // Champs dynamiques
    {
      name: string          // Nom du champ (ex: 'horsepower')
      label: string         // Label affiché (ex: 'Puissance (CV)')
      type: 'text' | 'number' | 'select' | 'textarea'
      required: boolean
      options?: string[]    // Pour les champs select
      placeholder?: string
    }
  ]
}
```

## Champs communs à toutes les machines

Tous les templates incluent ces champs de base :
- **Marque** (text, requis)
- **Modèle** (text, requis)
- **Année de fabrication** (number, requis)
- **État** (select, requis) : Excellent / Bon / Acceptable / Nécessite réparation

Puis des champs spécifiques selon le type de machine.

## Ajout de nouveaux types

Pour ajouter un nouveau type de machine :

1. Ajouter dans `constants/serviceTypes.ts` si nécessaire
2. Définir les champs spécifiques dans `prisma/seed-machines.ts`
3. Relancer `pnpm db:seed:machines`

Ou créer directement via l'interface Admin.

## API Endpoints

- `GET /api/machine-templates?active=true` - Liste les templates actifs
- `POST /api/machine-templates` - Créer un template (admin)
- `GET /api/machine-templates/[id]` - Détails d'un template
- `PUT /api/machine-templates/[id]` - Modifier un template (admin)
- `DELETE /api/machine-templates/[id]` - Supprimer un template (admin)

## Notes importantes

- Les templates ne sont pas supprimés physiquement, seulement désactivés (isActive = false)
- Les offres existantes conservent leurs champs même si le template est modifié
- Chaque template doit avoir un nom unique
- Les champs dynamiques sont stockés en JSON dans la base de données
