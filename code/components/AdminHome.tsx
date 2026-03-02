"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'
import { SetAppView } from '@/types'
import * as api from '@/services/apiService'
import { motion } from 'motion/react'
import { ShieldCheck, Users, ClipboardList } from 'lucide-react'

interface AdminHomeProps {
  setView: SetAppView
}

const AdminHome: React.FC<AdminHomeProps> = ({ setView }) => {
  const { currentUser } = useAuth()
  const { t } = useLanguage()
  const [pendingCount, setPendingCount] = useState(0)
  const [usersCount, setUsersCount] = useState(0)
  const [demandsCount, setDemandsCount] = useState(0)
  const [offersCount, setOffersCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeCard, setActiveCard] = useState(1)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pending, allUsers, allDemands, allOffers] = await Promise.all([
          api.getPendingUsers(),
          api.getAllUsers(),
          api.getAllDemands(),
          api.getAllOffers(),
        ])
        setPendingCount(pending.length)
        setUsersCount(allUsers.length)
        setDemandsCount(allDemands.length)
        setOffersCount(allOffers.length)
      } catch (e) {
        console.error('Error fetching admin data:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Center the carousel on the middle card on mount
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.offsetWidth * 0.8
    const gap = 12
    el.scrollLeft = (cardWidth + gap) * 1 - (el.offsetWidth - cardWidth) / 2
  }, [loading])

  // Track active card on scroll
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.offsetWidth * 0.8
    const gap = 12
    const scrollCenter = el.scrollLeft + el.offsetWidth / 2
    const idx = Math.round((scrollCenter - cardWidth / 2) / (cardWidth + gap))
    setActiveCard(Math.max(0, Math.min(2, idx)))
  }, [])

  const firstName = currentUser?.name?.split(' ')[0] || ''

  const statsCards = [
    {
      key: 'pending',
      bg: '#8B5CF6',
      icon: ShieldCheck,
      value: pendingCount,
      label: t('adminDash.pendingApprovals'),
      sub: pendingCount > 0 ? `${pendingCount} ${t('common.pending')}` : undefined,
      subDot: pendingCount > 0,
      subPulse: pendingCount > 0,
      onClick: () => setView('adminPending'),
    },
    {
      key: 'users',
      bg: '#3B82F6',
      icon: Users,
      value: usersCount,
      label: t('adminDash.allUsers'),
      onClick: () => setView('adminUsers'),
    },
    {
      key: 'demands',
      bg: '#8B5CF6',
      icon: ClipboardList,
      value: demandsCount + offersCount,
      label: t('adminDash.allDemandsOffers'),
      sub: `${demandsCount} + ${offersCount}`,
      subDot: true,
      onClick: () => setView('adminFeed'),
    },
  ]

  const quickActions = [
    {
      key: 'machines',
      emoji: '⚙️',
      label: t('adminDash.manageMachines'),
      desc: t('adminDash.machineTemplatesTitle'),
      color: 'bg-purple-500',
      onClick: () => setView('machineTemplates'),
    },
    {
      key: 'search',
      emoji: '🔍',
      label: t('common.searchUsers'),
      desc: t('adminDash.allUsersManagement'),
      color: 'bg-blue-500',
      onClick: () => setView('userSearch'),
    },
    {
      key: 'messages',
      emoji: '💬',
      label: t('nav.messages'),
      desc: t('nav.messaging'),
      color: 'bg-indigo-500',
      onClick: () => setView('messages'),
    },
  ]

  return (
    <div
      className="bg-white flex flex-col overflow-hidden justify-evenly"
      style={{ height: 'calc(100dvh - 7.5rem - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))' }}
    >
      {/* ─── Greeting Section ─── */}
      <div className="px-5 pt-2 shrink-0">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-purple-600 text-[22px] font-semibold font-heading">
            {t('dash.hello')} {firstName},
          </h1>
          <p className="text-[#555] text-[16px] mt-1.5 leading-relaxed font-body" style={{ maxWidth: '90%' }}>
            {t('admin.title')}
          </p>
        </motion.div>
      </div>

      {/* ─── Statistics Carousel ─── */}
      <div className="shrink-0">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-3 overflow-x-auto px-[10%] snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {statsCards.map((card, i) => {
            const IconComponent = card.icon
            return (
              <motion.button
                key={card.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                onClick={card.onClick}
                className="snap-center shrink-0 rounded-2xl p-5 active:scale-[0.96] transition-all relative overflow-hidden flex flex-col items-center justify-center text-center"
                style={{
                  backgroundColor: card.bg,
                  width: '80%',
                  opacity: activeCard === i ? 1 : 0.7,
                  transform: activeCard === i ? 'scale(1)' : 'scale(0.95)',
                }}
              >
                <div className="absolute -top-5 -right-5 w-24 h-24 rounded-full bg-white/10" />
                <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/8" />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2">
                    <IconComponent className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                  <p className="text-white text-[32px] font-extrabold leading-none">
                    {card.value}
                  </p>
                  <p className="text-white/80 text-[13px] font-medium mt-1 font-body">{card.label}</p>
                  {card.sub && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {card.subDot && (
                        <div className={`w-1.5 h-1.5 bg-green-300 rounded-full ${card.subPulse ? 'animate-pulse' : ''}`} />
                      )}
                      <span className="text-white/60 text-[12px] font-medium">{card.sub}</span>
                    </div>
                  )}
                </div>
              </motion.button>
            )
          })}
        </div>
        {/* Dots indicator */}
        <div className="flex justify-center gap-1.5 mt-3">
          {statsCards.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                activeCard === i ? 'w-5 h-1.5 bg-purple-600' : 'w-1.5 h-1.5 bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ─── Quick Actions Section ─── */}
      <div className="shrink-0">
        <div className="flex items-center justify-between px-5 mb-2">
          <h2 className="text-purple-600 text-[17px] font-semibold font-heading">Actions rapides</h2>
        </div>

        <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide">
          {quickActions.map((action, i) => (
            <motion.button
              key={action.key}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.04 * i, type: 'spring', stiffness: 200 }}
              onClick={action.onClick}
              className="flex flex-col items-center shrink-0 active:scale-95 transition-transform"
              style={{ width: 100 }}
            >
              <div className={`w-16 h-16 rounded-2xl ${action.color} flex items-center justify-center mb-1.5 shadow-md`}>
                <span className="text-2xl">{action.emoji}</span>
              </div>
              <span className="text-[12px] font-medium text-gray-700 text-center leading-tight line-clamp-2">
                {action.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminHome
