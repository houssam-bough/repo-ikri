"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { SetAppView, Offer, Demand } from '@/types'
import * as api from '@/services/apiService'
import { motion } from 'motion/react'

interface ProviderHomeProps {
  setView: SetAppView
}

const CATEGORIES = [
  { id: 'moissonneuse', label: 'Moissonneuses', icon: '🌾', bg: '#FFF8E1' },
  { id: 'tracteur', label: 'Tracteurs', icon: '🚜', bg: '#E8F5E9' },
  { id: 'faucheuse', label: 'Faucheuses', icon: '🌿', bg: '#E3F2FD' },
  { id: 'ensileuse', label: 'Ensileuses', icon: '🔧', bg: '#FFF3E0' },
  { id: 'irrigation', label: 'Irrigation', icon: '💧', bg: '#E0F7FA' },
  { id: 'semoir', label: 'Semoirs', icon: '🌱', bg: '#F1F8E9' },
  { id: 'pulverisateur', label: 'Pulvérisateurs', icon: '🧪', bg: '#F3E5F5' },
  { id: 'charrue', label: 'Charrues', icon: '⚙️', bg: '#ECEFF1' },
]

const ProviderHome: React.FC<ProviderHomeProps> = ({ setView }) => {
  const { currentUser } = useAuth()
  const [offers, setOffers] = useState<Offer[]>([])
  const [demands, setDemands] = useState<Demand[]>([])
  const [proposalsCount, setProposalsCount] = useState(0)
  const [loading, setLoading] = useState(true)

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

  const activeOffers = offers.filter(o => o.bookingStatus !== 'matched')

  const firstName = currentUser?.name?.split(' ')[0] || ''

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* ─── Greeting Section ─── */}
      <div className="px-5 pt-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-[#4C9A2A] text-[22px] font-semibold font-heading">
            Bonjour {firstName},
          </h1>
          <p className="text-[#555] text-[14px] mt-1.5 leading-relaxed font-body" style={{ maxWidth: '85%' }}>
            Gérez vos machines et répondez aux demandes des agriculteurs
          </p>
        </motion.div>
      </div>

      {/* ─── Statistics / Action Cards ─── */}
      <div className="px-5 mt-6">
        <div className="flex gap-3">
          {/* Card 1 - Machines (Orange) */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => setView('myOffers')}
            className="flex-1 rounded-2xl p-4 text-left active:scale-[0.96] transition-transform relative overflow-hidden"
            style={{ backgroundColor: '#FF8C1A' }}
          >
            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
            <div className="absolute -bottom-3 -left-3 w-14 h-14 rounded-full bg-white/8" />
            <div className="relative z-10">
              <span className="text-3xl">🚜</span>
              <p className="text-white text-[28px] font-extrabold leading-none mt-3">{offers.length}</p>
              <p className="text-white/80 text-[11px] font-medium mt-1 font-body">Machines</p>
              <div className="flex items-center gap-1 mt-1.5">
                <div className="w-1.5 h-1.5 bg-green-300 rounded-full" />
                <span className="text-white/60 text-[9px] font-medium">{activeOffers.length} actives</span>
              </div>
            </div>
          </motion.button>

          {/* Card 2 - Propositions (Green, wider) */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => setView('myProposals')}
            className="rounded-2xl p-4 text-left active:scale-[0.96] transition-transform relative overflow-hidden"
            style={{ backgroundColor: '#4C9A2A', flex: 1.4 }}
          >
            <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/8" />
            <div className="absolute bottom-2 right-3 text-5xl opacity-20">📨</div>
            <div className="relative z-10">
              <p className="text-white text-[36px] font-extrabold leading-none">{proposalsCount}</p>
              <p className="text-white/80 text-[12px] font-medium mt-1 font-body">Propositions</p>
              <div className="flex items-center gap-1.5 mt-2">
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                <span className="text-white/70 text-[10px] font-medium">envoyées</span>
              </div>
            </div>
          </motion.button>

          {/* Card 3 - Demandes (Orange) */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => setView('demandsFeed')}
            className="flex-1 rounded-2xl p-4 text-left active:scale-[0.96] transition-transform relative overflow-hidden"
            style={{ backgroundColor: '#FF8C1A' }}
          >
            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
            <div className="absolute -bottom-3 -left-3 w-14 h-14 rounded-full bg-white/8" />
            <div className="relative z-10">
              <span className="text-3xl">📋</span>
              <p className="text-white text-[28px] font-extrabold leading-none mt-3">{demands.length}</p>
              <p className="text-white/80 text-[11px] font-medium mt-1 font-body">Demandes</p>
            </div>
          </motion.button>
        </div>
      </div>

      {/* ─── Categories Section ─── */}
      <div className="mt-8">
        <div className="flex items-center justify-between px-5 mb-4">
          <h2 className="text-[#4C9A2A] text-[17px] font-semibold font-heading">Catégories</h2>
          <button
            onClick={() => setView('demandsFeed')}
            className="text-gray-400 text-[13px] font-medium active:opacity-60"
          >
            Tout voir
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto px-5 pb-4 scrollbar-hide">
          {CATEGORIES.map((cat, i) => (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.04 * i, type: 'spring', stiffness: 200 }}
              onClick={() => setView('demandsFeed')}
              className="flex flex-col items-center gap-2 shrink-0 group"
            >
              <div
                className="w-[68px] h-[68px] rounded-full flex items-center justify-center shadow-sm transition-transform group-active:scale-90"
                style={{ backgroundColor: cat.bg }}
              >
                <span className="text-[28px]">{cat.icon}</span>
              </div>
              <span className="text-[11px] font-medium text-gray-500 whitespace-nowrap font-body">{cat.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ─── CTA Banner ─── */}
      <div className="px-5 mb-8">
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
            <h3 className="text-white font-bold text-[17px] font-heading">Commencez avec nous</h3>
            <p className="text-white/90 text-[12px] mt-1.5 leading-relaxed max-w-[220px] font-body">
              Découvrez notre guide d&apos;utilisation de A à Z et prenez en main la plateforme facilement.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ProviderHome
