export enum UserRole {
    Admin = 'Admin',
    VIP = 'VIP',
    Provider = 'Provider',
    Farmer = 'Farmer',
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
    priceRate: number; // e.g., per hour or per acre
    status: OfferStatus;
}

export interface Demand {
    _id: string;
    farmerId: string; // Ref: User
    farmerName: string;
    requiredService: string;
    requiredTimeSlot: TimeSlot;
    description?: string;
    jobLocation: GeoJSONPoint;
    status: DemandStatus;
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
    | 'auth:login'
    | 'auth:register'

export type SetAppView = Dispatch<SetStateAction<AppView>>
