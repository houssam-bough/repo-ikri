"use client"

import React, { useState, useEffect } from 'react'
import { Home, Compass, Plus, MessageSquare, User } from 'lucide-react'
import { AppView, SetAppView, UserRole } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import * as api from '@/services/apiService'
import { motion } from 'motion/react'

interface BottomNavProps {
  currentView: AppView
  setView: SetAppView
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, setView }) => {
  const { currentUser } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  const isProvider = currentUser?.role === UserRole.Provider || currentUser?.activeMode === 'Provider'

  // Fetch unread count
  useEffect(() => {
    if (!currentUser) return
    const fetchUnread = async () => {
      try {
        const conversations = await api.getConversationsForUser(currentUser._id)
        const total = conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0)
        setUnreadCount(total)
      } catch (e) {}
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 15000)
    return () => clearInterval(interval)
  }, [currentUser, currentView])

  // Define which views map to which tab
  const isHomeActive = currentView === 'dashboard'
  const isExploreActive = isProvider
    ? ['demandsFeed', 'myProposals'].includes(currentView)
    : ['offersFeed', 'myReservations'].includes(currentView)
  const isPublishActive = isProvider
    ? currentView === 'postOffer'
    : currentView === 'postDemand'
  const isMessagesActive = currentView === 'messages'
  const isProfileActive = ['profile', 'myDemands', 'myOffers'].includes(currentView)

  const navItems = [
    {
      id: 'home',
      icon: Home,
      label: 'Accueil',
      active: isHomeActive,
      action: () => setView('dashboard'),
    },
    {
      id: 'explore',
      icon: Compass,
      label: isProvider ? 'Demandes' : 'Explorer',
      active: isExploreActive,
      action: () => setView(isProvider ? 'demandsFeed' : 'offersFeed'),
    },
    {
      id: 'publish',
      icon: Plus,
      label: 'Publier',
      active: isPublishActive,
      action: () => setView(isProvider ? 'postOffer' : 'postDemand'),
      isCenter: true,
    },
    {
      id: 'messages',
      icon: MessageSquare,
      label: 'Messages',
      active: isMessagesActive,
      action: () => setView('messages'),
      badge: unreadCount,
    },
    {
      id: 'profile',
      icon: User,
      label: 'Profil',
      active: isProfileActive,
      action: () => setView('profile'),
    },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-end justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon

          if (item.isCenter) {
            return (
              <button
                key={item.id}
                onClick={item.action}
                className="relative -top-4 flex flex-col items-center"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="w-14 h-14 bg-linear-to-br from-[#FF8C1A] to-[#CC6A00] rounded-full flex items-center justify-center shadow-lg shadow-[#FF8C1A]/30"
                >
                  <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
                </motion.div>
                <span className="text-[10px] font-semibold text-[#FF8C1A] mt-1">{item.label}</span>
              </button>
            )
          }

          return (
            <button
              key={item.id}
              onClick={item.action}
              className="relative flex flex-col items-center py-2 px-3 min-w-14"
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    item.active ? 'text-[#4C9A2A]' : 'text-gray-400'
                  }`}
                  strokeWidth={item.active ? 2.5 : 1.8}
                />
                {item.badge != null && item.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                ) : null}
              </div>
              <span
                className={`text-[10px] mt-0.5 transition-colors ${
                  item.active ? 'text-[#4C9A2A] font-semibold' : 'text-gray-400 font-medium'
                }`}
              >
                {item.label}
              </span>
              {item.active && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#4C9A2A] rounded-full"
                />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav
