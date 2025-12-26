"use client"

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { SetAppView } from '../types';
import * as api from '../services/apiService';

interface ProviderDashboardProps {
  setView: SetAppView;
}

const ProviderDashboard: React.FC<ProviderDashboardProps> = ({ setView }) => {
  const { currentUser } = useAuth();
  const [offersCount, setOffersCount] = useState(0);
  const [proposalsCount, setProposalsCount] = useState(0);
  const [messagesCount, setMessagesCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      if (!currentUser) return;

      try {
        // Compter les offres
        const offers = await api.getAllOffers();
        const myOffers = offers.filter(o => o.providerId === currentUser._id);
        setOffersCount(myOffers.length);

        // Compter les propositions
        const proposals = await api.getMyProposals(currentUser._id);
        setProposalsCount(proposals.length);

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
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="bg-linear-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10">
              <span className="text-[200px]">🚜</span>
            </div>
            <div className="relative z-10">
              <h1 className="text-4xl font-bold mb-2">
                Bienvenue, {currentUser?.name}
              </h1>
              <p className="text-blue-100 text-lg">
                Gérez vos machines et répondez aux demandes des agriculteurs
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Mes Offres</p>
                <p className="text-3xl font-bold text-gray-800">{offersCount}</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-emerald-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Mes Propositions</p>
                <p className="text-3xl font-bold text-gray-800">{proposalsCount}</p>
              </div>
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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

        <div className="grid md:grid-cols-2 gap-8">
          <button
            onClick={() => setView('postOffer')}
            className="group bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-blue-500"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-blue-500 group-hover:translate-x-2 transition-transform text-3xl">→</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors">
                Proposer une Machine
              </h2>
              <p className="text-gray-600 text-left">
                Publiez une offre de location pour votre matériel agricole
              </p>
            </div>
            <div className="h-2 bg-linear-to-r from-blue-500 to-indigo-600" />
          </button>

          <button
            onClick={() => setView('demandsFeed')}
            className="group bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-emerald-500"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-linear-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-4xl">📢</span>
                </div>
                <span className="text-emerald-500 group-hover:translate-x-2 transition-transform text-3xl">→</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-emerald-600 transition-colors">
                Voir les Demandes
              </h2>
              <p className="text-gray-600 text-left">
                Parcourez les besoins des agriculteurs et proposez vos services
              </p>
            </div>
            <div className="h-2 bg-linear-to-r from-emerald-500 to-teal-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;
