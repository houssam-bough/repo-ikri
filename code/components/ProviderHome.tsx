"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { SetAppView, Offer, Demand } from '@/types'
import * as api from '@/services/apiService'
import { ChevronRight, MapPin, Plus, Zap } from 'lucide-react'
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'matched':
        return { label: 'En location', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' }
      case 'negotiating':
        return { label: 'En négo', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' }
      default:
        return { label: 'Active', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' }
    }
  }

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

      {/* ─── Recent Demands ─── */}
      <div className="px-5 mt-2 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[#4C9A2A] text-[17px] font-semibold font-heading">Demandes récentes</h2>
          <button
            onClick={() => setView('demandsFeed')}
            className="flex items-center gap-0.5 text-[#FF8C1A] text-[13px] font-semibold active:opacity-60"
          >
            Tout voir <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-50 rounded-2xl h-20 animate-pulse" />
            ))}
          </div>
        ) : demands.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-[#333] font-semibold text-[15px] font-heading">Aucune demande pour le moment</p>
            <p className="text-gray-400 text-[13px] mt-1 font-body">Revenez plus tard</p>
          </div>
        ) : (
          <div className="space-y-3">
            {demands.slice(0, 4).map((demand, index) => (
              <motion.button
                key={demand._id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.06 * index }}
                onClick={() => setView('demandsFeed')}
                className="w-full bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-left flex items-center gap-3.5 active:scale-[0.98] transition-transform"
              >
                {/* Avatar */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0 shadow-md"
                  style={{ background: 'linear-gradient(135deg, #FF8C1A, #FFA040)' }}
                >
                  {demand.farmerName?.charAt(0).toUpperCase() || 'A'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#333] text-[14px] truncate">
                    {demand.requiredService || demand.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-3 h-3" />
                      {demand.city || 'Non spécifié'}
                    </span>
                    {demand.area && <span>· {demand.area} ha</span>}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5 font-body">Par {demand.farmerName}</p>
                </div>

                {/* CTA */}
                <div className="shrink-0">
                  <div className="flex items-center gap-1 px-3.5 py-2 bg-[#4C9A2A] text-white text-[12px] font-bold rounded-full shadow-sm active:scale-95 transition-transform">
                    <Zap className="w-3 h-3" />
                    Proposer
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* ─── My Machines Grid ─── */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[#4C9A2A] text-[17px] font-semibold font-heading">Mes machines</h2>
          <button
            onClick={() => setView('myOffers')}
            className="flex items-center gap-0.5 text-[#FF8C1A] text-[13px] font-semibold active:opacity-60"
          >
            Tout voir <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {offers.length === 0 ? (
          <button
            onClick={() => setView('postOffer')}
            className="w-full bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center active:scale-[0.98] transition-transform"
          >
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Plus className="w-7 h-7 text-[#FF8C1A]" />
            </div>
            <p className="text-[#333] font-bold text-[14px] font-heading">Publier une machine</p>
            <p className="text-gray-400 text-[12px] mt-1 font-body">Commencez à recevoir des demandes</p>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {offers.slice(0, 4).map((offer, index) => {
              const badge = getStatusBadge(offer.bookingStatus)
              return (
                <motion.button
                  key={offer._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.06 * index }}
                  onClick={() => setView('myOffers')}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-left active:scale-[0.97] transition-transform"
                >
                  <div className="h-28 bg-gray-50 relative overflow-hidden">
                    {offer.photoUrl ? (
                      <img src={offer.photoUrl} alt={offer.equipmentType} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-orange-50 to-amber-50">
                        <span className="text-3xl opacity-30">🚜</span>
                      </div>
                    )}
                    <div className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full ${badge.color}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      {badge.label}
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-[#333] text-[13px] truncate">{offer.equipmentType}</h3>
                    <p className="text-[12px] text-[#4C9A2A] font-extrabold mt-1">{offer.priceRate} MAD/jour</p>
                  </div>
                </motion.button>
              )
            })}
          </div>
        )}
      </div>

      {/* ─── CTA Banner ─── */}
      <div className="px-5 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #4C9A2A, #6ABF4B)' }}
        >
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/8 rounded-full" />
          <div className="relative z-10">
            <h3 className="text-white font-semibold text-[16px] font-heading">Ajoutez une machine</h3>
            <p className="text-white/80 text-[12px] mt-1 leading-relaxed max-w-[220px] font-body">
              Plus de machines = plus de visibilité = plus de contrats
            </p>
            <button
              onClick={() => setView('postOffer')}
              className="mt-4 px-5 py-2.5 bg-white text-[#4C9A2A] text-[13px] font-bold rounded-full shadow-lg active:scale-95 transition-transform font-body"
            >
              Publier une machine →
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ProviderHome
