"use client"

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { SetAppView } from '../types';
import * as api from '../services/apiService';

interface FarmerDashboardProps {
  setView: SetAppView;
}

const FarmerDashboard: React.FC<FarmerDashboardProps> = ({ setView }) => {
  const { currentUser } = useAuth();
  const [demandsCount, setDemandsCount] = useState(0);
  const [reservationsCount, setReservationsCount] = useState(0);
  const [messagesCount, setMessagesCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      if (!currentUser) return;

      try {
        // Compter les demandes
        const demands = await api.getAllDemands();
        const myDemands = demands.filter(d => d.farmerId === currentUser._id);
        setDemandsCount(myDemands.length);

        // Compter les réservations
        const reservations = await api.getReservationsForFarmer(currentUser._id);
        setReservationsCount(reservations.length);

        // Compter les messages non lus
        const conversations = await api.getConversationsForUser(currentUser._id);
        const unreadCount = conversations.reduce((acc, conv) => {
          return acc + (conv.unreadCount || 0);
        }, 0);
        setMessagesCount(unreadCount);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [currentUser]);

  return (
    <div className="bg-linear-to-br from-emerald-50 via-white to-teal-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="bg-linear-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10">
              <span className="text-[200px]">🌾</span>
            </div>
            <div className="relative z-10">
              <h1 className="text-4xl font-bold mb-2">
                Bienvenue, {currentUser?.name}
              </h1>
              <p className="text-emerald-100 text-lg">
                Trouvez le matériel agricole dont vous avez besoin, facilement et rapidement
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-emerald-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Mes Demandes</p>
                <p className="text-3xl font-bold text-gray-800">{demandsCount}</p>
              </div>
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Réservations</p>
                <p className="text-3xl font-bold text-gray-800">{reservationsCount}</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-amber-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Messages</p>
                <p className="text-3xl font-bold text-gray-800">{messagesCount}</p>
              </div>
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Find Equipment - Hidden on mobile, accessible via bottom nav */}
          <button
            onClick={() => setView('offersFeed')}
            className="hidden md:group md:flex md:flex-col bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-emerald-500"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-linear-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <span className="text-emerald-500 group-hover:translate-x-2 transition-transform text-3xl">→</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-emerald-600 transition-colors">
                Trouver du Matériel
              </h2>
              <p className="text-gray-600 text-left">
                Parcourez les offres de machines disponibles près de chez vous
              </p>
            </div>
            <div className="h-2 bg-linear-to-r from-emerald-500 to-teal-600" />
          </button>

          {/* Post Need - Main action on mobile */}
          <button
            onClick={() => setView('postDemand')}
            className="group bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-amber-500"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-linear-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-4xl">➕</span>
                </div>
                <span className="text-amber-500 group-hover:translate-x-2 transition-transform text-3xl">→</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-amber-600 transition-colors">
                Publier un Besoin
              </h2>
              <p className="text-gray-600 text-left">
                Décrivez le matériel dont vous avez besoin et recevez des offres
              </p>
            </div>
            <div className="h-2 bg-linear-to-r from-amber-400 to-orange-500" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FarmerDashboard;
