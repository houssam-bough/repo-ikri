"use client"

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { UserRole, AppView } from '../types';
import LogoutIcon from './icons/LogoutIcon';
import * as api from '../services/apiService';

interface SidebarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  unreadMessages?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, unreadMessages: propsUnreadMessages = 0 }) => {
  const { currentUser, logout } = useAuth();
  const { t } = useLanguage();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Fetch unread messages count directly in Sidebar
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!currentUser) return;
      
      try {
        const conversations = await api.getConversationsForUser(currentUser._id);
        const total = conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);
        setUnreadMessages(total);
      } catch (error) {
        console.error('Error fetching unread messages in Sidebar:', error);
      }
    };

    fetchUnreadCount();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, [currentUser, currentView]);

  if (!currentUser) return null;

  // Determine effective role for Both users
  const effectiveRole = currentUser.role === UserRole.Both 
    ? (currentUser.activeMode === 'Provider' ? UserRole.Provider : UserRole.Farmer)
    : currentUser.role;

  // Menu items based on role
  type MenuItem = {
    id: string;
    icon: string;
    label: string;
    view: AppView;
    highlight?: boolean;
    badge?: number;
  };

  const getFarmerMenuItems = (): MenuItem[] => [
    { id: 'dashboard', icon: '🏠', label: 'Accueil', view: 'dashboard' as AppView },
    { id: 'offers', icon: '🔍', label: 'Voir les Machines', view: 'offersFeed' as AppView },
    { id: 'publish', icon: '➕', label: 'Publier une Demande', view: 'postDemand' as AppView, highlight: true },
    { id: 'allDemands', icon: '🌍', label: 'Voir les Demandes', view: 'demandsFeed' as AppView },
    { id: 'myDemands', icon: '📋', label: 'Mes Demandes', view: 'myDemands' as AppView },
    { id: 'reservations', icon: '📅', label: 'Mes Réservations', view: 'myReservations' as AppView },
    { id: 'messages', icon: '💬', label: 'Messagerie', view: 'messages' as AppView, badge: unreadMessages },
    { id: 'profile', icon: '👤', label: 'Profil', view: 'profile' as AppView },
  ];

  const getProviderMenuItems = (): MenuItem[] => [
    { id: 'dashboard', icon: '🏠', label: 'Accueil', view: 'dashboard' as AppView },
    { id: 'demands', icon: '🔍', label: 'Voir les demandes', view: 'demandsFeed' as AppView },
    { id: 'publish', icon: '➕', label: 'Publier une machine', view: 'postOffer' as AppView, highlight: true },
    { id: 'allOffers', icon: '🌍', label: 'Voir les offres', view: 'offersFeed' as AppView },
    { id: 'myOffers', icon: '📦', label: 'Mes Offres', view: 'myOffers' as AppView },
    { id: 'myProposals', icon: '📝', label: 'Mes Propositions', view: 'myProposals' as AppView },
    { id: 'messages', icon: '💬', label: 'Messagerie', view: 'messages' as AppView, badge: unreadMessages },
    { id: 'profile', icon: '👤', label: 'Profil', view: 'profile' as AppView },
  ];

  const getAdminMenuItems = (): MenuItem[] => [
    { id: 'dashboard', icon: '🏠', label: 'Tableau de bord', view: 'dashboard' as AppView },
    { id: 'users', icon: '👥', label: 'Utilisateurs', view: 'userSearch' as AppView },
    { id: 'profile', icon: '👤', label: 'Profil', view: 'profile' as AppView },
  ];

  const menuItems = 
    currentUser.role === UserRole.Admin ? getAdminMenuItems() :
    effectiveRole === UserRole.Provider ? getProviderMenuItems() :
    getFarmerMenuItems();

  const handleNavigation = (view: AppView) => {
    setView(view);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
      >
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isMobileOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-screen bg-linear-to-b from-emerald-50 to-white
        border-r border-gray-200 shadow-xl z-40
        w-64 flex flex-col
        transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo & Brand */}
        <div className="p-6 border-b border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-linear-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">🌾</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">YKRI</h1>
              <p className="text-xs text-emerald-600 font-medium">
                {currentUser.role === UserRole.Admin ? 'Admin' :
                 effectiveRole === UserRole.Provider ? 'Prestataire' : 'Agriculteur'}
              </p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 bg-white border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-linear-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{currentUser.name}</p>
              <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
            </div>
          </div>
        </div>

        {/* Role Switcher for Both users */}
        {currentUser.role === UserRole.Both && (
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-100">
            <button
              onClick={() => setView('profile')}
              className="w-full text-xs text-amber-700 hover:text-amber-900 flex items-center justify-between group"
            >
              <span className="font-medium">
                Mode: {currentUser.activeMode === 'Provider' ? '🚜 Prestataire' : '🌾 Agriculteur'}
              </span>
              <span className="text-amber-500 group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = currentView === item.view;
              const isHighlight = item.highlight;

              return (
                <li key={item.id}>
                    <button
                    onClick={() => handleNavigation(item.view)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl
                      transition-all duration-200 group relative
                      ${isActive 
                        ? 'bg-linear-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200' 
                        : isHighlight
                        ? 'bg-linear-to-r from-amber-400 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-200'
                        : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'
                      }
                    `}
                  >
                    <span className="text-xl w-6 h-6 flex items-center justify-center flex-shrink-0">{item.icon}</span>
                    <span className="font-medium text-sm flex-1 text-left">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className={`
                        px-2 py-0.5 text-xs font-bold rounded-full
                        ${isActive ? 'bg-white text-emerald-600' : 'bg-red-500 text-white'}
                      `}>
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-l-full" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all group"
          >
            <LogoutIcon className="w-5 h-5" />
            <span className="font-medium text-sm">Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
