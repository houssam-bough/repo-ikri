import { type User, type Offer, type Demand, type DemandWithFarmer, type Reservation, type Message, type Conversation, UserRole, ApprovalStatus, type TimeSlot, DemandStatus, OfferStatus, ReservationStatus, type GeoJSONPoint } from "../types";

// VIP upgrade request types removed (single unified User role)
import { getDistanceInKm } from "./geoService";

// --- Account Management ---

export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const registerUser = async (userData: Omit<User, "_id" | "approvalStatus">): Promise<User | undefined> => {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Registration error:', error.error);
      return undefined;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Registration error:', error);
    return undefined;
  }
};

export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.user || null;
  } catch (error) {
    console.error('Get user by ID error:', error);
    return null;
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const response = await fetch('/api/users');
    if (!response.ok) return [];
    const data = await response.json();
    return data.users || [];
  } catch (error) {
    console.error('Get all users error:', error);
    return [];
  }
};

export const searchUsersByName = async (searchQuery: string): Promise<User[]> => {
  try {
    if (!searchQuery.trim()) return [];
    const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.users || [];
  } catch (error) {
    console.error('Search users error:', error);
    return [];
  }
};

export const getPendingUsers = async (): Promise<User[]> => {
  try {
    const response = await fetch('/api/users?approvalStatus=pending');
    if (!response.ok) return [];
    const data = await response.json();
    return data.users || [];
  } catch (error) {
    console.error('Get pending users error:', error);
    return [];
  }
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
    return response.ok;
  } catch (error) {
    console.error('Delete user error:', error);
    return false;
  }
};

export const approveUser = async (userId: string): Promise<User | undefined> => {
  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvalStatus: 'approved' })
    });
    if (!response.ok) return undefined;
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Approve user error:', error);
    return undefined;
  }
};

export const rejectUser = async (userId: string): Promise<User | undefined> => {
  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvalStatus: 'denied' })
    });
    if (!response.ok) return undefined;
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Reject user error:', error);
    return undefined;
  }
};

export const updateUserProfile = async (
  userId: string,
  profileData: Partial<Omit<User, "_id" | "email" | "role" | "approvalStatus" | "password">>,
): Promise<User | undefined> => {
  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });
    if (!response.ok) return undefined;
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Update user profile error:', error);
    return undefined;
  }
};

// --- Admin Demand Management ---

export const getPendingDemands = async (): Promise<Demand[]> => {
  try {
    const response = await fetch('/api/demands?status=pending');
    if (!response.ok) return [];
    const data = await response.json();
    return data.demands || [];
  } catch (error) {
    console.error('Get pending demands error:', error);
    return [];
  }
};

export const approveDemand = async (demandId: string): Promise<Demand | undefined> => {
  try {
    const response = await fetch(`/api/demands/${demandId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'open' })
    });
    if (!response.ok) return undefined;
    const data = await response.json();
    return data.demand;
  } catch (error) {
    console.error('Approve demand error:', error);
    return undefined;
  }
};

export const rejectDemand = async (demandId: string): Promise<Demand | undefined> => {
  try {
    const response = await fetch(`/api/demands/${demandId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected' })
    });
    if (!response.ok) return undefined;
    const data = await response.json();
    return data.demand;
  } catch (error) {
    console.error('Reject demand error:', error);
    return undefined;
  }
};

// --- Admin Offer Management ---

export const getPendingOffers = async (): Promise<Offer[]> => {
  try {
    const response = await fetch('/api/offers?status=pending');
    if (!response.ok) return [];
    const data = await response.json();
    return data.offers || [];
  } catch (error) {
    console.error('Get pending offers error:', error);
    return [];
  }
};

export const approveOffer = async (offerId: string): Promise<Offer | undefined> => {
  try {
    const response = await fetch(`/api/offers/${offerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' })
    });
    if (!response.ok) return undefined;
    const data = await response.json();
    return data.offer;
  } catch (error) {
    console.error('Approve offer error:', error);
    return undefined;
  }
};

export const rejectOffer = async (offerId: string): Promise<Offer | undefined> => {
  try {
    const response = await fetch(`/api/offers/${offerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected' })
    });
    if (!response.ok) return undefined;
    const data = await response.json();
    return data.offer;
  } catch (error) {
    console.error('Reject offer error:', error);
    return undefined;
  }
};

// --- Farmer Demand Management ---

export const getDemandsForFarmer = async (farmerId: string): Promise<Demand[]> => {
  try {
    const response = await fetch(`/api/demands?farmerId=${farmerId}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.demands || [];
  } catch (error) {
    console.error('Get demands for farmer error:', error);
    return [];
  }
};

export const getDemandById = async (demandId: string): Promise<DemandWithFarmer | undefined> => {
  try {
    const response = await fetch(`/api/demands/${demandId}`);
    if (!response.ok) return undefined;
    const data = await response.json();
    return data.demand;
  } catch (error) {
    console.error('Get demand by ID error:', error);
    return undefined;
  }
};

export const postDemand = async (
  farmerId: string,
  farmerName: string,
  requiredService: string,
  requiredTimeSlot: TimeSlot,
  jobLocation: GeoJSONPoint,
  description?: string,
  photoUrl?: string,
): Promise<Demand | undefined> => {
  try {
    const response = await fetch('/api/demands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farmerId,
        farmerName,
        requiredService,
        requiredTimeSlot,
        jobLocation,
        description,
        photoUrl
      })
    });
    if (!response.ok) return undefined;
    const data = await response.json();
    return data.demand;
  } catch (error) {
    console.error('Post demand error:', error);
    return undefined;
  }
};

// --- Provider Offer Management ---

export const getOffersForProvider = async (providerId: string): Promise<Offer[]> => {
  try {
    const response = await fetch(`/api/offers?providerId=${providerId}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.offers || [];
  } catch (error) {
    console.error('Get offers for provider error:', error);
    return [];
  }
};

export const postOffer = async (
  providerId: string,
  providerName: string,
  equipmentType: string,
  description: string,
  availability: TimeSlot[],
  serviceAreaLocation: GeoJSONPoint,
  priceRate: number,
  photoUrl?: string,
): Promise<Offer | undefined> => {
  try {
    const response = await fetch('/api/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId,
        providerName,
        equipmentType,
        description,
        availability,
        serviceAreaLocation,
        priceRate,
        photoUrl
      })
    });
    if (!response.ok) return undefined;
    const data = await response.json();
    return data.offer;
  } catch (error) {
    console.error('Post offer error:', error);
    return undefined;
  }
};

// --- Feed & Matching ---

export const getAllDemands = async (): Promise<Demand[]> => {
  try {
    const response = await fetch('/api/demands');
    if (!response.ok) return [];
    const data = await response.json();
    return data.demands || [];
  } catch (error) {
    console.error('Get all demands error:', error);
    return [];
  }
};

export const getAllOffers = async (): Promise<Offer[]> => {
  try {
    const response = await fetch('/api/offers');
    if (!response.ok) return [];
    const data = await response.json();
    return data.offers || [];
  } catch (error) {
    console.error('Get all offers error:', error);
    return [];
  }
};

// --- Admin delete actions ---
export const deleteDemand = async (demandId: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/demands/${demandId}`, { method: 'DELETE' });
    return response.ok;
  } catch (error) {
    console.error('Delete demand error:', error);
    return false;
  }
};

export const deleteOffer = async (offerId: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/offers/${offerId}`, { method: 'DELETE' });
    return response.ok;
  } catch (error) {
    console.error('Delete offer error:', error);
    return false;
  }
};

export const findMatchesForDemand = async (demandId: string): Promise<Offer[]> => {
  try {
    // Get demand
    const demandResponse = await fetch(`/api/demands/${demandId}`);
    if (!demandResponse.ok) return [];
    const demandData = await demandResponse.json();
    const demand = demandData.demand;

    // Get approved offers
    const offersResponse = await fetch('/api/offers?status=approved');
    if (!offersResponse.ok) return [];
    const offersData = await offersResponse.json();
    const allOffers = offersData.offers || [];

    // Filter by time overlap
    return allOffers.filter((offer: any) => {
      const hasOverlap = offer.availability.some((availSlot: TimeSlot) =>
        timeSlotsOverlap(demand.requiredTimeSlot, availSlot)
      );
      return hasOverlap;
    });
  } catch (error) {
    console.error('Find matches for demand error:', error);
    return [];
  }
};

// --- Location-based Search ---

export const findLocalDemands = async (location: GeoJSONPoint): Promise<Demand[]> => {
  try {
    const response = await fetch('/api/demands?status=open');
    if (!response.ok) return [];
    const data = await response.json();
    return data.demands || [];
  } catch (error) {
    console.error('Find local demands error:', error);
    return [];
  }
};

export const findLocalOffers = async (location: GeoJSONPoint): Promise<Offer[]> => {
  try {
    const response = await fetch('/api/offers?status=approved');
    if (!response.ok) return [];
    const data = await response.json();
    return data.offers || [];
  } catch (error) {
    console.error('Find local offers error:', error);
    return [];
  }
};

// Time slot helper
const timeSlotsOverlap = (slotA: TimeSlot, slotB: TimeSlot): boolean => {
  return slotA.start <= slotB.end && slotB.start <= slotA.end;
};

// --- VIP Upgrade Requests ---



// VIP upgrade functions removed.





// approveVIPUpgrade / rejectVIPUpgrade / getUserVIPRequest / upgradeUserToVIP removed.

// --- Reservations ---

export const createReservation = async (
  farmerId: string,
  farmerName: string,
  farmerPhone: string | undefined,
  offer: Offer,
  reservedTimeSlot: TimeSlot
): Promise<Reservation | undefined> => {
  try {
    // Calculate total cost based on time duration
    const durationHours = (new Date(reservedTimeSlot.end).getTime() - new Date(reservedTimeSlot.start).getTime()) / (1000 * 60 * 60);
    const totalCost = durationHours * offer.priceRate;

    const response = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farmerId,
        farmerName,
        farmerPhone,
        offerId: offer._id,
        providerId: offer.providerId,
        providerName: offer.providerName,
        equipmentType: offer.equipmentType,
        reservedTimeSlot,
        priceRate: offer.priceRate,
        totalCost
      })
    });

    if (!response.ok) return undefined;
    const data = await response.json();
    return data.reservation;
  } catch (error) {
    console.error('Create reservation error:', error);
    return undefined;
  }
};

export const getReservationsForFarmer = async (farmerId: string): Promise<Reservation[]> => {
  try {
    const response = await fetch(`/api/reservations?farmerId=${farmerId}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.reservations || [];
  } catch (error) {
    console.error('Get reservations for farmer error:', error);
    return [];
  }
};

export const getReservationsForProvider = async (providerId: string): Promise<Reservation[]> => {
  try {
    const response = await fetch(`/api/reservations?providerId=${providerId}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.reservations || [];
  } catch (error) {
    console.error('Get reservations for provider error:', error);
    return [];
  }
};

// Get all reservations (any status) for a specific offer
export const getReservationsForOffer = async (offerId: string): Promise<Reservation[]> => {
  try {
    const response = await fetch(`/api/reservations?offerId=${offerId}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.reservations || [];
  } catch (error) {
    console.error('Get reservations for offer error:', error);
    return [];
  }
};

// Convenience: get approved reservations for an offer (used for public availability view)
export const getApprovedReservationsForOffer = async (offerId: string): Promise<Reservation[]> => {
  try {
    const response = await fetch(`/api/reservations?offerId=${offerId}&status=approved`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.reservations || [];
  } catch (error) {
    console.error('Get approved reservations for offer error:', error);
    return [];
  }
};

// Group reservations by date (YYYY-MM-DD) for calendar display
export const groupReservationsByDate = (reservations: Reservation[]): Record<string, Reservation[]> => {
  return reservations.reduce((acc, reservation) => {
    const dateKey = new Date(reservation.reservedTimeSlot.start).toISOString().split('T')[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(reservation);
    return acc;
  }, {} as Record<string, Reservation[]>);
};

export const getPendingReservationsForProvider = async (providerId: string): Promise<Reservation[]> => {
  try {
    const response = await fetch(`/api/reservations?providerId=${providerId}&status=pending`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.reservations || [];
  } catch (error) {
    console.error('Get pending reservations for provider error:', error);
    return [];
  }
};

export const approveReservation = async (reservationId: string): Promise<Reservation | undefined> => {
  try {
    const response = await fetch(`/api/reservations/${reservationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' })
    });
    if (!response.ok) return undefined;
    const data = await response.json();
    return data.reservation;
  } catch (error) {
    console.error('Approve reservation error:', error);
    return undefined;
  }
};

export const rejectReservation = async (reservationId: string): Promise<Reservation | undefined> => {
  try {
    const response = await fetch(`/api/reservations/${reservationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected' })
    });
    if (!response.ok) return undefined;
    const data = await response.json();
    return data.reservation;
  } catch (error) {
    console.error('Reject reservation error:', error);
    return undefined;
  }
};

export const cancelReservation = async (reservationId: string): Promise<Reservation | undefined> => {
  try {
    const response = await fetch(`/api/reservations/${reservationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' })
    });
    if (!response.ok) return undefined;
    const data = await response.json();
    return data.reservation;
  } catch (error) {
    console.error('Cancel reservation error:', error);
    return undefined;
  }
};

// Check if an offer has available slots for the requested time period
export const checkOfferAvailability = async (offerId: string, requestedTimeSlot: TimeSlot): Promise<boolean> => {
  try {
    const response = await fetch(`/api/reservations?offerId=${offerId}&status=approved`);
    if (!response.ok) return true; // If can't get reservations, allow booking
    
    const data = await response.json();
    const approvedReservations = data.reservations || [];
    
    // Check if requested time overlaps with any approved reservation
    const requestedStart = new Date(requestedTimeSlot.start).getTime();
    const requestedEnd = new Date(requestedTimeSlot.end).getTime();
    
    for (const reservation of approvedReservations) {
      const reservedStart = new Date(reservation.reservedTimeSlot.start).getTime();
      const reservedEnd = new Date(reservation.reservedTimeSlot.end).getTime();
      
      // Check for overlap
      if (
        (requestedStart >= reservedStart && requestedStart < reservedEnd) ||
        (requestedEnd > reservedStart && requestedEnd <= reservedEnd) ||
        (requestedStart <= reservedStart && requestedEnd >= reservedEnd)
      ) {
        return false; // Overlap found, not available
      }
    }
    
    return true; // No overlap, available
  } catch (error) {
    console.error('Check offer availability error:', error);
    return true;
  }
};

// ===================== Messaging =====================

export const sendMessage = async (
  senderId: string,
  senderName: string,
  receiverId: string,
  receiverName: string,
  content: string,
  relatedOfferId?: string,
  relatedDemandId?: string,
  fileUrl?: string,
  fileType?: string,
  fileName?: string,
  audioUrl?: string,
  audioDuration?: number
): Promise<Message | null> => {
  try {
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId,
        senderName,
        receiverId,
        receiverName,
        content,
        relatedOfferId,
        relatedDemandId,
        fileUrl,
        fileType,
        fileName,
        audioUrl,
        audioDuration
      })
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error("Error sending message:", error);
    return null;
  }
};

export const getMessagesForUser = async (userId: string): Promise<Message[]> => {
  try {
    // Note: This endpoint would need to be added to the API if needed
    // For now, return empty array - typically we use getConversationsForUser instead
    return [];
  } catch (error) {
    console.error("Error getting messages:", error);
    return [];
  }
};

export const getConversationBetweenUsers = async (
  userId1: string,
  userId2: string
): Promise<Message[]> => {
  try {
    const response = await fetch(`/api/messages?userId=${userId1}&otherUserId=${userId2}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.messages || [];
  } catch (error) {
    console.error("Error getting conversation:", error);
    return [];
  }
};

export const getConversationsForUser = async (userId: string): Promise<Conversation[]> => {
  try {
    const response = await fetch(`/api/messages/conversations?userId=${userId}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.conversations || [];
  } catch (error) {
    console.error("Error getting conversations:", error);
    return [];
  }
};

export const markMessageAsRead = async (messageId: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/messages/${messageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read: true })
    });
    return response.ok;
  } catch (error) {
    console.error("Error marking message as read:", error);
    return false;
  }
};

export const markConversationAsRead = async (userId: string, otherUserId: string): Promise<boolean> => {
  try {
    const messages = await getConversationBetweenUsers(userId, otherUserId);
    const unreadMessages = messages.filter((msg: any) => msg.receiverId === userId && !msg.read);
    
    for (const msg of unreadMessages) {
      await markMessageAsRead(msg._id);
    }
    
    return true;
  } catch (error) {
    console.error("Error marking conversation as read:", error);
    return false;
  }
};


