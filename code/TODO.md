# TODO List

## ✅ Completed Tasks - VIP Profile Implementation
- [x] Create VIPDashboard component combining farmer and provider functionalities
- [x] Update App.tsx to import and render VIPDashboard for UserRole.VIP
- [x] Update Register.tsx to include VIP option in role selection

## ✅ Completed Tasks - Map Improvements (Nov 23, 2025)
- [x] Implement map grouping by machine (not by person)
- [x] Add 50m random offset for overlapping markers
- [x] Create MapFilters component (offers/demands, machine type, radius)
- [x] Update VIPDashboard, PostOffer, PostDemand to use new map logic

## ✅ Completed Tasks - Proposal System (Nov 24-25, 2025)
- [x] Update Prisma schema (Proposal, Notification models)
- [x] Add new required fields to Demand (title, city, address, description)
- [x] Create API routes for proposals (GET, POST, PATCH with accept/refuse)
- [x] Create API routes for notifications (GET, POST, PATCH, mark-all-read)
- [x] Update demands API to broadcast notifications on creation
- [x] Update TypeScript types (Proposal, Notification interfaces)
- [x] Create PostDemandNew.tsx component (enhanced form with GPS)
- [x] Create DemandDetails.tsx component (details + proposals list)
- [x] Create ProposalModal.tsx component (submit proposal form)
- [x] Create NotificationBell.tsx component (header notification icon)
- [x] Update Header.tsx to integrate NotificationBell
- [x] Update DemandsFeed.tsx with "Voir les détails" button
- [x] Update App.tsx to add 'demandDetails' view
- [x] Create comprehensive documentation (PROPOSAL_SYSTEM_GUIDE.md)

## 🚨 CRITICAL - Database Migration Required
- [ ] **STOP the dev server** (`Ctrl+C` on `npm run dev`)
- [ ] Run `npx prisma migrate dev --name add_proposals_and_notifications`
- [ ] Run `npx prisma generate`
- [ ] Restart dev server with `npm run dev`

⚠️ **ALL NEW FEATURES ARE BLOCKED** until migration is completed!

## 🧪 Testing Tasks (After Migration)
- [ ] Test new demand publication flow (PostDemandNew.tsx)
- [ ] Test proposal submission (ProposalModal.tsx)
- [ ] Test proposal acceptance (auto-rejection logic)
- [ ] Test proposal refusal
- [ ] Test notification system (bell icon, dropdown, mark read)
- [ ] Test notification broadcasting to all providers
- [ ] Test DemandDetails view for farmers (see proposals)
- [ ] Test DemandDetails view for providers (submit proposal)
- [ ] Verify GPS geolocation + draggable marker works
- [ ] Verify form validations (min 20 chars description, min 50 chars proposal)

## 🔄 Pending VIP Tasks
- [ ] Test VIP dashboard functionality (post demands, post offers, view matches, view local services)
- [ ] Update translations.ts to include VIP-related translations if needed
- [ ] Verify API services work correctly for VIP users (demands and offers retrieval)
- [ ] Test registration flow for VIP users
- [ ] Test login and dashboard switching for VIP users

## 🚀 Future Enhancements
- [ ] Implement real-time notifications with WebSockets
- [ ] Add proposal editing (while status = pending)
- [ ] Add acceptance cancellation (within X hours)
- [ ] Add rating system after service completion
- [ ] Add advanced filters in DemandsFeed (price, distance, machine)
- [ ] Add proposal history per provider
- [ ] Add statistics dashboard (acceptance rate, average prices)
- [ ] Integrate chat directly in DemandDetails
- [ ] Add automatic address geocoding with API
- [ ] Support multiple photo uploads for demands

## 📚 Documentation
- [x] PROPOSAL_SYSTEM_GUIDE.md - Complete workflow documentation
- [x] API_MIGRATION_COMPLETE.md - API migration history
- [x] DATABASE_SETUP.md - Database setup instructions

## Notes
- **VIP dashboard** combines both farmer and provider features in a unified interface
- **Proposal system** implements complete workflow: publish → propose → accept/refuse → notify
- **Notification system** uses polling (30s interval), not real-time
- **Migration is CRITICAL** - All new code cannot be tested until schema is applied
- See `PROPOSAL_SYSTEM_GUIDE.md` for complete feature documentation
