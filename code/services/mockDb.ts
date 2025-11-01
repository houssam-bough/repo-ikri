import { User, Offer, Demand, UserRole, ApprovalStatus, DemandStatus, TimeSlot, GeoJSONPoint, OfferStatus } from '../types';

// Helper to create dates
const createDate = (day: number, hour: number) => {
    const date = new Date();
    date.setDate(date.getDate() + day);
    date.setHours(hour, 0, 0, 0);
    return date;
};

// Initial Data
let users: User[] = [
    { _id: 'admin1', name: 'Admin User', email: 'admin@ikri.com', password: 'password', phone: '111-222-3333', role: UserRole.Admin, approvalStatus: ApprovalStatus.Approved, location: { type: 'Point', coordinates: [-74.0060, 40.7128] } },
    { _id: 'provider1', name: 'John Deere Services', email: 'provider1@ikri.com', password: 'password', phone: '515-123-4567', role: UserRole.Provider, approvalStatus: ApprovalStatus.Approved, location: { type: 'Point', coordinates: [-93.6210, 41.5868] } },
    { _id: 'provider2', name: 'Farmhand Inc.', email: 'provider2@ikri.com', password: 'password', phone: '515-234-5678', role: UserRole.Provider, approvalStatus: ApprovalStatus.Pending, location: { type: 'Point', coordinates: [-93.6500, 41.6000] } },
    { _id: 'farmer1', name: 'Old McDonald', email: 'farmer1@ikri.com', password: 'password', phone: '515-345-6789', role: UserRole.Farmer, approvalStatus: ApprovalStatus.Approved, location: { type: 'Point', coordinates: [-93.7124, 41.6033] } },
    { _id: 'farmer2', name: 'Green Acres Farm', email: 'farmer2@ikri.com', password: 'password', phone: '515-456-7890', role: UserRole.Farmer, approvalStatus: ApprovalStatus.Pending, location: { type: 'Point', coordinates: [-93.8000, 41.6500] } },
];

let offers: Offer[] = [
    {
        _id: 'offer1',
        providerId: 'provider1',
        providerName: 'John Deere Services',
        equipmentType: 'Combine Harvester',
        description: 'High-efficiency John Deere S780 for corn and soybean harvesting.',
        availability: [
            { start: createDate(2, 8), end: createDate(2, 17) },
            { start: createDate(5, 8), end: createDate(10, 17) }
        ],
        serviceAreaLocation: { type: 'Point', coordinates: [-93.6210, 41.5868] },
        priceRate: 150,
        status: OfferStatus.Approved,
    }
];

let demands: Demand[] = [
    {
        _id: 'demand1',
        farmerId: 'farmer1',
        farmerName: 'Old McDonald',
        requiredService: 'Corn Harvesting',
        requiredTimeSlot: { start: createDate(3, 9), end: createDate(3, 16) },
        jobLocation: { type: 'Point', coordinates: [-93.7124, 41.6033] },
        status: DemandStatus.Open,
    },
    {
        _id: 'demand2',
        farmerId: 'farmer1',
        farmerName: 'Old McDonald',
        requiredService: 'Tilling',
        requiredTimeSlot: { start: createDate(20, 9), end: createDate(22, 16) },
        jobLocation: { type: 'Point', coordinates: [-94.00, 41.80] },
        status: DemandStatus.Open,
    },
    {
        _id: 'demand3',
        farmerId: 'farmer1',
        farmerName: 'Old McDonald',
        requiredService: 'Seeding',
        requiredTimeSlot: { start: createDate(1, 9), end: createDate(1, 16) },
        jobLocation: { type: 'Point', coordinates: [-93.75, 41.62] },
        status: DemandStatus.Pending,
    }
];

// --- DB Interaction Functions ---

// USERS
export const dbFindUserByEmail = (email: string): User | undefined => users.find(u => u.email === email);
export const dbGetUsers = (): User[] => users;
export const dbAddUser = (user: Omit<User, '_id'>): User => {
    const newUser: User = { ...user, _id: `user${Date.now()}` };
    users.push(newUser);
    return newUser;
};
export const dbUpdateUserStatus = (_id: string, status: ApprovalStatus): User | undefined => {
    const user = users.find(u => u._id === _id);
    if (user) {
        user.approvalStatus = status;
    }
    return user;
};

export const dbUpdateUser = (userId: string, updatedData: Partial<Omit<User, '_id' | 'email' | 'role' | 'approvalStatus' | 'password'>>): User | undefined => {
    const userIndex = users.findIndex(u => u._id === userId);
    if (userIndex > -1) {
        const currentUser = users[userIndex];
        users[userIndex] = { ...currentUser, ...updatedData };
        return users[userIndex];
    }
    return undefined;
};


// OFFERS
export const dbGetOffers = (): Offer[] => offers;
export const dbGetOffersByProviderId = (providerId: string): Offer[] => offers.filter(o => o.providerId === providerId);
export const dbAddOffer = (offer: Omit<Offer, '_id'>): Offer => {
    const newOffer: Offer = { ...offer, _id: `offer${Date.now()}` };
    offers.push(newOffer);
    return newOffer;
};
export const dbUpdateOfferStatus = (_id: string, status: OfferStatus): Offer | undefined => {
    const offer = offers.find(o => o._id === _id);
    if (offer) {
        offer.status = status;
    }
    return offer;
};


// DEMANDS
export const dbGetDemands = (): Demand[] => demands;
export const dbGetDemandById = (demandId: string): Demand | undefined => demands.find(d => d._id === demandId);
export const dbGetDemandsByFarmerId = (farmerId: string): Demand[] => demands.filter(d => d.farmerId === farmerId);
export const dbAddDemand = (demand: Omit<Demand, '_id'>): Demand => {
    const newDemand: Demand = { ...demand, _id: `demand${Date.now()}` };
    demands.push(newDemand);
    return newDemand;
};
export const dbUpdateDemandStatus = (_id: string, status: DemandStatus): Demand | undefined => {
    const demand = demands.find(d => d._id === _id);
    if (demand) {
        demand.status = status;
    }
    return demand;
};
