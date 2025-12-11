export enum UserRole {
    Admin = 'Admin',
    User = 'User',
}

export enum ApprovalStatus {
    Pending = 'pending',
    Approved = 'approved',
    Denied = 'denied',
}

export enum DemandStatus {
    Pending = 'pending',
    Open = 'open',
    Matched = 'matched',
    Rejected = 'rejected',
}

export enum OfferStatus {
    Pending = 'pending',
    Approved = 'approved',
    Rejected = 'rejected',
}

export enum ReservationStatus {
    Pending = 'pending',
    Approved = 'approved',
    Rejected = 'rejected',
    Cancelled = 'cancelled',
}

export enum ProposalStatus {
    Pending = 'pending',
    Accepted = 'accepted',
    Rejected = 'rejected',
}


export interface GeoJSONPoint {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
}

export interface User {
    _id: string;
    name: string;
    email: string;
    password?: string; // Should be hashed in a real app
    phone?: string;
    role: UserRole;
    approvalStatus: ApprovalStatus;
    location: GeoJSONPoint;
}

export interface TimeSlot {
    start: Date;
    end: Date;
}

export interface Offer {
    _id: string;
    providerId: string; // Ref: User
    providerName: string;
    equipmentType: string;
    description: string;
    availability: TimeSlot[];
    serviceAreaLocation: GeoJSONPoint;
    city: string; // City where the machine is located
    address: string; // Precise address
    priceRate: number; // e.g., per hour or per acre
    status: OfferStatus;
    photoUrl?: string; // Base64 encoded image or URL
}

export interface Demand {
    _id: string;
    farmerId: string; // Ref: User
    farmerName: string;
    title: string; // Title of the demand
    city: string; // City name
    address: string; // Precise address
    requiredService: string;
    requiredTimeSlot: TimeSlot;
    description?: string;
    jobLocation: GeoJSONPoint;
    status: DemandStatus;
    photoUrl?: string; // Base64 encoded image or URL
}

export interface DemandWithFarmer extends Demand {
    farmer?: {
        email: string;
        phone?: string;
    };
}

export interface Reservation {
    _id: string;
    farmerId: string; // Ref: User
    farmerName: string;
    farmerPhone?: string;
    offerId: string; // Ref: Offer
    providerId: string; // Ref: User
    providerName: string;
    equipmentType: string;
    reservedTimeSlot: TimeSlot;
    priceRate: number;
    totalCost?: number;
    status: ReservationStatus;
    createdAt: Date;
    approvedAt?: Date;
}

export interface Message {
    _id: string;
    senderId: string; // Ref: User
    senderName: string;
    receiverId: string; // Ref: User
    receiverName: string;
    content: string;
    fileUrl?: string;
    fileType?: 'image' | 'pdf' | 'audio';
    fileName?: string;
    audioUrl?: string;
    audioDuration?: number;
    relatedOfferId?: string; // Optional: if message is about a specific offer
    relatedDemandId?: string; // Optional: if message is about a specific demand
    createdAt: Date;
    read: boolean;
}

export interface Conversation {
    otherUserId: string;
    otherUserName: string;
    lastMessage: string;
    lastMessageDate: Date;
    unreadCount: number;
}

export interface City {
    name: string;
    lat: number;
    lon: number;
}

export interface Country {
    name: string;
    cities: City[];
}

import type { Dispatch, SetStateAction } from 'react'

export type AppView =
    | 'dashboard'
    | 'profile'
    | 'postDemand'
    | 'postOffer'
    | 'offersFeed'
    | 'demandsFeed'
    | 'userSearch'
    | 'myReservations'
    | 'messages'
    | 'machineTemplates'
    | 'myProposals'
    | 'auth:login'
    | 'auth:register'

export type SetAppView = Dispatch<SetStateAction<AppView>>

export interface Proposal {
    _id: string;
    demandId: string;
    providerId: string;
    providerName: string;
    price: number;
    description: string;
    status: ProposalStatus;
    createdAt: Date;
    updatedAt: Date;
}
