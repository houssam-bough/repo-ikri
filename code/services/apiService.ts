import { type User, type Offer, type Demand, UserRole, ApprovalStatus, type TimeSlot, DemandStatus, OfferStatus, type GeoJSONPoint } from "../types";
import { localDb } from "./localDb";
import { getDistanceInKm } from "./geoService";
import { GEO_SEARCH_RADIUS_KM } from "../constants";
import { v4 as uuidv4 } from "uuid";

// Helper functions
const generateId = () => uuidv4();

// ... Rest of your TypeScript content here ...

// --- Account Management ---

export const loginUser = async (email: string, password: string): Promise<User> => {
  // Ensure database is initialized
  try {
    await localDb.init();
    const result = await localDb.getUserByEmail(email);
    console.log('apiService.loginUser: lookup result for', email, result);
    if (!result.success || !result.data) {
      throw new Error('User not found');
    }
    
    if (result.data.password === password) {
      return result.data;
    }
    throw new Error('Invalid password');
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const registerUser = async (userData: Omit<User, "_id" | "approvalStatus">): Promise<User | undefined> => {
  const newUser: User = {
    _id: generateId(),
    ...userData,
    approvalStatus: userData.role === UserRole.Admin ? ApprovalStatus.Approved : ApprovalStatus.Pending,
  };

  const result = await localDb.addUser(newUser);
  if (!result.success) return undefined;

  return newUser;
};

export const getPendingUsers = async (): Promise<User[]> => {
  const result = await localDb.getUsers();
  if (!result.success || !result.data) return [];
  return result.data.filter(u => u.approvalStatus === ApprovalStatus.Pending);
};

export const approveUser = async (userId: string): Promise<User | undefined> => {
  const userResult = await localDb.getUserById(userId);
  if (!userResult.success || !userResult.data) return undefined;
  
  const updatedUser = {
    ...userResult.data,
    approvalStatus: ApprovalStatus.Approved
  };
  
  const updateResult = await localDb.updateUser(updatedUser);
  if (!updateResult.success) return undefined;
  
  return updatedUser;
};

export const rejectUser = async (userId: string): Promise<User | undefined> => {
  const userResult = await localDb.getUserById(userId);
  if (!userResult.success || !userResult.data) return undefined;
  
  const updatedUser = {
    ...userResult.data,
    approvalStatus: ApprovalStatus.Denied
  };
  
  const updateResult = await localDb.updateUser(updatedUser);
  if (!updateResult.success) return undefined;
  
  return updatedUser;
};

export const updateUserProfile = async (
  userId: string,
  profileData: Partial<Omit<User, "_id" | "email" | "role" | "approvalStatus" | "password">>,
): Promise<User | undefined> => {
  const userResult = await localDb.getUserById(userId);
  if (!userResult.success || !userResult.data) return undefined;

  const updatedUser = {
    ...userResult.data,
    ...profileData,
  };

  const updateResult = await localDb.updateUser(updatedUser);
  if (!updateResult.success) return undefined;

  return updatedUser;
};

// --- Admin Demand Management ---

export const getPendingDemands = async (): Promise<Demand[]> => {
  const result = await localDb.getDemands();
  if (!result.success || !result.data) return [];
  return result.data.filter(d => d.status === DemandStatus.Pending);
};

export const approveDemand = async (demandId: string): Promise<Demand | undefined> => {
  const demandResult = await localDb.getDemandById(demandId);
  if (!demandResult.success || !demandResult.data) return undefined;

  const updatedDemand = {
    ...demandResult.data,
    status: DemandStatus.Open
  };

  const updateResult = await localDb.updateDemand(updatedDemand);
  if (!updateResult.success) return undefined;

  return updatedDemand;
};

export const rejectDemand = async (demandId: string): Promise<Demand | undefined> => {
  const demandResult = await localDb.getDemandById(demandId);
  if (!demandResult.success || !demandResult.data) return undefined;

  const updatedDemand = {
    ...demandResult.data,
    status: DemandStatus.Rejected
  };

  const updateResult = await localDb.updateDemand(updatedDemand);
  if (!updateResult.success) return undefined;

  return updatedDemand;
};

// --- Admin Offer Management ---

export const getPendingOffers = async (): Promise<Offer[]> => {
  const result = await localDb.getOffers();
  if (!result.success || !result.data) return [];
  return result.data.filter(o => o.status === OfferStatus.Pending);
};

export const approveOffer = async (offerId: string): Promise<Offer | undefined> => {
  const offerResult = await localDb.getOfferById(offerId);
  if (!offerResult.success || !offerResult.data) return undefined;

  const updatedOffer = {
    ...offerResult.data,
    status: OfferStatus.Approved
  };

  const updateResult = await localDb.updateOffer(updatedOffer);
  if (!updateResult.success) return undefined;

  return updatedOffer;
};

export const rejectOffer = async (offerId: string): Promise<Offer | undefined> => {
  const offerResult = await localDb.getOfferById(offerId);
  if (!offerResult.success || !offerResult.data) return undefined;

  const updatedOffer = {
    ...offerResult.data,
    status: OfferStatus.Rejected
  };

  const updateResult = await localDb.updateOffer(updatedOffer);
  if (!updateResult.success) return undefined;

  return updatedOffer;
};

// --- Farmer Demand Management ---

export const getDemandsForFarmer = async (farmerId: string): Promise<Demand[]> => {
  const result = await localDb.getDemands();
  if (!result.success || !result.data) return [];
  return result.data.filter(d => d.farmerId === farmerId);
};

export const postDemand = async (
  demandData: Omit<Demand, "_id" | "status"> & {
    farmerId: string,
    farmerName: string,
    requiredService: string,
    requiredTimeSlot: { start: Date; end: Date },
    jobLocation: { type: 'Point', coordinates: [number, number] }
  }
): Promise<Demand | undefined> => {
  const newDemand: Demand = {
    _id: generateId(),
    ...demandData,
    status: DemandStatus.Pending,
  };

  const result = await localDb.addDemand(newDemand);
  if (!result.success) return undefined;

  return newDemand;
};

// --- Provider Offer Management ---

export const getOffersForProvider = async (providerId: string): Promise<Offer[]> => {
  const result = await localDb.getOffers();
  if (!result.success || !result.data) return [];
  return result.data.filter(o => o.providerId === providerId);
};

export const postOffer = async (
  offerData: Omit<Offer, "_id" | "status"> & {
    providerId: string,
    providerName: string,
    equipmentType: string,
    description: string,
    priceRate: number,
    availability: { start: Date; end: Date }[],
    serviceAreaLocation: { type: 'Point', coordinates: [number, number] }
  }
): Promise<Offer | undefined> => {
  const newOffer: Offer = {
    _id: generateId(),
    ...offerData,
    status: OfferStatus.Pending,
  };

  const result = await localDb.addOffer(newOffer);
  if (!result.success) return undefined;

  return newOffer;
};

// --- Feed & Matching ---

export const getAllDemands = async (): Promise<Demand[]> => {
  const result = await localDb.getDemands();
  return result.success && result.data ? result.data.filter(d => d.status === DemandStatus.Open) : [];
};

export const getAllOffers = async (): Promise<Offer[]> => {
  const result = await localDb.getOffers();
  return result.success && result.data ? result.data.filter(o => o.status === OfferStatus.Approved) : [];
};

export const findMatchesForDemand = async (demandId: string): Promise<Offer[]> => {
  const demandResult = await localDb.getDemandById(demandId);
  if (!demandResult.success || !demandResult.data) return [];
  const demand = demandResult.data;

  const [offersResult, usersResult] = await Promise.all([
    localDb.getOffers(),
    localDb.getUsers()
  ]);

  if (!offersResult.success || !usersResult.success || !offersResult.data || !usersResult.data) {
    return [];
  }

  const allOffers = offersResult.data;
  const allUsers = usersResult.data;

  const approvedProviderIds = allUsers
    .filter(u => u.role === UserRole.Provider && u.approvalStatus === ApprovalStatus.Approved)
    .map(u => u._id);

  return allOffers.filter(offer => {
    if (
      !approvedProviderIds.includes(offer.providerId) ||
      offer.status !== OfferStatus.Approved
    ) {
      return false;
    }

    // Check location
    const distance = getDistanceInKm(
      demand.jobLocation,
      offer.serviceAreaLocation,
    );
    const isWithinRange = distance <= GEO_SEARCH_RADIUS_KM;

    // Check time availability
    const hasOverlap = offer.availability.some(availSlot =>
      timeSlotsOverlap(demand.requiredTimeSlot, availSlot)
    );

    return isWithinRange && hasOverlap;
  });
};

// --- Location-based Search ---

export const findLocalDemands = async (location: GeoJSONPoint): Promise<Demand[]> => {
  const result = await localDb.getDemands();
  if (!result.success || !result.data) return [];

  return result.data.filter(demand => {
    const distance = getDistanceInKm(location, demand.jobLocation);
    return distance <= GEO_SEARCH_RADIUS_KM && demand.status === DemandStatus.Open;
  });
};

export const findLocalOffers = async (location: GeoJSONPoint): Promise<Offer[]> => {
  const result = await localDb.getOffers();
  if (!result.success || !result.data) return [];

  return result.data.filter(offer => {
    const distance = getDistanceInKm(location, offer.serviceAreaLocation);
    return distance <= GEO_SEARCH_RADIUS_KM && offer.status === OfferStatus.Approved;
  });
};

// Time slot helper
const timeSlotsOverlap = (slotA: TimeSlot, slotB: TimeSlot): boolean => {
  return slotA.start <= slotB.end && slotB.start <= slotA.end;
};
