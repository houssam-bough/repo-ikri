"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { SetAppView, Offer } from '@/types'
import * as api from '@/services/apiService'
import { Search, MapPin, Star, ChevronRight, Heart, ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'

interface FarmerHomeProps {
  setView: SetAppView
}

// Machine categories - Glovo style
const CATEGORIES = [
  { id: 'tracteur', label: 'Tracteurs', icon: '🚜', bg: 'bg-emerald-50' },
  { id: 'moissonneuse', label: 'Moissonneuses', icon: '🌾', bg: 'bg-amber-50' },
  { id: 'irrigation', label: 'Irrigation', icon: '💧', bg: 'bg-sky-50' },
  { id: 'semoir', label: 'Semoirs', icon: '🌱', bg: 'bg-lime-50' },
  { id: 'pulverisateur', label: 'Pulvérisateurs', icon: '🧪', bg: 'bg-violet-50' },
  { id: 'charrue', label: 'Charrues', icon: '⚙️', bg: 'bg-orange-50' },
  { id: 'remorque', label: 'Remorques', icon: '🚛', bg: 'bg-slate-100' },
  { id: 'autre', label: 'Autres', icon: '🔧', bg: 'bg-rose-50' },
]

const FarmerHome: React.FC<FarmerHomeProps> = ({ setView }) => {
  const { currentUser } = useAuth()
  const [offers, setOffers] = useState<Offer[]>([])
  const [demandsCount, setDemandsCount] = useState(0)
  const [reservationsCount, setReservationsCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return
      try {
        const [allOffers, allDemands, reservations] = await Promise.all([
          api.getAllOffers(),
          api.getAllDemands(),
          api.getReservationsForFarmer(currentUser._id),
        ])
        setOffers(allOffers.slice(0, 12))
        setDemandsCount(allDemands.filter(d => d.farmerId === currentUser._id).length)
        setReservationsCount(reservations.length)
      } catch (e) {
        console.error('Error fetching data:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [currentUser])

  const getDistanceText = (offer: Offer) => {
    if (offer.city) return offer.city
    return `${Math.floor(Math.random() * 20 + 2)} km`
  }

  const getRating = () => (Math.random() * 1.5 + 3.5).toFixed(1)

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
        <div className="absolute inset-0 bg-linear-to-br from-[#3A7D1E] via-[#4C9A2A] to-[#6ABF4B]" />
        {/* Deco circles */}
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/8" />
        <div className="absolute -bottom-16 -left-16 w-44 h-44 rounded-full bg-white/6" />
        <div className="absolute top-1/2 right-1/4 w-24 h-24 rounded-full bg-white/4" />

        <div className="relative z-10 px-5 pt-20 pb-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-white/70 text-base font-medium font-body">{greeting} 👋</p>
            <h1 className="text-white text-[32px] font-extrabold mt-0.5 tracking-tight font-heading">{firstName}</h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-emerald-200 text-[15px] mt-2 leading-relaxed max-w-[280px] font-body"
          >
            {offers.length > 0
              ? `${offers.length} machines disponibles près de chez vous`
              : 'Trouvez la machine agricole idéale'}
          </motion.p>

          {/* Search Bar - Airbnb style */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 120 }}
            onClick={() => setView('offersFeed')}
            className="w-full mt-6 bg-white rounded-2xl p-3.5 flex items-center gap-3 shadow-2xl shadow-black/20 active:scale-[0.98] transition-transform"
          >
            <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
              <Search className="w-5 h-5 text-[#FF8C1A]" />
            </div>
            <div className="text-left flex-1">
              <p className="text-gray-800 font-semibold text-sm">Que cherchez-vous ?</p>
              <p className="text-gray-400 text-[11px] mt-0.5">Tracteurs, moissonneuses, irrigation...</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-300 shrink-0" />
          </motion.button>
        </div>
      </div>

      {/* ─── Quick Stats (overlapping hero) ─── */}
      <div className="px-5 -mt-5 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl shadow-lg shadow-black/5 p-1 flex"
        >
          <button
            onClick={() => setView('myDemands')}
            className="flex-1 flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <span className="text-xl">📋</span>
            </div>
            <div className="text-left">
              <p className="text-[22px] font-extrabold text-gray-800 leading-none">{demandsCount}</p>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">Mes demandes</p>
            </div>
          </button>

          <div className="w-px bg-gray-100 my-3" />

          <button
            onClick={() => setView('myReservations')}
            className="flex-1 flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <span className="text-xl">📅</span>
            </div>
            <div className="text-left">
              <p className="text-[22px] font-extrabold text-gray-800 leading-none">{reservationsCount}</p>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">Réservations</p>
            </div>
          </button>
        </motion.div>
      </div>

      {/* ─── Categories - Glovo horizontal scroll ─── */}
      <div className="mt-7 mb-2">
        <div className="flex items-center justify-between px-5 mb-4">
          <h2 className="text-[17px] font-extrabold text-[#333333] font-heading">Catégories</h2>
        </div>

        <div className="flex gap-3 overflow-x-auto px-5 pb-3 scrollbar-hide">
          {CATEGORIES.map((cat, i) => (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.04 * i, type: 'spring', stiffness: 200 }}
              onClick={() => setView('offersFeed')}
              className="flex flex-col items-center gap-2 shrink-0 group"
            >
              <div
                className={`w-[68px] h-[68px] rounded-2xl flex items-center justify-center shadow-sm transition-all duration-200 ${cat.bg} group-active:scale-90`}
              >
                <span className="text-[28px]">{cat.icon}</span>
              </div>
              <span className="text-[11px] font-semibold text-gray-500 whitespace-nowrap">{cat.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ─── Machines disponibles - Airbnb cards ─── */}
      <div className="px-5 mt-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[17px] font-extrabold text-[#333333] font-heading">Machines disponibles</h2>
            <p className="text-[12px] text-gray-400 mt-0.5 font-body">Près de chez vous</p>
          </div>
          <button
            onClick={() => setView('offersFeed')}
            className="flex items-center gap-1 text-[#FF8C1A] text-[13px] font-bold active:opacity-60"
          >
            Tout voir <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                <div className="h-44 bg-gray-100" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-100 rounded-lg w-3/4" />
                  <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : offers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white rounded-2xl shadow-sm"
          >
            <div className="text-5xl mb-4">🚜</div>
            <p className="text-gray-700 font-semibold text-[15px]">Aucune machine disponible</p>
            <p className="text-gray-400 text-[13px] mt-1">Publiez une demande pour trouver ce qu'il vous faut</p>
            <button
              onClick={() => setView('postDemand')}
              className="mt-5 px-6 py-2.5 bg-[#FF8C1A] text-white text-sm font-bold rounded-full active:scale-95 transition-transform font-body"
            >
              Publier une demande
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {offers.slice(0, 5).map((offer, index) => (
              <motion.button
                key={offer._id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * index, type: 'spring', stiffness: 100 }}
                onClick={() => setView('offersFeed')}
                className="w-full bg-white rounded-2xl shadow-sm overflow-hidden text-left active:scale-[0.98] transition-all duration-200 group"
              >
                {/* Image - Airbnb big photo */}
                <div className="relative h-44 bg-linear-to-br from-gray-100 to-gray-200 overflow-hidden">
                  {offer.photoUrl ? (
                    <img
                      src={offer.photoUrl}
                      alt={offer.equipmentType}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-emerald-50 to-green-100">
                      <span className="text-6xl opacity-40">🚜</span>
                    </div>
                  )}

                  {/* Top badges */}
                  <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#4C9A2A] text-white text-[11px] font-bold rounded-full shadow-lg">
                      <div className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
                      Disponible
                    </div>
                    <div className="w-8 h-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm">
                      <Heart className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Price badge */}
                  <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-xl shadow-lg">
                    <span className="text-[15px] font-extrabold text-gray-800">{offer.priceRate}</span>
                    <span className="text-[11px] text-gray-500 ml-0.5">MAD/jour</span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 text-[15px] truncate">
                    {offer.equipmentType}
                    {offer.machineType && ` - ${offer.machineType}`}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5 text-[12px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {getDistanceText(offer)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {getRating()}
                    </span>
                  </div>
                  <p className="text-[12px] text-gray-400 mt-2">
                    Par <span className="font-medium text-gray-500">{offer.providerName}</span>
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* ─── CTA Banner ─── */}
      <div className="px-5 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-linear-to-br from-[#FF8C1A] to-[#FFA040] rounded-2xl p-5 relative overflow-hidden"
        >
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="relative z-10">
            <h3 className="text-white font-extrabold text-[16px] font-heading">Besoin d'une machine ?</h3>
            <p className="text-white/80 text-[12px] mt-1 leading-relaxed max-w-[220px] font-body">
              Publiez votre demande gratuitement et recevez des propositions de prestataires
            </p>
            <button
              onClick={() => setView('postDemand')}
              className="mt-4 px-5 py-2.5 bg-white text-[#FF8C1A] text-[13px] font-bold rounded-full shadow-lg shadow-orange-900/20 active:scale-95 transition-transform font-body"
            >
              Publier une demande →
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default FarmerHome
