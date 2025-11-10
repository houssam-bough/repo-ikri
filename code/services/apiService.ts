import { type User, type Offer, type Demand, type Reservation, type Message, type Conversation, UserRole, ApprovalStatus, type TimeSlot, DemandStatus, OfferStatus, ReservationStatus, type GeoJSONPoint } from "../types";
import { localDb, type VIPUpgradeRequest as VIPUpgradeRequestType } from "./localDb";

export type VIPUpgradeRequest = VIPUpgradeRequestType;
import { getDistanceInKm } from "./geoService";
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

export const getAllUsers = async (): Promise<User[]> => {
  const result = await localDb.getUsers();
  if (!result.success || !result.data) return [];
  return result.data;
};

export const searchUsersByName = async (searchQuery: string): Promise<User[]> => {
  const result = await localDb.getUsers();
  if (!result.success || !result.data) return [];
  
  const query = searchQuery.toLowerCase().trim();
  if (!query) return [];
  
  return result.data.filter(user => 
    user.approvalStatus === ApprovalStatus.Approved && 
    user.name.toLowerCase().includes(query)
  );
};

export const getPendingUsers = async (): Promise<User[]> => {
  const result = await localDb.getUsers();
  if (!result.success || !result.data) return [];
  return result.data.filter(u => u.approvalStatus === ApprovalStatus.Pending);
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  const result = await localDb.deleteUser(userId);
  return result.success;
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
    status: DemandStatus.Open,
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
    status: OfferStatus.Approved,
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

// --- Admin delete actions ---
export const deleteDemand = async (demandId: string): Promise<boolean> => {
  const result = await localDb.deleteDemand(demandId);
  return result.success;
};

export const deleteOffer = async (offerId: string): Promise<boolean> => {
  const result = await localDb.deleteOffer(offerId);
  return result.success;
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

    // Check time availability
    const hasOverlap = offer.availability.some(availSlot =>
      timeSlotsOverlap(demand.requiredTimeSlot, availSlot)
    );

    return hasOverlap;
  });
};

// --- Location-based Search ---

export const findLocalDemands = async (location: GeoJSONPoint): Promise<Demand[]> => {
  const result = await localDb.getDemands();
  if (!result.success || !result.data) return [];

  return result.data.filter(demand => {
    return demand.status === DemandStatus.Open;
  });
};

export const findLocalOffers = async (location: GeoJSONPoint): Promise<Offer[]> => {
  const result = await localDb.getOffers();
  if (!result.success || !result.data) return [];

  return result.data.filter(offer => {
    return offer.status === OfferStatus.Approved;
  });
};

// Time slot helper
const timeSlotsOverlap = (slotA: TimeSlot, slotB: TimeSlot): boolean => {
  return slotA.start <= slotB.end && slotB.start <= slotA.end;
};

// --- VIP Upgrade Requests ---

export const requestVIPUpgrade = async (userId: string): Promise<VIPUpgradeRequest | undefined> => {
  const userResult = await localDb.getUserById(userId);
  if (!userResult.success || !userResult.data) return undefined;
  
  const user = userResult.data;
  
  // Only Farmers and Providers can request VIP upgrade
  if (user.role !== UserRole.Farmer && user.role !== UserRole.Provider) {
    return undefined;
  }

  const newRequest: VIPUpgradeRequest = {
    _id: generateId(),
    userId: user._id,
    userName: user.name,
    userEmail: user.email,
    currentRole: user.role,
    requestDate: new Date(),
    status: 'pending'
  };

  const result = await localDb.addVIPRequest(newRequest);
  if (!result.success) return undefined;

  return newRequest;
};

export const getPendingVIPRequests = async (): Promise<VIPUpgradeRequest[]> => {
  const result = await localDb.getVIPRequests();
  if (!result.success || !result.data) return [];
  return result.data.filter(r => r.status === 'pending');
};

export const approveVIPUpgrade = async (requestId: string): Promise<boolean> => {
  const requestResult = await localDb.getVIPRequestById(requestId);
  if (!requestResult.success || !requestResult.data) return false;
  
  const request = requestResult.data;
  
  // Update user role to VIP
  const userResult = await localDb.getUserById(request.userId);
  if (!userResult.success || !userResult.data) return false;
  
  const updatedUser = {
    ...userResult.data,
    role: UserRole.VIP
  };
  
  const updateUserResult = await localDb.updateUser(updatedUser);
  if (!updateUserResult.success) return false;
  
  // Update request status
  const updatedRequest = {
    ...request,
    status: 'approved' as const
  };
  
  const updateRequestResult = await localDb.updateVIPRequest(updatedRequest);
  return updateRequestResult.success;
};

export const rejectVIPUpgrade = async (requestId: string): Promise<boolean> => {
  const requestResult = await localDb.getVIPRequestById(requestId);
  if (!requestResult.success || !requestResult.data) return false;
  
  const request = requestResult.data;
  const updatedRequest = {
    ...request,
    status: 'rejected' as const
  };
  
  const updateResult = await localDb.updateVIPRequest(updatedRequest);
  return updateResult.success;
};

export const getUserVIPRequest = async (userId: string): Promise<VIPUpgradeRequest | undefined> => {
  const result = await localDb.getVIPRequests();
  if (!result.success || !result.data) return undefined;
  return result.data.find(r => r.userId === userId && r.status === 'pending');
};

export const upgradeUserToVIP = async (userId: string): Promise<User | undefined> => {
  const userResult = await localDb.getUserById(userId);
  if (!userResult.success || !userResult.data) return undefined;
  
  const user = userResult.data;
  
  // Only Farmers and Providers can be upgraded to VIP
  if (user.role !== UserRole.Farmer && user.role !== UserRole.Provider) {
    return undefined;
  }
  
  const updatedUser = {
    ...user,
    role: UserRole.VIP
  };
  
  const updateResult = await localDb.updateUser(updatedUser);
  if (!updateResult.success) return undefined;
  
  return updatedUser;
};

// --- Reservations ---

export const createReservation = async (
  farmerId: string,
  farmerName: string,
  farmerPhone: string | undefined,
  offer: Offer,
  reservedTimeSlot: TimeSlot
): Promise<Reservation | undefined> => {
  // Calculate total cost based on time duration
  const durationHours = (new Date(reservedTimeSlot.end).getTime() - new Date(reservedTimeSlot.start).getTime()) / (1000 * 60 * 60);
  const totalCost = durationHours * offer.priceRate;

  const newReservation: Reservation = {
    _id: generateId(),
    farmerId,
    farmerName,
    farmerPhone,
    offerId: offer._id,
    providerId: offer.providerId,
    providerName: offer.providerName,
    equipmentType: offer.equipmentType,
    reservedTimeSlot,
    priceRate: offer.priceRate,
    totalCost,
    status: ReservationStatus.Pending,
    createdAt: new Date(),
  };

  const result = await localDb.addReservation(newReservation);
  if (!result.success) return undefined;

  return newReservation;
};

export const getReservationsForFarmer = async (farmerId: string): Promise<Reservation[]> => {
  const result = await localDb.getReservations();
  if (!result.success || !result.data) return [];
  return result.data.filter(r => r.farmerId === farmerId);
};

export const getReservationsForProvider = async (providerId: string): Promise<Reservation[]> => {
  const result = await localDb.getReservations();
  if (!result.success || !result.data) return [];
  return result.data.filter(r => r.providerId === providerId);
};

// Get all reservations (any status) for a specific offer
export const getReservationsForOffer = async (offerId: string): Promise<Reservation[]> => {
  const result = await localDb.getReservations();
  if (!result.success || !result.data) return [];
  return result.data.filter(r => r.offerId === offerId);
};

// Convenience: get approved reservations for an offer (used for public availability view)
export const getApprovedReservationsForOffer = async (offerId: string): Promise<Reservation[]> => {
  const reservations = await getReservationsForOffer(offerId);
  return reservations.filter(r => r.status === ReservationStatus.Approved);
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
  const result = await localDb.getReservations();
  if (!result.success || !result.data) return [];
  return result.data.filter(r => r.providerId === providerId && r.status === ReservationStatus.Pending);
};

export const approveReservation = async (reservationId: string): Promise<Reservation | undefined> => {
  const reservationResult = await localDb.getReservationById(reservationId);
  if (!reservationResult.success || !reservationResult.data) return undefined;
  
  const updatedReservation = {
    ...reservationResult.data,
    status: ReservationStatus.Approved,
    approvedAt: new Date(),
  };
  
  const updateResult = await localDb.updateReservation(updatedReservation);
  if (!updateResult.success) return undefined;
  
  return updatedReservation;
};

export const rejectReservation = async (reservationId: string): Promise<Reservation | undefined> => {
  const reservationResult = await localDb.getReservationById(reservationId);
  if (!reservationResult.success || !reservationResult.data) return undefined;
  
  const updatedReservation = {
    ...reservationResult.data,
    status: ReservationStatus.Rejected,
  };
  
  const updateResult = await localDb.updateReservation(updatedReservation);
  if (!updateResult.success) return undefined;
  
  return updatedReservation;
};

export const cancelReservation = async (reservationId: string): Promise<Reservation | undefined> => {
  const reservationResult = await localDb.getReservationById(reservationId);
  if (!reservationResult.success || !reservationResult.data) return undefined;
  
  const updatedReservation = {
    ...reservationResult.data,
    status: ReservationStatus.Cancelled,
  };
  
  const updateResult = await localDb.updateReservation(updatedReservation);
  if (!updateResult.success) return undefined;
  
  return updatedReservation;
};

// Check if an offer has available slots for the requested time period
export const checkOfferAvailability = async (offerId: string, requestedTimeSlot: TimeSlot): Promise<boolean> => {
  const result = await localDb.getReservations();
  if (!result.success || !result.data) return true; // If can't get reservations, allow booking
  
  const approvedReservations = result.data.filter(
    r => r.offerId === offerId && r.status === ReservationStatus.Approved
  );
  
  
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
};

// ===================== Messaging =====================

export const sendMessage = async (
  senderId: string,
  senderName: string,
  receiverId: string,
  receiverName: string,
  content: string,
  relatedOfferId?: string,
  relatedDemandId?: string
): Promise<Message | null> => {
  try {
    const message: Message = {
      _id: generateId(),
      senderId,
      senderName,
      receiverId,
      receiverName,
      content,
      relatedOfferId,
      relatedDemandId,
      createdAt: new Date(),
      read: false,
    };

    const result = await localDb.addMessage(message);
    return result.success ? message : null;
  } catch (error) {
    console.error("Error sending message:", error);
    return null;
  }
};

export const getMessagesForUser = async (userId: string): Promise<Message[]> => {
  try {
    const result = await localDb.getMessages();
    if (!result.success || !result.data) return [];
    
    // Get all messages where user is sender or receiver
    return result.data.filter(
      (msg) => msg.senderId === userId || msg.receiverId === userId
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
    const result = await localDb.getMessages();
    if (!result.success || !result.data) return [];
    
    // Get messages between these two users
    return result.data
      .filter(
        (msg) =>
          (msg.senderId === userId1 && msg.receiverId === userId2) ||
          (msg.senderId === userId2 && msg.receiverId === userId1)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } catch (error) {
    console.error("Error getting conversation:", error);
    return [];
  }
};

export const getConversationsForUser = async (userId: string): Promise<Conversation[]> => {
  try {
    const messages = await getMessagesForUser(userId);
    
    // Group messages by conversation partner
    const conversationMap = new Map<string, { otherUser: { id: string; name: string }; messages: Message[] }>();
    
    messages.forEach((msg) => {
      const isReceiver = msg.receiverId === userId;
      const otherUserId = isReceiver ? msg.senderId : msg.receiverId;
      const otherUserName = isReceiver ? msg.senderName : msg.receiverName;
      
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          otherUser: { id: otherUserId, name: otherUserName },
          messages: [],
        });
      }
      
      conversationMap.get(otherUserId)!.messages.push(msg);
    });
    
    // Convert to Conversation array
    const conversations: Conversation[] = [];
    conversationMap.forEach((data, otherUserId) => {
      const sortedMessages = data.messages.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const lastMessage = sortedMessages[0];
      const unreadCount = sortedMessages.filter(
        (msg) => msg.receiverId === userId && !msg.read
      ).length;
      
      conversations.push({
        otherUserId,
        otherUserName: data.otherUser.name,
        lastMessage: lastMessage.content,
        lastMessageDate: lastMessage.createdAt,
        unreadCount,
      });
    });
    
    // Sort by last message date
    return conversations.sort(
      (a, b) => new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime()
    );
  } catch (error) {
    console.error("Error getting conversations:", error);
    return [];
  }
};

export const markMessageAsRead = async (messageId: string): Promise<boolean> => {
  try {
    const result = await localDb.getMessageById(messageId);
    if (!result.success || !result.data) return false;
    
    const message = result.data;
    message.read = true;
    
    const updateResult = await localDb.updateMessage(message);
    return updateResult.success;
  } catch (error) {
    console.error("Error marking message as read:", error);
    return false;
  }
};

export const markConversationAsRead = async (userId: string, otherUserId: string): Promise<boolean> => {
  try {
    const messages = await getConversationBetweenUsers(userId, otherUserId);
    const unreadMessages = messages.filter((msg) => msg.receiverId === userId && !msg.read);
    
    for (const msg of unreadMessages) {
      await markMessageAsRead(msg._id);
    }
    
    return true;
  } catch (error) {
    console.error("Error marking conversation as read:", error);
    return false;
  }
};


