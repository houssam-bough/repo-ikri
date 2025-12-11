# IKRI Platform - Agricultural Equipment Sharing Platform

## 📋 Overview

IKRI is a comprehensive web platform designed to connect farmers with agricultural equipment providers, enabling efficient equipment sharing and service booking within agricultural communities. The platform facilitates direct communication, service discovery, and equipment reservation management.

### ✨ Latest Update (v2.2.0) - November 30, 2025

**NEW: Professional Landing Page with Full Bilingual Support**
- 🎨 Complete landing page redesign with modern animations and gradients
- 🌍 Full English/French translation support across entire landing page
- ✨ Animated hero section with floating particles and gradient blobs
- 📊 Statistics section showcasing platform metrics
- 🎯 Features section highlighting 5 core platform capabilities
- 📝 How It Works section with 4-step process visualization
- 🚀 Call-to-action banner with animated elements
- 📱 Fully responsive footer with comprehensive links
- 🎬 Motion animations using Framer Motion library
- 🔄 Language toggle persists across all pages

**Previous Update (v2.1.0)**
- 🎤 Voice messages and attachments in messaging system
- 📷 Image uploads (JPEG, PNG, GIF, WebP)
- 📄 PDF document sharing
- 🎵 Integrated audio player with progress bar

> 📖 **Documentation complète:** Voir `MESSAGES_ATTACHMENTS_FEATURE.md` et `QUICK_START_GUIDE.md`

---

## 🚀 Quick Start for Teammates

### Prerequisites

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
3. **Git** - [Download](https://git-scm.com/)

### Setup Instructions (First Time)

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/ikri-platform.git
cd ikri-platform

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env

# 4. Start PostgreSQL database (requires Docker Desktop running)
npm run db:up

# 5. Create database tables
npx prisma db push

# 6. Seed database with demo data
npm run db:seed

# 7. Start the development server
npm run dev
```

### Demo Accounts

After seeding, you can login with these accounts:

- **Admin**: `admin@ikri.com` / `password123`
- **Farmer**: `farmer@ikri.com` / `password123`
- **Provider**: `provider@ikri.com` / `password123`
- **VIP**: `vip@ikri.com` / `password123`

### Database Commands

```bash
npm run db:up        # Start PostgreSQL container
npm run db:down      # Stop PostgreSQL container
npx prisma db push   # Create/update database tables
npm run db:seed      # Populate with demo data
npm run db:reset     # Reset database (caution: deletes all data)
npm run db:studio    # Open Prisma Studio (visual database editor)
```

### Daily Development Workflow

```bash
# Start database (if not running)
npm run db:up

# Start development server
npm run dev

# Open app in browser: http://localhost:3000
```

### Troubleshooting

**Database connection error?**
- Make sure Docker Desktop is running
- Check if PostgreSQL container is up: `docker ps`
- Restart database: `npm run db:down && npm run db:up`

**Database schema errors?**
- Push schema again: `npx prisma db push`
- If that fails, reset: `npm run db:reset`
- Then seed again: `npm run db:seed`

**Port 5432 already in use?**
- Stop other PostgreSQL instances
- Or change port in `docker-compose.yml`

---

## 🎯 Core Functionalities

### 1. **User Management & Authentication**

- **Multi-Role System**: Support for four distinct user types:
  - **Farmers**: Request and reserve agricultural equipment/services
  - **Providers**: Offer equipment and services for rent
  - **VIP Users**: Combined farmer + provider capabilities with premium features
  - **Administrators**: Platform management and user approval

- **Registration & Approval Workflow**:
  - Users register with role selection
  - Admin approval required before full platform access
  - Pending approval status screen for new users
  - Profile management for all users

### 2. **Offers & Demands System**

#### **Offers Feed** (Equipment/Services Available)
- Providers post available equipment with:
  - Equipment type and specifications
  - Description and features
  - Pricing information
  - Location data (GPS coordinates)
  - Availability time slots
- Farmers can browse all available offers
- Real-time map view showing offer locations
- Filtering and search capabilities

#### **Demands Feed** (Equipment/Services Needed)
- Farmers post their equipment needs with:
  - Required equipment type
  - Specific requirements
  - Needed time period
  - Budget range
  - Location information
- Providers can view demands and respond
- Helps match supply with actual demand

### 3. **Reservation System**

#### **For Farmers**:
- Browse offers and select services
- **Reserve equipment with specific time slots**:
  - Select start and end dates
  - View pricing calculations
  - Submit reservation requests
- **My Reservations Dashboard**:
  - View all reservations (pending, approved, rejected)
  - Filter by status
  - Cancel pending reservations
  - Track reservation history

#### **For Providers**:
- **Reservation Management Panel**:
  - View incoming reservation requests
  - Approve or reject reservations with notes
  - Automatic availability checking (prevents double-booking)
  - Real-time notification of new requests
- **Availability Protection**:
  - System automatically checks for conflicting reservations
  - Cannot double-book the same equipment
  - Clear visibility of reserved time periods

### 4. **Messaging System**

#### **Real-Time Communication**:
- **Inbox Interface**:
  - Conversation list with all contacts
  - Unread message indicators
  - Last message preview
  - Timestamp display

#### **Context-Aware Messaging**:
- Send messages **from offers**: "Contact Provider" button
- Send messages **from demands**: "Contact Farmer" button  
- Send messages **from user search**: Direct messaging to any user
- Messages linked to specific offers/demands for context

#### **Chat Features**:
- Real-time message sending
- Message history preservation
- Read/unread status tracking
- Keyboard shortcuts (Enter to send)
- Responsive chat interface

### 5. **User Discovery**

- **Advanced User Search**:
  - Search users by name
  - View user profiles with role badges
  - Contact information display
  - Location coordinates
  - Direct messaging from search results

### 6. **Geographic Features**

- **Interactive Map View**:
  - Visualize offers on map
  - Location-based service discovery
  - GPS coordinate storage
  - Distance-based filtering (future enhancement)

### 7. **VIP Features**

- **Dual Functionality**:
  - Post both offers AND demands
  - Access to all farmer features
  - Access to all provider features
  - Enhanced visibility in platform

### 8. **Admin Controls**

- **User Management**:
  - Approve/reject new user registrations
  - View all platform users
  - Manage user roles
  - Platform moderation capabilities

---

## 🛠️ Technology Stack

### **Frontend Framework**
- **Next.js 16.0.1** (with Turbopack)
  - **Why**: React-based framework providing server-side rendering, optimal performance, and excellent developer experience
  - **Benefits**: Fast page loads, SEO optimization, built-in routing, automatic code splitting

### **UI & Styling**
- **React 19.0.0**
  - **Why**: Industry-standard library for building interactive UIs
  - **Benefits**: Component-based architecture, large ecosystem, strong community support

- **TypeScript 5.7.2**
  - **Why**: Type safety and better developer experience
  - **Benefits**: Catch errors at compile time, better IDE support, self-documenting code

- **Tailwind CSS 3.4.17**
  - **Why**: Utility-first CSS framework for rapid UI development
  - **Benefits**: Fast styling, consistent design system, small bundle size, responsive design made easy

- **Framer Motion (motion/react)**
  - **Why**: Production-ready animation library for React
  - **Benefits**: Smooth scroll animations, gesture controls, layout animations, easy-to-use API
  - **Usage**: Landing page hero animations, floating elements, scroll-triggered reveals

- **Shadcn/UI Components**
  - **Why**: High-quality, accessible, customizable React components
  - **Benefits**: Professional UI out of the box, accessibility built-in, full customization control

- **Lucide React**
  - **Why**: Modern icon library with 1000+ customizable icons
  - **Benefits**: Tree-shakeable, TypeScript support, consistent design language

### **Data Persistence**
- **PostgreSQL 16** (via Docker)
  - **Why**: Robust relational database for production-ready applications
  - **Benefits**: 
    - Multi-device data synchronization
    - Team collaboration on shared database
    - ACID compliance and data integrity
    - Scalable for production deployment
    - Industry-standard SQL database
  - **Structure**: 7 tables (users, offers, demands, reservations, messages, availabilitySlots, vipUpgradeRequests)

- **Prisma ORM 5.22.0**
  - **Why**: Modern database toolkit for TypeScript/Node.js
  - **Benefits**:
    - Type-safe database queries
    - Auto-generated TypeScript types
    - Visual database management (Prisma Studio)
    - Simple schema management
    - Excellent developer experience

### **State Management**
- **React Context API**
  - **Authentication Context**: Global user state management
  - **Language Context**: Multi-language support (French/English)
  - **Why**: Built-in React solution, no external dependencies needed

### **Geolocation**
- **Browser Geolocation API**
  - **Why**: Native browser capability for GPS coordinates
  - **Benefits**: No external API costs, real-time location access

### **Build Tools**
- **Turbopack** (Next.js 16 bundler)
  - **Why**: Next-generation bundler replacing Webpack
  - **Benefits**: 700x faster updates, 10x faster builds

- **pnpm** (Package Manager)
  - **Why**: Fast, disk-space efficient package manager
  - **Benefits**: Faster installs, saves disk space, strict dependency resolution

---

## 🏗️ Architecture Decisions

### **Why PostgreSQL + Prisma?**

1. **Multi-Device Sync**: Data accessible across all devices and team members
2. **Production Ready**: Industry-standard database for scalable applications
3. **Data Integrity**: ACID compliance ensures consistent data state
4. **Team Collaboration**: Shared database for all 3 team members
5. **Type Safety**: Prisma generates TypeScript types from database schema
6. **Easy Deployment**: Compatible with Vercel Postgres, Supabase, Neon, AWS RDS

### **Why Next.js App Router?**

1. **Modern Architecture**: Latest React patterns (Server Components)
2. **Performance**: Automatic optimization and code splitting
3. **SEO Ready**: Server-side rendering for public pages
4. **Developer Experience**: File-based routing, built-in optimizations

### **Why TypeScript?**

1. **Type Safety**: Catch bugs before runtime
2. **Better IDE Support**: Autocomplete, refactoring tools
3. **Documentation**: Types serve as inline documentation
4. **Maintainability**: Easier to refactor and scale

### **Component Library Strategy (Shadcn/UI)**

1. **Customization**: Components live in your codebase (full control)
2. **No Lock-in**: Not a dependency, copy-paste components
3. **Accessibility**: Built with Radix UI primitives (WCAG compliant)
4. **Consistency**: Pre-built design system

---

## 📱 Key User Flows

### **Farmer Flow**
1. Register → Wait for admin approval
2. Browse offers feed (list or map view)
3. Select service and reserve with time slots
4. Message provider for clarifications
5. View reservation status in "My Reservations"
6. Track approved bookings

### **Provider Flow**
1. Register → Wait for admin approval
2. Post equipment offers with details
3. Receive reservation requests
4. Review and approve/reject reservations
5. Manage availability automatically
6. Communicate with farmers via messages

### **VIP Flow**
1. Register as VIP → Wait for approval
2. Post offers (as provider)
3. Post demands (as farmer)
4. Reserve services from others
5. Manage incoming reservations
6. Full platform access

---

## 🔐 Security & Data Management

### **Current Implementation**
- Server-side PostgreSQL database
- REST API routes for all operations
- Role-based access control
- Admin approval workflow
- Password hashing with bcrypt

### **Future Considerations for Production**
- Implement JWT authentication tokens
- Add API rate limiting
- Enable WebSocket for real-time updates
- Implement automated database backups
- Add Redis caching layer
- Set up database replication

---

## 🚀 Deployment & Setup

### **Development**
```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

### **Production Deployment Options**
- **Vercel**: Optimized for Next.js (recommended)
- **Netlify**: Static + serverless functions
- **AWS Amplify**: Full AWS integration
- **Self-hosted**: Any Node.js hosting

---

## 📊 Current Database Schema

### **Users**
- `id`, `email`, `password`, `name`, `phone`, `role`, `locationLat`, `locationLon`, `approvalStatus`, `createdAt`

### **Offers**
- `id`, `providerId`, `providerName`, `equipmentType`, `description`, `priceRate`, `serviceAreaLat`, `serviceAreaLon`, `status`, `photoUrl`, `createdAt`

### **AvailabilitySlots**
- `id`, `offerId`, `startTime`, `endTime` (one-to-many with Offers)

### **Demands**
- `id`, `farmerId`, `farmerName`, `requiredService`, `requiredStart`, `requiredEnd`, `jobLocationLat`, `jobLocationLon`, `description`, `status`, `photoUrl`, `createdAt`

### **Reservations**
- `id`, `farmerId`, `farmerName`, `farmerPhone`, `providerId`, `providerName`, `offerId`, `equipmentType`, `reservedStart`, `reservedEnd`, `priceRate`, `totalCost`, `status`, `approvedAt`, `createdAt`

### **Messages**
- `id`, `senderId`, `senderName`, `receiverId`, `receiverName`, `content`, `relatedOfferId`, `relatedDemandId`, `read`, `createdAt`

### **VIPUpgradeRequests**
- `id`, `userId`, `userName`, `userEmail`, `currentRole`, `status`, `requestDate`

---

## 🌐 Multi-Language Support

- **Complete Bilingual System**: English and French
- **Landing Page**: Fully translated with 60+ translation keys
  - Hero section with dynamic text
  - Statistics and features sections
  - How it works step-by-step
  - CTA banners and footer content
- **Application Pages**: All dashboard and feature pages translated
- **Switchable Toggle**: Language selector in header
- **Persistent Preference**: Language choice saved across sessions
- **Context-Based**: useLanguage() hook for easy integration
- **Translation Keys**: Organized structure in `translations.ts`

---

## 🎨 Design Highlights

### **Landing Page**
- **Modern Hero Section**: Animated gradient blobs and floating particles
- **Scroll Animations**: Elements reveal on scroll with smooth transitions
- **Interactive Cards**: Hover effects with scale and shadow transitions
- **Gradient Accents**: Primary green (#2d5f2e) and accent orange (#e97538)
- **Typography Scale**: From 11px to 56px with precise font weights
- **3D Effects**: Floating cards with depth and shadow layers
- **Background Patterns**: Animated SVG patterns and gradient overlays
- **Call-to-Action**: Animated stripes and pulsing badges

### **Platform Design**
- **Gradient-based color scheme**: Modern, vibrant gradients
- **Responsive design**: Works on mobile, tablet, and desktop
- **Accessibility**: WCAG compliant components
- **Consistent spacing**: Tailwind spacing scale with pt-16 for fixed header
- **Loading states**: Smooth transitions and spinners
- **Interactive feedback**: Hover states, animations, and micro-interactions
- **Fixed Header**: 80px height (h-20) with scroll detection
- **Map Integration**: Interactive geographic visualization

---

## 🔄 Future Enhancement Roadmap

1. **Backend Migration**: Move to Node.js + PostgreSQL for multi-device sync
2. **Real-time Updates**: WebSocket integration for live notifications
3. **Payment Integration**: Stripe/PayPal for secure transactions
4. **Rating System**: User reviews and ratings
5. **Analytics Dashboard**: Usage statistics for admins
6. **Mobile App**: React Native version
7. **Advanced Search**: Filters by price, location radius, equipment type
8. **Image Uploads**: Equipment photos
9. **Calendar Integration**: Sync reservations with Google Calendar
10. **SMS Notifications**: Reservation confirmations via SMS

---

## 📞 Contact & Support

For questions about the platform or technical implementation, please contact the development team.

---

## 📄 License

Proprietary - All rights reserved to IKRI Platform

---

**Last Updated**: November 30, 2025  
**Version**: 2.2.0 (Landing Page + Full Translation)  
**Status**: Production Ready - Professional Landing Page with Bilingual Support  
**Database**: PostgreSQL 16 with Docker  
**ORM**: Prisma 5.22.0  
**Animations**: Framer Motion (motion/react)  
**Translation System**: 200+ keys across EN/FR
