"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { SetAppView, Offer, Demand } from '@/types'
import * as api from '@/services/apiService'
import { motion } from 'motion/react'
import { Tractor, SendHorizontal, ClipboardList } from 'lucide-react'

interface ProviderHomeProps {
  setView: SetAppView
}

const CATEGORIES = [
  { id: 'moissonneuse', label: 'Moissonneuses', img: '/categories/moissonneuse.jpg' },
  { id: 'tracteur', label: 'Tracteurs', img: '/categories/tracteur.jpg' },
  { id: 'faucheuse', label: 'Faucheuses', img: '/categories/faucheuse.jpg' },
  { id: 'ensileuse', label: 'Ensileuses', img: '/categories/ensileuse.jpg' },
  { id: 'irrigation', label: 'Irrigation', img: '/categories/irrigation.jpg' },
  { id: 'semoir', label: 'Semoirs', img: '/categories/semoir.jpg' },
  { id: 'pulverisateur', label: 'Pulvérisateurs', img: '/categories/pulverisateur.jpeg' },
  { id: 'charrue', label: 'Charrues', img: '/categories/charrue.jpg' },
]

const ProviderHome: React.FC<ProviderHomeProps> = ({ setView }) => {
  const { currentUser } = useAuth()
  const [offers, setOffers] = useState<Offer[]>([])
  const [demands, setDemands] = useState<Demand[]>([])
  const [proposalsCount, setProposalsCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeCard, setActiveCard] = useState(1) // Start centered on middle card
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return
      try {
        const [allOffers, allDemands, proposals] = await Promise.all([
          api.getAllOffers(),
          api.getAllDemands(),
          api.getMyProposals(currentUser._id),
        ])
        const myOffers = allOffers.filter(o => o.providerId === currentUser._id)
        setOffers(myOffers)
        setDemands(allDemands.slice(0, 6))
        setProposalsCount(proposals.length)
      } catch (e) {
        console.error('Error fetching data:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [currentUser])

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

  const activeOffers = offers.filter(o => o.bookingStatus !== 'matched')

  const firstName = currentUser?.name?.split(' ')[0] || ''

  const statsCards = [
    {
      key: 'machines',
      bg: '#FF8C1A',
      icon: '🚜',
      value: offers.length,
      label: 'Machines',
      sub: `${activeOffers.length} actives`,
      subDot: true,
      onClick: () => setView('myOffers'),
    },
    {
      key: 'proposals',
      bg: '#4C9A2A',
      icon: '📨',
      value: proposalsCount,
      label: 'Propositions',
      sub: 'envoyées',
      subDot: true,
      subPulse: true,
      onClick: () => setView('myProposals'),
    },
    {
      key: 'demands',
      bg: '#FF8C1A',
      icon: '📋',
      value: demands.length,
      label: 'Demandes',
      onClick: () => setView('demandsFeed'),
    },
  ]

  return (
    <div
      className="bg-white flex flex-col overflow-hidden"
      style={{ height: 'calc(100dvh - 8rem)' }}
    >
      {/* ─── Greeting Section ─── */}
      <div className="px-5 pt-4 flex-shrink-0">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-[#4C9A2A] text-[22px] font-semibold font-heading">
            Bonjour {firstName},
          </h1>
          <p className="text-[#555] text-[16px] mt-1.5 leading-relaxed font-body" style={{ maxWidth: '90%' }}>
            Gérez vos machines et répondez aux demandes des agriculteurs
          </p>
        </motion.div>
      </div>

      {/* ─── Statistics Carousel ─── */}
      <div className="flex-[3] flex flex-col justify-center min-h-0">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-3 overflow-x-auto px-[10%] snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {statsCards.map((card, i) => {
            const IconComponent = card.key === 'machines' ? Tractor : card.key === 'proposals' ? SendHorizontal : ClipboardList
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
                activeCard === i ? 'w-5 h-1.5 bg-[#4C9A2A]' : 'w-1.5 h-1.5 bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ─── Categories Section ─── */}
      <div className="flex-[2] flex flex-col justify-center min-h-0 -mt-5">
        <div className="flex items-center justify-between px-5 mb-2">
          <h2 className="text-[#4C9A2A] text-[17px] font-semibold font-heading">Catégories</h2>
          <button
            onClick={() => setView('demandsFeed')}
            className="text-gray-400 text-[14px] font-medium active:opacity-60"
          >
            Tout voir
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide">
          {CATEGORIES.map((cat, i) => (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.04 * i, type: 'spring', stiffness: 200 }}
              onClick={() => {
                sessionStorage.setItem('categoryFilter', cat.id)
                setView('demandsFeed')
              }}
              className="flex flex-col items-center gap-1.5 shrink-0 group"
              style={{ width: 'calc((100% - 18px) / 3.4)' }}
            >
              <div
                className="w-full aspect-square rounded-full overflow-hidden shadow-sm transition-transform group-active:scale-90"
              >
                <img
                  src={cat.img}
                  alt={cat.label}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[12px] font-medium text-gray-500 whitespace-nowrap font-body">{cat.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ─── CTA Banner ─── */}
      <div className="flex-[2] flex flex-col justify-center min-h-0 px-5 pb-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #FF8C1A, #FFA040)' }}
        >
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/8 rounded-full" />
          <div className="absolute bottom-0 right-0 w-28 h-28 opacity-30">
            <span className="text-7xl">🌾</span>
          </div>
          <div className="relative z-10">
            <h3 className="text-white font-bold text-[20px] font-heading">Commencez avec nous</h3>
            <p className="text-white text-[15px] mt-2 leading-relaxed max-w-[240px] font-semibold" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
              Découvrez notre guide d&apos;utilisation de A à Z et prenez en main la plateforme facilement.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ProviderHome
