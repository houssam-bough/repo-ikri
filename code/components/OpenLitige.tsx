"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useLanguage } from "@/hooks/useLanguage"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Reservation, SetAppView } from "@/types"
import { getReservationsForFarmer, createLitige } from "@/services/apiService"
import { ArrowLeft, AlertTriangle, Upload, X, Camera } from "lucide-react"

interface OpenLitigeProps {
  setView: SetAppView
}

const MOTIFS = [
  { value: 'no_show', labelKey: 'motifNoShow', icon: '🚫' },
  { value: 'retard', labelKey: 'motifRetard', icon: '⏰' },
  { value: 'materiel_defectueux', labelKey: 'motifMaterielDefectueux', icon: '🔧' },
  { value: 'autre', labelKey: 'motifAutre', icon: '📋' },
]

const OpenLitige: React.FC<OpenLitigeProps> = ({ setView }) => {
  const { t, language } = useLanguage()
  const { currentUser } = useAuth()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [selectedReservationId, setSelectedReservationId] = useState<string>('')
  const [selectedMotif, setSelectedMotif] = useState<string>('')
  const [description, setDescription] = useState('')
  const [preuves, setPreuves] = useState<string[]>([])

  const fieldClass = "mt-2 block w-full px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl text-base transition-all focus:outline-none focus:border-[#4C9A2A] focus:ring-2 focus:ring-[#4C9A2A]/20"

  // Fetch approved reservations only (can only dispute approved ones)
  const fetchReservations = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      const all = await getReservationsForFarmer(currentUser._id)
      // Filter to only approved reservations (not already in litige)
      const approved = all.filter(r => r.status === 'approved')
      setReservations(approved)
    } catch (error) {
      console.error("Failed to fetch reservations:", error)
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    
    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(t('misc.fileTooLarge'))
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreuves(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const removePreuve = (index: number) => {
    setPreuves(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!currentUser || !selectedReservationId || !selectedMotif || !description.trim()) return

    if (!confirm(t('litiges.confirmSubmit'))) return

    const reservation = reservations.find(r => r._id === selectedReservationId)
    if (!reservation) return

    setSubmitting(true)
    try {
      const result = await createLitige({
        reservationId: selectedReservationId,
        clientId: currentUser._id,
        prestataireId: reservation.providerId,
        motif: selectedMotif,
        description: description.trim(),
        preuves,
      })

      if (result) {
        alert(t('litiges.submitSuccess'))
        setView('myLitiges')
      } else {
        alert(t('litiges.submitError'))
      }
    } catch (error) {
      console.error("Error creating litige:", error)
      alert(t('litiges.submitError'))
    } finally {
      setSubmitting(false)
    }
  }

  const selectedReservation = reservations.find(r => r._id === selectedReservationId)
  const isValid = selectedReservationId && selectedMotif && description.trim().length >= 3

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#4C9A2A]/5 via-orange-50/30 to-white px-4 py-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-[#4C9A2A]/20 border-t-[#4C9A2A]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#4C9A2A]/5 via-orange-50/30 to-white px-4 py-6">
      <div className="max-w-lg mx-auto space-y-5">
        {/* Back button */}
        <Button
          onClick={() => setView("myLitiges")}
          variant="outline"
          className="mb-2 rounded-xl border-gray-300 text-gray-600"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('common.backToDashboard')}
        </Button>

        {/* Title */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 mb-3">
            <span className="text-3xl">⚖️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 font-heading">
            {t('litiges.newLitige')}
          </h1>
        </div>

        {/* No reservations */}
        {reservations.length === 0 ? (
          <Card className="rounded-2xl border border-gray-100 shadow-sm">
            <CardContent className="p-8 text-center">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-gray-500 mb-4">{t('litiges.noApprovedReservations')}</p>
              <Button
                onClick={() => setView('myReservations')}
                className="bg-[#4C9A2A] hover:bg-[#3d7d22] text-white rounded-xl"
              >
                {t('litiges.goToReservations')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Section 1: Select reservation */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#4C9A2A]/10 text-sm">📅</span>
                <h3 className="font-semibold text-gray-800">{t('litiges.reservation')}</h3>
              </div>
              <select
                value={selectedReservationId}
                onChange={(e) => setSelectedReservationId(e.target.value)}
                className={fieldClass}
              >
                <option value="">{t('litiges.selectReservation')}</option>
                {reservations.map(r => {
                  const startDate = new Date(r.reservedTimeSlot.start).toLocaleDateString(language === 'ar' ? 'ar-MA' : 'fr-FR')
                  return (
                    <option key={r._id} value={r._id}>
                      {r.equipmentType} — {r.providerName} — {startDate} — {r.totalCost || r.priceRate} MAD
                    </option>
                  )
                })}
              </select>

              {/* Selected reservation summary */}
              {selectedReservation && (
                <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('litiges.equipment')}</span>
                    <span className="font-medium text-gray-800">{selectedReservation.equipmentType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('litiges.prestataire')}</span>
                    <span className="font-medium text-gray-800">{selectedReservation.providerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('litiges.period')}</span>
                    <span className="font-medium text-gray-800">
                      {new Date(selectedReservation.reservedTimeSlot.start).toLocaleDateString(language === 'ar' ? 'ar-MA' : 'fr-FR')}
                      {' → '}
                      {new Date(selectedReservation.reservedTimeSlot.end).toLocaleDateString(language === 'ar' ? 'ar-MA' : 'fr-FR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('litiges.amount')}</span>
                    <span className="font-bold text-[#4C9A2A]">{selectedReservation.totalCost || selectedReservation.priceRate} MAD</span>
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Motif */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-sm">⚠️</span>
                <h3 className="font-semibold text-gray-800">{t('litiges.motif')}</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {MOTIFS.map(m => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setSelectedMotif(m.value)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      selectedMotif === m.value
                        ? 'border-[#4C9A2A] bg-[#4C9A2A]/5 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{m.icon}</div>
                    <div className="text-xs font-medium text-gray-700">
                      {t(`litiges.${m.labelKey}`)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Section 3: Description */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-sm">📝</span>
                <h3 className="font-semibold text-gray-800">{t('litiges.description')}</h3>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('litiges.descriptionPlaceholder')}
                rows={4}
                className={fieldClass + " resize-none"}
              />
            </div>

            {/* Section 4: Preuves */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-purple-50 text-sm">📸</span>
                <h3 className="font-semibold text-gray-800">{t('litiges.preuves')}</h3>
              </div>

              {/* Uploaded proofs */}
              {preuves.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {preuves.map((preuve, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={preuve}
                        alt={`Preuve ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-xl border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removePreuve(idx)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload zone */}
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#4C9A2A] hover:bg-[#4C9A2A]/5 transition">
                <Camera className="w-8 h-8 text-gray-400 mb-1" />
                <span className="text-sm text-gray-500">{t('litiges.uploadProof')}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Funds blocked warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 text-sm">{t('litiges.fundsBlocked')}</p>
                <p className="text-amber-700 text-xs mt-1">{t('litiges.fundsBlockedDesc')}</p>
              </div>
            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={!isValid || submitting}
              className={`w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg transition-all ${
                isValid && !submitting
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:scale-[0.98]'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {submitting ? t('litiges.submitting') : t('litiges.submitLitige')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default OpenLitige
