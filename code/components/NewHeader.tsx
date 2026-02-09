"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'
import { Bell, ChevronDown, Globe } from 'lucide-react'
import { UserRole, SetAppView, AppView } from '@/types'
import { motion, AnimatePresence } from 'motion/react'
import * as api from '@/services/apiService'
import Image from 'next/image'

interface NewHeaderProps {
  setView: SetAppView
  currentView: AppView
}

const NewHeader: React.FC<NewHeaderProps> = ({ setView, currentView }) => {
  const { currentUser, updateCurrentUser } = useAuth()
  const { language, setLanguage, t } = useLanguage()
  const [scrolled, setScrolled] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const notifRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const isBothRole = currentUser?.role === UserRole.Both
  const isProvider = currentUser?.role === UserRole.Provider || currentUser?.activeMode === 'Provider'

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fetch unread notifications
  useEffect(() => {
    if (!currentUser) return
    const fetchUnread = async () => {
      try {
        const conversations = await api.getConversationsForUser(currentUser._id)
        const total = conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0)
        setUnreadCount(total)
      } catch (e) { console.error(e) }
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 15000)
    return () => clearInterval(interval)
  }, [currentUser, currentView])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false)
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleModeSwitch = async () => {
    if (!isBothRole) return
    const newMode = isProvider ? 'Farmer' : 'Provider'
    await updateCurrentUser({ activeMode: newMode })
  }

  if (!currentUser) return null

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-md'
          : 'bg-white/80 backdrop-blur-sm'
      }`}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <div className="px-4 lg:px-8">
        <div className="h-14 lg:h-16 flex items-center gap-3">
          {/* Logo */}
          <button
            onClick={() => setView('dashboard')}
            className="flex items-center gap-2 shrink-0"
          >
            <div className="w-14 h-14 rounded-xl overflow-hidden">
              <Image src="/ikri-logo.png" alt="IKRI" width={56} height={56} className="w-full h-full object-contain" />
            </div>
          </button>

          {/* Mode Toggle for Both users */}
          {isBothRole && (
            <button
              onClick={handleModeSwitch}
              className="hidden sm:flex items-center bg-gray-100 rounded-full p-0.5 shrink-0"
            >
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
                  !isProvider ? 'bg-[#4C9A2A] text-white shadow-sm' : 'text-gray-500'
                }`}
              >
                🌾 Agriculteur
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
                  isProvider ? 'bg-[#FF8C1A] text-white shadow-sm' : 'text-gray-500'
                }`}
              >
                🚜 Prestataire
              </span>
            </button>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-1 ml-auto">
            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title={language === 'en' ? 'Français' : 'English'}
            >
              <Globe className="w-5 h-5 text-gray-600" />
            </button>

            {/* Notifications */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false) }}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                  >
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-800">Notifications</h3>
                    </div>
                    <div className="p-3">
                      {unreadCount > 0 ? (
                        <button
                          onClick={() => { setView('messages'); setShowNotifications(false) }}
                          className="w-full p-3 rounded-xl bg-[#FF8C1A]/10 text-left hover:bg-[#FF8C1A]/20 transition-colors"
                        >
                          <p className="text-sm font-medium text-gray-800">
                            {unreadCount} message{unreadCount > 1 ? 's' : ''} non lu{unreadCount > 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Cliquez pour voir vos messages</p>
                        </button>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                          Aucune notification
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Avatar / Menu */}
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false) }}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-linear-to-br from-[#FF8C1A] to-[#CC6A00] rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                  >
                    <div className="p-3 border-b border-gray-100">
                      <p className="font-semibold text-gray-800 text-sm">{currentUser.name}</p>
                      <p className="text-xs text-gray-500">{currentUser.email}</p>
                    </div>

                    {/* Mode Toggle for Both - Mobile */}
                    {isBothRole && (
                      <div className="px-3 py-2 border-b border-gray-100 sm:hidden">
                        <button
                          onClick={() => { handleModeSwitch(); setShowUserMenu(false) }}
                          className="w-full flex items-center justify-between p-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <span className="text-xs font-medium text-gray-700">
                            Mode: {isProvider ? '🚜 Prestataire' : '🌾 Agriculteur'}
                          </span>
                          <span className="text-xs text-[#FF8C1A] font-semibold">Changer →</span>
                        </button>
                      </div>
                    )}

                    <div className="p-2">
                      <button
                        onClick={() => { setView('profile'); setShowUserMenu(false) }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <span>👤</span> Mon Profil
                      </button>
                      <button
                        onClick={() => { setView('myReservations'); setShowUserMenu(false) }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <span>📅</span> Mes Réservations
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default NewHeader
