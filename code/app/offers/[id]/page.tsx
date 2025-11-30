'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Offer } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/hooks/useLanguage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPinIcon, UserIcon, PhoneIcon, MailIcon, WrenchIcon } from 'lucide-react'
import { createReservation, checkOfferAvailability } from '@/services/apiService'
import AvailabilityDialog from '@/components/AvailabilityDialog'

interface MapProps {
  position: [number, number]
  title: string
  city: string
}

const DynamicMap = dynamic<MapProps>(
  () => import('@/components/OfferDetailsMap'),
  { 
    ssr: false,
    loading: () => <div className="h-80 rounded-lg bg-slate-100 animate-pulse flex items-center justify-center">Loading map...</div>
  }
)

interface OfferWithProvider extends Offer {
  customFields?: Record<string, any>
  provider?: {
    email: string
    phone?: string
  }
}

export default function OfferDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const offerId = params.id as string
  const { currentUser } = useAuth()
  const { t } = useLanguage()

  const [offer, setOffer] = useState<OfferWithProvider | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAvailability, setShowAvailability] = useState(false)
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [reservationStartDate, setReservationStartDate] = useState('')
  const [reservationStartTime, setReservationStartTime] = useState('09:00')
  const [reservationEndDate, setReservationEndDate] = useState('')
  const [reservationEndTime, setReservationEndTime] = useState('17:00')
  const [isReserving, setIsReserving] = useState(false)

  const fetchOffer = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/offers/${offerId}`)
      if (response.ok) {
        const data = await response.json()
        setOffer(data.offer)
      } else {
        setError('Offre introuvable')
      }
    } catch (err) {
      console.error('Error fetching offer:', err)
      setError('Error loading details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (offerId) {
      fetchOffer()
      
      // Set default reservation dates to tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]
      setReservationStartDate(tomorrowStr)
      setReservationEndDate(tomorrowStr)
    }
  }, [offerId])

  const handleReservationSubmit = async () => {
    if (!currentUser || !offer) return

    const startDateTime = new Date(`${reservationStartDate}T${reservationStartTime}`)
    const endDateTime = new Date(`${reservationEndDate}T${reservationEndTime}`)

    if (endDateTime <= startDateTime) {
      alert('La date de fin doit être après la date de début')
      return
    }

    setIsReserving(true)
    try {
      const isAvailable = await checkOfferAvailability(offer._id, {
        start: startDateTime,
        end: endDateTime
      })

      if (!isAvailable) {
        alert(t('common.alreadyBooked'))
        setIsReserving(false)
        return
      }

      const reservation = await createReservation(
        currentUser._id,
        currentUser.name,
        currentUser.phone,
        offer,
        {
          start: startDateTime,
          end: endDateTime
        }
      )

      if (reservation) {
        alert('✅ Reservation request sent! The provider will verify and approve it.')
        setShowReservationModal(false)
      } else {
        alert('Failed to create reservation. Please try again.')
      }
    } catch (error) {
      console.error('Reservation error:', error)
      alert('Error creating reservation')
    } finally {
      setIsReserving(false)
    }
  }

  const calculateEstimatedCost = () => {
    if (!offer || !reservationStartDate || !reservationStartTime || !reservationEndDate || !reservationEndTime) {
      return 0
    }
    const start = new Date(`${reservationStartDate}T${reservationStartTime}`)
    const end = new Date(`${reservationEndDate}T${reservationEndTime}`)
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    return hours > 0 ? hours * offer.priceRate : 0
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <p className="text-slate-600">{t('common.loadingDetails')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !offer) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error || t('common.offerNotFound')}</p>
              <Button onClick={() => router.back()}>{t('common.back')}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const position: [number, number] = [
    offer.serviceAreaLocation.coordinates[1],
    offer.serviceAreaLocation.coordinates[0]
  ]

  const isMyOffer = currentUser && currentUser._id === offer.providerId

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-amber-50">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Button 
            onClick={() => window.location.href = '/?view=offersFeed'} 
            variant="outline"
            className="mb-4"
          >
            ← {t('common.back')}
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                {offer.equipmentType}
              </h1>
              <div className="flex items-center gap-3">
                <Badge className="bg-amber-100 text-amber-800">
                  {offer.priceRate} MAD/heure
                </Badge>
                <Badge className={offer.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {offer.status === 'approved' ? `✅ ${t('common.available')}` : `⏳ ${t('common.awaitingApproval')}`}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Section principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo */}
            {offer.photoUrl && (
              <Card>
                <CardContent className="p-0">
                  <img 
                    src={offer.photoUrl} 
                    alt={offer.equipmentType}
                    className="w-full h-80 object-cover rounded-t-lg"
                  />
                </CardContent>
              </Card>
            )}

            {/* Détails de l'offre */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <WrenchIcon className="h-5 w-5 text-amber-600" />
                  {t('common.equipmentInformation')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-700 mb-1">{t('common.description')}</h3>
                  <p className="text-slate-600 whitespace-pre-line">{offer.description || t('common.noDescription')}</p>
                </div>

                {/* Custom Fields */}
                {offer.customFields && Object.keys(offer.customFields).length > 0 && (
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold text-slate-700 mb-3">{t('common.technicalSpecs')}</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {Object.entries(offer.customFields).map(([key, value]) => (
                        <div key={key} className="bg-amber-50 p-3 rounded-lg">
                          <p className="text-xs text-slate-600 mb-1">{key}</p>
                          <p className="text-sm font-semibold text-slate-800">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <div className="flex items-start gap-3">
                    <MapPinIcon className="h-5 w-5 text-amber-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-slate-700 mb-1">{t('common.location')}</h3>
                      <p className="text-sm text-slate-600">{offer.city}</p>
                      <p className="text-sm text-slate-500">{offer.address}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Carte */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5 text-amber-600" />
                  {t('common.machineLocation')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 rounded-lg overflow-hidden border border-slate-200 relative z-0">
                  <DynamicMap 
                    position={position}
                    title={offer.equipmentType}
                    city={offer.city}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Profil du prestataire */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-amber-600" />
                  {t('common.providerProfile')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center pb-4 border-b">
                  <div className="w-20 h-20 rounded-full bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                    {offer.providerName.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="font-semibold text-lg text-slate-800">{offer.providerName}</h3>
                </div>

                {offer.provider && (
                  <div className="space-y-3">
                    {offer.provider.email && (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <MailIcon className="h-5 w-5 text-slate-600 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-slate-500 mb-1">Email</p>
                          <a 
                            href={`mailto:${offer.provider.email}`}
                            className="text-sm text-amber-600 hover:text-amber-700 hover:underline break-all"
                          >
                            {offer.provider.email}
                          </a>
                        </div>
                      </div>
                    )}

                    {offer.provider.phone && (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <PhoneIcon className="h-5 w-5 text-slate-600 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-slate-500 mb-1">Téléphone</p>
                          <a 
                            href={`tel:${offer.provider.phone}`}
                            className="text-sm text-amber-600 hover:text-amber-700 hover:underline"
                          >
                            {offer.provider.phone}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t space-y-3">
                  <Button 
                    className="w-full bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                    onClick={() => setShowAvailability(true)}
                  >
                    🔍 {t('common.viewAvailability')}
                  </Button>

                  {!isMyOffer && (
                    <>
                      <Button 
                        className="w-full bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                        onClick={() => setShowReservationModal(true)}
                      >
                        📅 Reserve this machine
                      </Button>

                      <Button 
                        className="w-full bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                        onClick={() => {
                          sessionStorage.setItem('messageTarget', JSON.stringify({
                            userId: offer.providerId,
                            userName: offer.providerName,
                            offerId: offer._id
                          }))
                          window.location.href = '/?view=messages'
                        }}
                      >
                        💬 Contact provider
                      </Button>
                    </>
                  )}
                </div>

                <div className="text-xs text-slate-500 text-center pt-2">
                  {t('common.protectedInfo')}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Availability Dialog */}
      {showAvailability && (
        <AvailabilityDialog
          offerId={offer._id}
          offerTitle={offer.equipmentType}
          isProviderView={isMyOffer || false}
          offerOwnerId={offer.providerId}
          onClose={() => setShowAvailability(false)}
        />
      )}

      {/* Reservation Modal */}
      {showReservationModal && !isMyOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-100 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto relative z-101">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">
              {t('common.reserve')}: {offer.equipmentType}
            </h3>
            <p className="text-sm text-slate-600 mb-4">{t('common.provider')}: {offer.providerName}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.startDate')}</label>
                <input
                  type="date"
                  value={reservationStartDate}
                  onChange={(e) => setReservationStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.startTime')}</label>
                <input
                  type="time"
                  value={reservationStartTime}
                  onChange={(e) => setReservationStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.endDate')}</label>
                <input
                  type="date"
                  value={reservationEndDate}
                  onChange={(e) => setReservationEndDate(e.target.value)}
                  min={reservationStartDate}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.endTime')}</label>
                <input
                  type="time"
                  value={reservationEndTime}
                  onChange={(e) => setReservationEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="bg-amber-50 p-4 rounded-lg">
                <p className="text-sm text-slate-700">
                  <strong>{t('common.rate')}:</strong> {offer.priceRate} MAD/heure
                </p>
                <p className="text-lg font-bold text-amber-800 mt-2">
                  {t('common.estimatedCost')}: {calculateEstimatedCost().toFixed(2)} MAD
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowReservationModal(false)}
                disabled={isReserving}
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg"
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleReservationSubmit}
                disabled={isReserving}
                className="flex-1 px-4 py-2 bg-linear-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {isReserving ? t('common.confirming') : t('common.confirmReservation')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
