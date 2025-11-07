import { User, Offer, Demand, Reservation, Message, UserRole, ApprovalStatus, OfferStatus, DemandStatus, ReservationStatus } from '../types';

const DB_NAME = 'ikriDB';
const DB_VERSION = 4; // Incremented for messages store

export interface VIPUpgradeRequest {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  currentRole: UserRole;
  requestDate: Date;
  status: 'pending' | 'approved' | 'rejected';
}

interface IDBResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class LocalDatabase {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('Database error:', event);
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = async (event) => {
        console.log('Database opened successfully');
        this.db = (event.target as IDBOpenDBRequest).result;
        try {
          // Ensure stores are seeded if empty (handles existing DBs created before seeding logic)
          await this.seedIfEmpty();
          resolve();
        } catch (err) {
          console.error('Seeding error:', err);
          // Still resolve so app can continue, but log the problem
          resolve();
        }
      };

      request.onupgradeneeded = async (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create stores
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: '_id' });
          userStore.createIndex('email', 'email', { unique: true });
          userStore.createIndex('role', 'role', { unique: false });

          // Add mock users when the database is first created
          const mockUsers = [
            { _id: 'admin1', name: 'Admin User', email: 'admin@ikri.com', password: 'password', phone: '111-222-3333', role: UserRole.Admin, approvalStatus: ApprovalStatus.Approved, location: { type: 'Point', coordinates: [-74.0060, 40.7128] } },
            { _id: 'provider1', name: 'John Deere Services', email: 'provider1@ikri.com', password: 'password', phone: '515-123-4567', role: UserRole.Provider, approvalStatus: ApprovalStatus.Approved, location: { type: 'Point', coordinates: [-93.6210, 41.5868] } },
            { _id: 'provider2', name: 'Farmhand Inc.', email: 'provider2@ikri.com', password: 'password', phone: '515-234-5678', role: UserRole.Provider, approvalStatus: ApprovalStatus.Pending, location: { type: 'Point', coordinates: [-93.6500, 41.6000] } },
            { _id: 'farmer1', name: 'Old McDonald', email: 'farmer1@ikri.com', password: 'password', phone: '515-345-6789', role: UserRole.Farmer, approvalStatus: ApprovalStatus.Approved, location: { type: 'Point', coordinates: [-93.7124, 41.6033] } },
            { _id: 'farmer2', name: 'Green Acres Farm', email: 'farmer2@ikri.com', password: 'password', phone: '515-456-7890', role: UserRole.Farmer, approvalStatus: ApprovalStatus.Pending, location: { type: 'Point', coordinates: [-93.8000, 41.6500] } },
          ];
          
          mockUsers.forEach(user => {
            userStore.add(user);
          });
        }

        if (!db.objectStoreNames.contains('offers')) {
          const offerStore = db.createObjectStore('offers', { keyPath: '_id' });
          offerStore.createIndex('providerId', 'providerId', { unique: false });
          offerStore.createIndex('status', 'status', { unique: false });

          // Add mock offers
          const mockOffers = [
            {
              _id: 'offer1',
              providerId: 'provider1',
              providerName: 'John Deere Services',
              equipmentType: 'Combine Harvester',
              description: 'High-efficiency John Deere S780 for corn and soybean harvesting.',
              availability: [
                { start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), end: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) }
              ],
              serviceAreaLocation: { type: 'Point', coordinates: [-93.6210, 41.5868] },
              priceRate: 150,
              status: OfferStatus.Approved,
            }
          ];

          mockOffers.forEach(offer => {
            offerStore.add(offer);
          });
        }

        if (!db.objectStoreNames.contains('demands')) {
          const demandStore = db.createObjectStore('demands', { keyPath: '_id' });
          demandStore.createIndex('farmerId', 'farmerId', { unique: false });
          demandStore.createIndex('status', 'status', { unique: false });

          // Add mock demands
          const mockDemands = [
            {
              _id: 'demand1',
              farmerId: 'farmer1',
              farmerName: 'Old McDonald',
              requiredService: 'Corn Harvesting',
              requiredTimeSlot: { 
                start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 
                end: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000) 
              },
              jobLocation: { type: 'Point', coordinates: [-93.7124, 41.6033] },
              status: DemandStatus.Open,
            }
          ];

          mockDemands.forEach(demand => {
            demandStore.add(demand);
          });
        }

        if (!db.objectStoreNames.contains('vipRequests')) {
          const vipRequestStore = db.createObjectStore('vipRequests', { keyPath: '_id' });
          vipRequestStore.createIndex('userId', 'userId', { unique: false });
          vipRequestStore.createIndex('status', 'status', { unique: false });
        }

        if (!db.objectStoreNames.contains('reservations')) {
          const reservationStore = db.createObjectStore('reservations', { keyPath: '_id' });
          reservationStore.createIndex('farmerId', 'farmerId', { unique: false });
          reservationStore.createIndex('providerId', 'providerId', { unique: false });
          reservationStore.createIndex('offerId', 'offerId', { unique: false });
          reservationStore.createIndex('status', 'status', { unique: false });
        }

        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: '_id' });
          messageStore.createIndex('senderId', 'senderId', { unique: false });
          messageStore.createIndex('receiverId', 'receiverId', { unique: false });
          messageStore.createIndex('createdAt', 'createdAt', { unique: false });
          messageStore.createIndex('read', 'read', { unique: false });
        }
      };
    });
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // Users
  async getUsers(): Promise<IDBResult<User[]>> {
    try {
      const store = await this.getStore('users');
      return new Promise((resolve) => {
        const request = store.getAll();
        request.onsuccess = () => resolve({ success: true, data: request.result });
        request.onerror = () => resolve({ success: false, error: 'Failed to get users' });
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // If stores exist but are empty (older DB), seed with initial mock data
  private async seedIfEmpty(): Promise<void> {
    if (!this.db) return;
    try {
      // Check users count
      const usersStore = await this.getStore('users');
      const countPromise = new Promise<number>((resolve) => {
        const req = usersStore.count();
        req.onsuccess = () => resolve(req.result as number);
        req.onerror = () => resolve(0);
      });
      const userCount = await countPromise;
      if (userCount === 0) {
        console.log('localDb: users store empty — seeding initial data');
        const userStore = await this.getStore('users', 'readwrite');
        const offerStore = await this.getStore('offers', 'readwrite');
        const demandStore = await this.getStore('demands', 'readwrite');

        // Mock data (kept small)
        const mockUsers: User[] = [
          { _id: 'admin1', name: 'Admin User', email: 'admin@ikri.com', password: 'password', phone: '111-222-3333', role: UserRole.Admin, approvalStatus: ApprovalStatus.Approved, location: { type: 'Point', coordinates: [-74.0060, 40.7128] } },
          { _id: 'provider1', name: 'John Deere Services', email: 'provider1@ikri.com', password: 'password', phone: '515-123-4567', role: UserRole.Provider, approvalStatus: ApprovalStatus.Approved, location: { type: 'Point', coordinates: [-93.6210, 41.5868] } },
          { _id: 'provider2', name: 'Farmhand Inc.', email: 'provider2@ikri.com', password: 'password', phone: '515-234-5678', role: UserRole.Provider, approvalStatus: ApprovalStatus.Pending, location: { type: 'Point', coordinates: [-93.6500, 41.6000] } },
          { _id: 'farmer1', name: 'Old McDonald', email: 'farmer1@ikri.com', password: 'password', phone: '515-345-6789', role: UserRole.Farmer, approvalStatus: ApprovalStatus.Approved, location: { type: 'Point', coordinates: [-93.7124, 41.6033] } },
          { _id: 'farmer2', name: 'Green Acres Farm', email: 'farmer2@ikri.com', password: 'password', phone: '515-456-7890', role: UserRole.Farmer, approvalStatus: ApprovalStatus.Pending, location: { type: 'Point', coordinates: [-93.8000, 41.6500] } },
        ];

        const mockOffers = [
          {
            _id: 'offer1',
            providerId: 'provider1',
            providerName: 'John Deere Services',
            equipmentType: 'Combine Harvester',
            description: 'High-efficiency John Deere S780 for corn and soybean harvesting.',
            availability: [ { start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), end: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) } ],
            serviceAreaLocation: { type: 'Point', coordinates: [-93.6210, 41.5868] },
            priceRate: 150,
            status: OfferStatus.Approved,
          }
        ];

        const mockDemands = [
          {
            _id: 'demand1',
            farmerId: 'farmer1',
            farmerName: 'Old McDonald',
            requiredService: 'Corn Harvesting',
            requiredTimeSlot: { start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), end: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000) },
            jobLocation: { type: 'Point', coordinates: [-93.7124, 41.6033] },
            status: DemandStatus.Open,
          }
        ];

        mockUsers.forEach(u => userStore.add(u));
        mockOffers.forEach(o => offerStore.add(o));
        mockDemands.forEach(d => demandStore.add(d));
        console.log('localDb: seeding complete');
      }
    } catch (error) {
      console.error('seedIfEmpty error:', error);
      throw error;
    }
  }

  async getUserById(id: string): Promise<IDBResult<User>> {
    try {
      const store = await this.getStore('users');
      return new Promise((resolve) => {
        const request = store.get(id);
        request.onsuccess = () => resolve({ success: true, data: request.result });
        request.onerror = () => resolve({ success: false, error: 'User not found' });
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async getUserByEmail(email: string): Promise<IDBResult<User>> {
    try {
      const store = await this.getStore('users');
      return new Promise((resolve) => {
        const request = store.index('email').get(email);
        request.onsuccess = () => resolve({ success: true, data: request.result });
        request.onerror = () => resolve({ success: false, error: 'User not found' });
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async addUser(user: User): Promise<IDBResult<string>> {
    try {
      const store = await this.getStore('users', 'readwrite');
      return new Promise((resolve) => {
        const request = store.add(user);
        request.onsuccess = () => resolve({ success: true, data: user._id });
        request.onerror = () => resolve({ success: false, error: 'Failed to add user' });
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async updateUser(user: User): Promise<IDBResult<void>> {
    try {
      const store = await this.getStore('users', 'readwrite');
      return new Promise((resolve) => {
        const request = store.put(user);
        request.onsuccess = () => resolve({ success: true });
        request.onerror = () => resolve({ success: false, error: 'Failed to update user' });
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deleteUser(userId: string): Promise<IDBResult<void>> {
    try {
      const store = await this.getStore('users', 'readwrite');
      return new Promise((resolve) => {
        const request = store.delete(userId);
        request.onsuccess = () => resolve({ success: true });
        request.onerror = () => resolve({ success: false, error: 'Failed to delete user' });
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Offers
  async getOffers(): Promise<IDBResult<Offer[]>> {
    try {
      const store = await this.getStore('offers');
      return new Promise((resolve) => {
        const request = store.getAll();
        request.onsuccess = () => resolve({ success: true, data: request.result });
        request.onerror = () => resolve({ success: false, error: 'Failed to get offers' });
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async getOfferById(id: string): Promise<IDBResult<Offer>> {
    try {
      const store = await this.getStore('offers');
      return new Promise((resolve) => {
        const request = store.get(id);
        request.onsuccess = () => resolve({ success: true, data: request.result });
        request.onerror = () => resolve({ success: false, error: 'Offer not found' });
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async addOffer(offer: Offer): Promise<IDBResult<string>> {
    try {
      const store = await this.getStore('offers', 'readwrite');
      return new Promise((resolve) => {
        const request = store.add(offer);
        request.onsuccess = () => resolve({ success: true, data: offer._id });
        request.onerror = () => resolve({ success: false, error: 'Failed to add offer' });
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async updateOffer(offer: Offer): Promise<IDBResult<void>> {
    try {
      const store = await this.getStore('offers', 'readwrite');
      return new Promise((resolve) => {
        const request = store.put(offer);
        request.onsuccess = () => resolve({ success: true });
        request.onerror = () => resolve({ success: false, error: 'Failed to update offer' });
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deleteOffer(offerId: string): Promise<IDBResult<void>> {
    try {
      const store = await this.getStore('offers', 'readwrite');
      return new Promise((resolve) => {
        const request = store.delete(offerId);
        request.onsuccess = () => resolve({ success: true });
        request.onerror = () => resolve({ success: false, error: 'Failed to delete offer' });
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Demands
  async getDemands(): Promise<IDBResult<Demand[]>> {
    try {
      const store = await this.getStore('demands');
      return new Promise((resolve) => {
        const request = store.getAll();
        request.onsuccess = () => resolve({ success: true, data: request.result });
        request.onerror = () => resolve({ success: false, error: 'Failed to get demands' });
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async getDemandById(id: string): Promise<IDBResult<Demand>> {
    try {
      const store = await this.getStore('demands');
      return new Promise((resolve) => {
        const request = store.get(id);
        request.onsuccess = () => resolve({ success: true, data: request.result });
        request.onerror = () => resolve({ success: false, error: 'Demand not found' });
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async addDemand(demand: Demand): Promise<IDBResult<string>> {
    try {
      const store = await this.getStore('demands', 'readwrite');
      return new Promise((resolve) => {
        const request = store.add(demand);
        request.onsuccess = () => resolve({ success: true, data: demand._id });
        request.onerror = () => resolve({ success: false, error: 'Failed to add demand' });
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async updateDemand(demand: Demand): Promise<IDBResult<void>> {
    try {
      const store = await this.getStore('demands', 'readwrite');
      return new Promise((resolve) => {
        const request = store.put(demand);
        request.onsuccess = () => resolve({ success: true });
        request.onerror = () => resolve({ success: false, error: 'Failed to update demand' });
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deleteDemand(demandId: string): Promise<IDBResult<void>> {
    try {
      const store = await this.getStore('demands', 'readwrite');
      return new Promise((resolve) => {
        const request = store.delete(demandId);
        request.onsuccess = () => resolve({ success: true });
        request.onerror = () => resolve({ success: false, error: 'Failed to delete demand' });
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // VIP Upgrade Requests
  async getVIPRequests(): Promise<IDBResult<VIPUpgradeRequest[]>> {
    try {
      const store = await this.getStore('vipRequests');
      return new Promise((resolve) => {
        const request = store.getAll();
        request.onsuccess = () => resolve({ success: true, data: request.result });
        request.onerror = () => resolve({ success: false, error: 'Failed to get VIP requests' });
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async getVIPRequestById(id: string): Promise<IDBResult<VIPUpgradeRequest>> {
    try {
      const store = await this.getStore('vipRequests');
      return new Promise((resolve) => {
        const request = store.get(id);
        request.onsuccess = () => resolve({ success: true, data: request.result });
        request.onerror = () => resolve({ success: false, error: 'VIP request not found' });
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async addVIPRequest(request: VIPUpgradeRequest): Promise<IDBResult<string>> {
    try {
      const store = await this.getStore('vipRequests', 'readwrite');
      return new Promise((resolve) => {
        const idbRequest = store.add(request);
        idbRequest.onsuccess = () => resolve({ success: true, data: request._id });
        idbRequest.onerror = () => resolve({ success: false, error: 'Failed to add VIP request' });
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async updateVIPRequest(request: VIPUpgradeRequest): Promise<IDBResult<void>> {
    try {
      const store = await this.getStore('vipRequests', 'readwrite');
      return new Promise((resolve) => {
        const idbRequest = store.put(request);
        idbRequest.onsuccess = () => resolve({ success: true });
        idbRequest.onerror = () => resolve({ success: false, error: 'Failed to update VIP request' });
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Reservations
  async getReservations(): Promise<IDBResult<Reservation[]>> {
    try {
      const store = await this.getStore('reservations');
      return new Promise((resolve) => {
        const request = store.getAll();
        request.onsuccess = () => resolve({ success: true, data: request.result });
        request.onerror = () => resolve({ success: false, error: 'Failed to get reservations' });
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async getReservationById(id: string): Promise<IDBResult<Reservation>> {
    try {
      const store = await this.getStore('reservations');
      return new Promise((resolve) => {
        const request = store.get(id);
        request.onsuccess = () => resolve({ success: true, data: request.result });
        request.onerror = () => resolve({ success: false, error: 'Reservation not found' });
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async addReservation(reservation: Reservation): Promise<IDBResult<string>> {
    try {
      const store = await this.getStore('reservations', 'readwrite');
      return new Promise((resolve) => {
        const request = store.add(reservation);
        request.onsuccess = () => resolve({ success: true, data: reservation._id });
        request.onerror = () => resolve({ success: false, error: 'Failed to add reservation' });
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async updateReservation(reservation: Reservation): Promise<IDBResult<void>> {
    try {
      const store = await this.getStore('reservations', 'readwrite');
      return new Promise((resolve) => {
        const request = store.put(reservation);
        request.onsuccess = () => resolve({ success: true });
        request.onerror = () => resolve({ success: false, error: 'Failed to update reservation' });
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deleteReservation(reservationId: string): Promise<IDBResult<void>> {
    try {
      const store = await this.getStore('reservations', 'readwrite');
      return new Promise((resolve) => {
        const request = store.delete(reservationId);
        request.onsuccess = () => resolve({ success: true });
        request.onerror = () => resolve({ success: false, error: 'Failed to delete reservation' });
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // ===================== Messages CRUD =====================
  async getMessages(): Promise<IDBResult<Message[]>> {
    try {
      const store = await this.getStore('messages');
      return new Promise((resolve) => {
        const request = store.getAll();
        request.onsuccess = () => resolve({ success: true, data: request.result });
        request.onerror = () => resolve({ success: false, error: 'Failed to get messages' });
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async getMessageById(id: string): Promise<IDBResult<Message>> {
    try {
      const store = await this.getStore('messages');
      return new Promise((resolve) => {
        const request = store.get(id);
        request.onsuccess = () => resolve({ success: true, data: request.result });
        request.onerror = () => resolve({ success: false, error: 'Failed to get message' });
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async addMessage(message: Message): Promise<IDBResult<string>> {
    try {
      const store = await this.getStore('messages', 'readwrite');
      return new Promise((resolve) => {
        const request = store.add(message);
        request.onsuccess = () => resolve({ success: true, data: message._id });
        request.onerror = () => resolve({ success: false, error: 'Failed to add message' });
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async updateMessage(message: Message): Promise<IDBResult<void>> {
    try {
      const store = await this.getStore('messages', 'readwrite');
      return new Promise((resolve) => {
        const request = store.put(message);
        request.onsuccess = () => resolve({ success: true });
        request.onerror = () => resolve({ success: false, error: 'Failed to update message' });
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deleteMessage(messageId: string): Promise<IDBResult<void>> {
    try {
      const store = await this.getStore('messages', 'readwrite');
      return new Promise((resolve) => {
        const request = store.delete(messageId);
        request.onsuccess = () => resolve({ success: true });
        request.onerror = () => resolve({ success: false, error: 'Failed to delete message' });
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}

export const localDb = new LocalDatabase();