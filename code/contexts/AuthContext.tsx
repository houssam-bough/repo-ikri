"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, UserRole } from '../types';
import * as api from '../services/apiService';

interface AuthContextType {
    currentUser: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<User | null>;
    logout: () => void;
    register: (userData: Omit<User, '_id' | 'approvalStatus'>) => Promise<User>;
    updateCurrentUser: (updatedData: Partial<Omit<User, '_id' | 'email' | 'role' | 'approvalStatus' | 'password'>>) => Promise<User | null>;
    refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load user from localStorage after mount (client-side only)
    useEffect(() => {
        const stored = localStorage.getItem('ykri_current_user');
        if (stored) {
            try {
                setCurrentUser(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse stored user:', e);
                localStorage.removeItem('ykri_current_user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string): Promise<User | null> => {
        if (!email || !password) {
            throw new Error('Email and password are required');
        }
        
        try {
            const user = await api.loginUser(email, password);
            setCurrentUser(user);
            // Persist to localStorage
            localStorage.setItem('ykri_current_user', JSON.stringify(user));
            return user;
        } catch (error) {
            console.error('Login failed:', error);
            // Pass through the specific error message
            throw error instanceof Error ? error : new Error('Login failed');
        }
    };

    const logout = () => {
        setCurrentUser(null);
        // Clear from localStorage
        localStorage.removeItem('ykri_current_user');
    };

    const register = async (userData: Omit<User, '_id' | 'approvalStatus'>): Promise<User> => {
        // Register user using API service
        const newUser = await api.registerUser(userData);
        if (!newUser) {
            throw new Error('Failed to register user');
        }

        if (userData.role === UserRole.Admin) {
            setCurrentUser(newUser);
            // Persist to localStorage
            localStorage.setItem('ykri_current_user', JSON.stringify(newUser));
        }

        return newUser;
    };    const updateCurrentUser = async (updatedData: Partial<Omit<User, '_id' | 'email' | 'role' | 'approvalStatus' | 'password'>>): Promise<User | null> => {
        if (!currentUser) return null;

        const updatedUser = await api.updateUserProfile(currentUser._id, updatedData);
        if (updatedUser) {
            // Force a new object reference to trigger React re-render
            const newUser = { ...updatedUser };
            setCurrentUser(newUser);
            // Persist to localStorage
            localStorage.setItem('ykri_current_user', JSON.stringify(newUser));
            return newUser;
        }
        return null;
    };

    const refreshUser = async (): Promise<void> => {
        if (!currentUser) return;

        try {
            const updatedUser = await api.getUserById(currentUser._id);
            if (updatedUser) {
                setCurrentUser(updatedUser);
                localStorage.setItem('ykri_current_user', JSON.stringify(updatedUser));
            }
        } catch (error) {
            console.error('Failed to refresh user:', error);
        }
    };


    const value = { currentUser, isLoading, login, logout, register, updateCurrentUser, refreshUser };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
