import {
  type User,
  type Offer,
  type Demand,
  UserRole,
  ApprovalStatus,
  type TimeSlot,
  DemandStatus,
  OfferStatus,
} from "../types"
import * as db from "./mockDb"
import { getDistanceInKm } from "./geoService"
import { GEO_SEARCH_RADIUS_KM } from "../constants"

// --- Account Management & Admin ---

export const getPendingUsers = async (): Promise<User[]> => {
  return db.dbGetUsers().filter((u) => u.approvalStatus === ApprovalStatus.Pending)
}

export const approveUser = async (userId: string): Promise<User | undefined> => {
  return db.dbUpdateUserStatus(userId, ApprovalStatus.Approved)
}

export const rejectUser = async (userId: string): Promise<User | undefined> => {
  return db.dbUpdateUserStatus(userId, ApprovalStatus.Denied)
}

export const updateUserProfile = async (
  userId: string,
  profileData: Partial<Omit<User, "_id" | "email" | "role" | "approvalStatus" | "password">>,
): Promise<User | undefined> => {
  return db.dbUpdateUser(userId, profileData)
}

// --- Admin Demand Management ---

export const getPendingDemands = async (): Promise<Demand[]> => {
  return db.dbGetDemands().filter((d) => d.status === DemandStatus.Pending)
}

export const approveDemand = async (demandId: string): Promise<Demand | undefined> => {
  return db.dbUpdateDemandStatus(demandId, DemandStatus.Open)
}

export const rejectDemand = async (demandId: string): Promise<Demand | undefined> => {
  return db.dbUpdateDemandStatus(demandId, DemandStatus.Rejected)
}

// --- Admin Offer Management ---

export const getPendingOffers = async (): Promise<Offer[]> => {
  return db.dbGetOffers().filter((o) => o.status === OfferStatus.Pending)
}

export const approveOffer = async (offerId: string): Promise<Offer | undefined> => {
  return db.dbUpdateOfferStatus(offerId, OfferStatus.Approved)
}

export const rejectOffer = async (offerId: string): Promise<Offer | undefined> => {
  return db.dbUpdateOfferStatus(offerId, OfferStatus.Rejected)
}

export const getAllDemands = async (): Promise<Demand[]> => {
  return db.dbGetDemands().filter((d) => d.status === DemandStatus.Open)
}

export const getAllOffers = async (): Promise<Offer[]> => {
  return db.dbGetOffers().filter((o) => o.status === OfferStatus.Approved)
}

// --- Farmer Workflow ---

export const getDemandsForFarmer = async (farmerId: string): Promise<Demand[]> => {
  return db.dbGetDemandsByFarmerId(farmerId)
}

export const postDemand = async (demandData: Omit<Demand, "_id" | "status">): Promise<Demand> => {
  const newDemand = {
    ...demandData,
    status: DemandStatus.Pending, // Status is now Pending
  }
  return db.dbAddDemand(newDemand)
}

const timeSlotsOverlap = (slot1: TimeSlot, slot2: TimeSlot): boolean => {
  return slot1.start < slot2.end && slot1.end > slot2.start
}

export const findMatchesForDemand = async (demandId: string): Promise<Offer[]> => {
  const demand = db.dbGetDemandById(demandId)
  if (!demand || demand.status !== DemandStatus.Open) {
    // Only match open demands
    throw new Error("Demand not found or is not open for matching.")
  }

  const allOffers = db.dbGetOffers()
  const allUsers = db.dbGetUsers()

  const approvedProviderIds = new Set(
    allUsers
      .filter((u) => u.role === UserRole.Provider && u.approvalStatus === ApprovalStatus.Approved)
      .map((u) => u._id),
  )

  const matchedOffers = allOffers.filter((offer) => {
    // Check if provider and offer are approved
    if (!approvedProviderIds.has(offer.providerId) || offer.status !== OfferStatus.Approved) {
      return false
    }

    // Check geographical proximity
    const distance = getDistanceInKm(demand.jobLocation, offer.serviceAreaLocation)
    if (distance > GEO_SEARCH_RADIUS_KM) {
      return false
    }

    // Check for time slot overlap
    const hasOverlap = offer.availability.some((availSlot) => timeSlotsOverlap(demand.requiredTimeSlot, availSlot))

    return hasOverlap
  })

  return matchedOffers
}

export const findLocalOffers = async (farmerId: string): Promise<Offer[]> => {
  const farmer = db.dbGetUsers().find((u) => u._id === farmerId)
  if (!farmer) {
    throw new Error("Farmer not found")
  }

  const farmerLocation = farmer.location
  const allOffers = db.dbGetOffers()
  const allUsers = db.dbGetUsers()

  const approvedProviderIds = new Set(
    allUsers
      .filter((u) => u.role === UserRole.Provider && u.approvalStatus === ApprovalStatus.Approved)
      .map((u) => u._id),
  )

  const localOffers = allOffers.filter((offer) => {
    if (!approvedProviderIds.has(offer.providerId)) {
      return false
    }

    if (offer.status !== OfferStatus.Approved) {
      return false
    }

    const distance = getDistanceInKm(offer.serviceAreaLocation, farmerLocation)
    return distance <= GEO_SEARCH_RADIUS_KM
  })

  return localOffers
}

// --- Provider Workflow ---

export const getOffersForProvider = async (providerId: string): Promise<Offer[]> => {
  return db.dbGetOffersByProviderId(providerId)
}

export const postOffer = async (offerData: Omit<Offer, "_id" | "status">): Promise<Offer> => {
  const newOffer = {
    ...offerData,
    status: OfferStatus.Pending,
  }
  return db.dbAddOffer(newOffer)
}

export const findLocalDemands = async (providerId: string): Promise<Demand[]> => {
  const provider = db.dbGetUsers().find((u) => u._id === providerId)
  if (!provider) {
    throw new Error("Provider not found")
  }

  // Use the provider's primary location for searching local demands
  const serviceAreaLocation = provider.location

  const allDemands = db.dbGetDemands()
  const allUsers = db.dbGetUsers()

  const approvedFarmerIds = new Set(
    allUsers
      .filter((u) => u.role === UserRole.Farmer && u.approvalStatus === ApprovalStatus.Approved)
      .map((u) => u._id),
  )

  const localDemands = allDemands.filter((demand) => {
    if (!approvedFarmerIds.has(demand.farmerId)) {
      return false
    }
    // Only show approved (open) demands
    if (demand.status !== DemandStatus.Open) {
      return false
    }
    const distance = getDistanceInKm(demand.jobLocation, serviceAreaLocation)
    return distance <= GEO_SEARCH_RADIUS_KM
  })

  return localDemands
}
