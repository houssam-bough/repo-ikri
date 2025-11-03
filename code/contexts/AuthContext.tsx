import React, { createContext, useState, useContext, ReactNode } from 'react';
import { User, UserRole, ApprovalStatus } from '../types';
import * as api from '../services/apiService';

interface AuthContextType {
    currentUser: User | null;
    login: (email: string, password: string) => Promise<User | null>;
    logout: () => void;
    register: (userData: Omit<User, '_id' | 'approvalStatus'>) => Promise<User>;
    updateCurrentUser: (updatedData: Partial<Omit<User, '_id' | 'email' | 'role' | 'approvalStatus' | 'password'>>) => Promise<User | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const login = async (email: string, password: string): Promise<User | null> => {
        if (!email || !password) {
            throw new Error('Email and password are required');
        }
        
        try {
            const user = await api.loginUser(email, password);
            if (user.approvalStatus !== ApprovalStatus.Approved) {
                throw new Error('Account pending approval');
            }
            setCurrentUser(user);
            return user;
        } catch (error) {
            console.error('Login failed:', error);
            // Pass through the specific error message
            throw error instanceof Error ? error : new Error('Login failed');
        }
    };

    const logout = () => {
        setCurrentUser(null);
    };

    const register = async (userData: Omit<User, '_id' | 'approvalStatus'>): Promise<User> => {
        // Register user using API service
        const newUser = await api.registerUser(userData);
        if (!newUser) {
            throw new Error('Failed to register user');
        }

        if (userData.role === UserRole.Admin) {
            setCurrentUser(newUser);
        }

        return newUser;
    };    const updateCurrentUser = async (updatedData: Partial<Omit<User, '_id' | 'email' | 'role' | 'approvalStatus' | 'password'>>): Promise<User | null> => {
        if (!currentUser) return null;

        const updatedUser = await api.updateUserProfile(currentUser._id, updatedData);
        if (updatedUser) {
            setCurrentUser(updatedUser);
            return updatedUser;
        }
        return null;
    };


    const value = { currentUser, login, logout, register, updateCurrentUser };

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
