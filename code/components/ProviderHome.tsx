"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { SetAppView, Offer, Demand } from '@/types'
import * as api from '@/services/apiService'
import { TrendingUp, ChevronRight, MapPin, Calendar, Plus, Zap } from 'lucide-react'
import { motion } from 'motion/react'

interface ProviderHomeProps {
  setView: SetAppView
}

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
  const bookedOffers = offers.filter(o => o.bookingStatus === 'matched')

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
  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Bonjour'
    if (h < 18) return 'Bon après-midi'
    return 'Bonsoir'
  })()

  return (
    <div className="min-h-screen bg-[#FAFBFC] pb-24">
      {/* ─── Hero Section ─── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-[#CC6A00] via-[#FF8C1A] to-[#FFA040]" />
        {/* Deco */}
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-16 w-44 h-44 rounded-full bg-white/4" />
        <div className="absolute top-1/3 right-1/3 w-20 h-20 rounded-full bg-white/3" />

        <div className="relative z-10 px-5 pt-20 pb-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-white/60 text-base font-medium font-body">{greeting} 👋</p>
            <h1 className="text-white text-[32px] font-extrabold mt-0.5 tracking-tight font-heading">{firstName}</h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-orange-100/80 text-[15px] mt-2 leading-relaxed font-body"
          >
            Gérez vos machines et répondez aux demandes
          </motion.p>
        </div>
      </div>

      {/* ─── Stats Cards (overlapping hero) ─── */}
      <div className="px-5 -mt-6 relative z-10 mb-6">
        <div className="grid grid-cols-3 gap-3">
          {/* Machines */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => setView('myOffers')}
            className="bg-white rounded-2xl p-4 text-left shadow-lg shadow-black/5 active:scale-[0.97] transition-transform"
          >
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-2">
              <span className="text-xl">🚜</span>
            </div>
            <p className="text-[24px] font-extrabold text-[#333333] leading-none">{offers.length}</p>
            <p className="text-[11px] text-gray-400 font-medium mt-1 font-body">Machines</p>
            <div className="flex items-center gap-1 mt-1.5">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              <span className="text-[10px] text-green-600 font-medium">{activeOffers.length} actives</span>
            </div>
          </motion.button>

          {/* Propositions */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            onClick={() => setView('myProposals')}
            className="bg-white rounded-2xl p-4 text-left shadow-lg shadow-black/5 active:scale-[0.97] transition-transform"
          >
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-2">
              <span className="text-xl">📨</span>
            </div>
            <p className="text-[24px] font-extrabold text-[#333333] leading-none">{proposalsCount}</p>
            <p className="text-[11px] text-gray-400 font-medium mt-1 font-body">Propositions</p>
            <div className="flex items-center gap-1 mt-1.5">
              <TrendingUp className="w-3 h-3 text-orange-500" />
              <span className="text-[10px] text-orange-600 font-medium">envoyées</span>
            </div>
          </motion.button>

          {/* En location */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-4 text-left shadow-lg shadow-black/5 active:scale-[0.97] transition-transform"
          >
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-2">
              <span className="text-xl">📋</span>
            </div>
            <p className="text-[24px] font-extrabold text-[#333333] leading-none">{bookedOffers.length}</p>
            <p className="text-[11px] text-gray-400 font-medium mt-1 font-body">En location</p>
            <div className="flex items-center gap-1 mt-1.5">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
              <span className="text-[10px] text-blue-600 font-medium">actives</span>
            </div>
          </motion.button>
        </div>
      </div>

      {/* ─── Recent Demands ─── */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[17px] font-extrabold text-[#333333] font-heading">Demandes récentes</h2>
            <p className="text-[12px] text-gray-400 mt-0.5 font-body">Répondez pour gagner des contrats</p>
          </div>
          <button
            onClick={() => setView('demandsFeed')}
            className="flex items-center gap-1 text-[#FF8C1A] text-[13px] font-bold active:opacity-60"
          >
            Tout voir <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />
            ))}
          </div>
        ) : demands.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-700 font-semibold text-[15px]">Aucune demande pour le moment</p>
            <p className="text-gray-400 text-[13px] mt-1">Revenez plus tard</p>
          </div>
        ) : (
          <div className="space-y-3">
            {demands.slice(0, 4).map((demand, index) => (
              <motion.button
                key={demand._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 * index }}
                onClick={() => setView('demandsFeed')}
                className="w-full bg-white rounded-2xl p-4 shadow-sm text-left flex items-center gap-3.5 active:scale-[0.98] transition-transform"
              >
                {/* Avatar */}
                <div className="w-12 h-12 bg-linear-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0 shadow-md shadow-orange-200/50">
                  {demand.farmerName?.charAt(0).toUpperCase() || 'A'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 text-[14px] truncate">
                    {demand.requiredService || demand.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-3 h-3" />
                      {demand.city || 'Non spécifié'}
                    </span>
                    {demand.area && <span>· {demand.area} ha</span>}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">Par {demand.farmerName}</p>
                </div>

                {/* CTA */}
                <div className="shrink-0">
                  <div className="flex items-center gap-1 px-3.5 py-2 bg-[#4C9A2A] text-white text-[12px] font-bold rounded-full shadow-sm shadow-green-200/40 active:scale-95 transition-transform">
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
          <div>
            <h2 className="text-[17px] font-extrabold text-[#333333] font-heading">Mes machines</h2>
            <p className="text-[12px] text-gray-400 mt-0.5 font-body">Gérez votre flotte</p>
          </div>
          <button
            onClick={() => setView('myOffers')}
            className="flex items-center gap-1 text-[#FF8C1A] text-[13px] font-bold active:opacity-60"
          >
            Tout voir <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {offers.length === 0 ? (
          <button
            onClick={() => setView('postOffer')}
            className="w-full bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center active:scale-[0.98] transition-transform"
          >
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Plus className="w-7 h-7 text-[#FF8C1A]" />
            </div>
            <p className="text-gray-700 font-bold text-[14px]">Publier une machine</p>
            <p className="text-gray-400 text-[12px] mt-1">Commencez à recevoir des demandes</p>
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
                  transition={{ delay: 0.08 * index }}
                  onClick={() => setView('myOffers')}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden text-left active:scale-[0.97] transition-transform"
                >
                  <div className="h-28 bg-linear-to-br from-gray-100 to-gray-200 relative overflow-hidden">
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
                    <h3 className="font-bold text-gray-800 text-[13px] truncate">{offer.equipmentType}</h3>
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
          className="bg-linear-to-br from-[#FF8C1A] to-[#FFA040] rounded-2xl p-5 relative overflow-hidden"
        >
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/8 rounded-full" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/6 rounded-full" />
          <div className="relative z-10">
            <h3 className="text-white font-extrabold text-[16px] font-heading">Ajoutez une machine</h3>
            <p className="text-white/70 text-[12px] mt-1 leading-relaxed max-w-[220px] font-body">
              Plus de machines = plus de visibilité = plus de contrats
            </p>
            <button
              onClick={() => setView('postOffer')}
              className="mt-4 px-5 py-2.5 bg-white text-[#FF8C1A] text-[13px] font-bold rounded-full shadow-lg shadow-orange-900/20 active:scale-95 transition-transform font-body"
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
