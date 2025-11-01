import React, { createContext, useState, useContext, ReactNode } from 'react';
import { User, UserRole, ApprovalStatus } from '../types';
import * as db from '../services/mockDb';
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
        const user = db.dbFindUserByEmail(email);
        // In a real app, compare hashed passwords
        if (user && user.password === password) {
            setCurrentUser(user);
            return user;
        }
        throw new Error('Invalid credentials');
    };

    const logout = () => {
        setCurrentUser(null);
    };

    const register = async (userData: Omit<User, '_id' | 'approvalStatus'>): Promise<User> => {
        const existingUser = db.dbFindUserByEmail(userData.email);
        if (existingUser) {
            throw new Error('User with this email already exists.');
        }
        const newUser = db.dbAddUser({
            ...userData,
            approvalStatus: ApprovalStatus.Pending,
        });
        // Automatically log in after registration
        setCurrentUser(newUser);
        return newUser;
    };

    const updateCurrentUser = async (updatedData: Partial<Omit<User, '_id' | 'email' | 'role' | 'approvalStatus' | 'password'>>): Promise<User | null> => {
        if (!currentUser) {
            throw new Error("No user is currently logged in.");
        }
        try {
            const updatedUser = await api.updateUserProfile(currentUser._id, updatedData);
            if (updatedUser) {
                setCurrentUser(updatedUser);
                return updatedUser;
            }
            return null;
        } catch (error) {
            console.error("Failed to update user profile:", error);
            throw error;
        }
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
