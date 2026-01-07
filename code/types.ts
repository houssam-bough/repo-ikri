export enum UserRole {
    Admin = 'Admin',
    Farmer = 'Farmer',
    Provider = 'Provider',
    Both = 'Both',
}

export enum ApprovalStatus {
    Pending = 'pending',
    Approved = 'approved',
    Denied = 'denied',
}

export enum DemandStatus {
    Waiting = 'waiting',        // En attente (0 proposition)
    Negotiating = 'negotiating', // En négociation (≥1 proposition)
    Matched = 'matched',         // Matché (proposition acceptée)
}

export enum BookingStatus {
    Waiting = 'waiting',       // En attente de réservation
    Negotiating = 'negotiating', // Réservation en cours de négociation
    Matched = 'matched',        // Réservation confirmée
}

export enum ReservationStatus {
    Pending = 'pending',   // En attente
    Approved = 'approved', // Approuvé
    Rejected = 'rejected', // Rejeté
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
    activeMode?: 'Farmer' | 'Provider'; // For 'Both' role users, tracks current mode
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
    machineType?: string; // Nom du template ou equipmentType
    description: string;
    availability: TimeSlot[];
    availabilitySlots?: Array<{ startDate: string; endDate: string }>; // Périodes de disponibilité
    serviceAreaLocation: GeoJSONPoint;
    city: string; // City where the machine is located
    address: string; // Precise address
    priceRate: number; // e.g., per hour or per acre
    bookingStatus: BookingStatus; // Statut de réservation
    photoUrl?: string; // Base64 encoded image or URL
    createdAt?: Date | string; // Date de création
    customFields?: any; // Custom fields from machine template
}

export interface Demand {
    _id: string;
    farmerId: string; // Ref: User
    farmerName: string;
    title: string; // Title of the demand
    city: string; // City name
    address: string; // Precise address
    requiredService: string; // Type de machine
    serviceType?: string; // Type de prestation
    cropType?: string; // Type de culture
    area?: number; // Superficie en hectares
    requiredTimeSlot: TimeSlot;
    description?: string;
    jobLocation: GeoJSONPoint;
    status: DemandStatus;
    photoUrl?: string; // Base64 encoded image or URL
    createdAt?: Date;
    updatedAt?: Date;
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
    providerPhone?: string;
    providerEmail?: string;
    equipmentType: string;
    reservedTimeSlot: TimeSlot;
    priceRate: number;
    totalCost?: number;
    status: ReservationStatus;
    createdAt: Date;
    approvedAt?: Date;
}

// Type pour les boutons d'action dans les notifications
export interface ActionButton {
    label: string;           // Texte du bouton (ex: "Voir mes demandes")
    labelKey?: string;       // Clé de traduction optionnelle
    targetView: string;      // Vue cible (ex: "myDemands", "myOffers", "myProposals")
    params?: Record<string, string>;  // Paramètres optionnels
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
    actionButton?: ActionButton; // Bouton d'action optionnel pour les notifications
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
    | 'myDemands'
    | 'myOffers'
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
