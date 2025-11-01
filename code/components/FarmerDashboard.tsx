"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../hooks/useAuth"
import { useLanguage } from "../hooks/useLanguage"
import { type Demand, type Offer, DemandStatus } from "../types"
import { getDemandsForFarmer, findMatchesForDemand, findLocalOffers } from "../services/apiService"
import Map, { type MapMarker } from "./Map"
import ListIcon from "./icons/ListIcon"
import MapIcon from "./icons/MapIcon"

interface FarmerDashboardProps {
  setView: (view: "dashboard" | "profile" | "postDemand" | "postOffer" | "offersFeed" | "demandsFeed") => void
}

const FarmerDashboard: React.FC<FarmerDashboardProps> = ({ setView }) => {
  const { currentUser } = useAuth()
  const { t } = useLanguage()
  const [demands, setDemands] = useState<Demand[]>([])
  const [matches, setMatches] = useState<Record<string, Offer[]>>({})
  const [localOffers, setLocalOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "map">("list")

  const fetchData = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      const [farmerDemands, offers] = await Promise.all([
        getDemandsForFarmer(currentUser._id),
        findLocalOffers(currentUser._id),
      ])
      setDemands(farmerDemands)
      setLocalOffers(offers)
    } catch (error) {
      console.error("Failed to fetch farmer data:", error)
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleViewMatches = async (demandId: string) => {
    try {
      const demand = demands.find((d) => d._id === demandId)
      if (!demand || demand.status !== DemandStatus.Open) {
        alert(t("farmer.viewMatchesNotOpen"))
        setSelectedDemand(null)
        return
      }
      setSelectedDemand(demand || null)
      if (!matches[demandId]) {
        // Fetch only if not already fetched
        const foundMatches = await findMatchesForDemand(demandId)
        setMatches((prev) => ({ ...prev, [demandId]: foundMatches }))
      }
    } catch (error) {
      console.error("Failed to find matches:", error)
      alert(t("farmer.viewMatchesError"))
    }
  }

  const getStatusChip = (status: DemandStatus) => {
    const statusText = {
      [DemandStatus.Pending]: t("status.pending"),
      [DemandStatus.Open]: t("status.open"),
      [DemandStatus.Matched]: t("status.matched"),
      [DemandStatus.Rejected]: t("status.rejected"),
    }[status]

    const statusColor = {
      [DemandStatus.Pending]: "bg-amber-100 text-amber-800",
      [DemandStatus.Open]: "bg-emerald-100 text-emerald-800",
      [DemandStatus.Matched]: "bg-sky-100 text-sky-800",
      [DemandStatus.Rejected]: "bg-rose-100 text-rose-800",
    }[status]

    return <span className={`text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full ${statusColor}`}>{statusText}</span>
  }

  const getMapMarkers = (): MapMarker[] => {
    if (!currentUser) return []

    const userMarker: MapMarker = {
      position: [currentUser.location.coordinates[1], currentUser.location.coordinates[0]],
      popupContent: `<strong>You are here</strong><br/>${currentUser.name}`,
      type: "user",
    }

    const offerMarkers: MapMarker[] = localOffers.map((offer) => ({
      position: [offer.serviceAreaLocation.coordinates[1], offer.serviceAreaLocation.coordinates[0]],
      popupContent: `<strong>${offer.equipmentType}</strong><br/>Provided by: ${offer.providerName}<br/>Rate: $${offer.priceRate}/hr`,
      type: "offer",
    }))

    return [userMarker, ...offerMarkers]
  }

  const viewModeButtonClasses = (mode: "list" | "map") =>
    `p-2 rounded-lg transition-all duration-300 shadow-sm ${viewMode === mode ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg" : "bg-white text-slate-600 hover:bg-slate-100"}`

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center border-b pb-2 mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
          {t("farmer.title")}
        </h2>
        <div className="flex items-center space-x-2 p-1 bg-slate-200/50 rounded-lg">
          <button
            onClick={() => setViewMode("list")}
            className={viewModeButtonClasses("list")}
            aria-label={t("farmer.listView")}
          >
            <ListIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={viewModeButtonClasses("map")}
            aria-label={t("farmer.mapView")}
          >
            <MapIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setView("offersFeed")}
            className="ml-4 px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
          >
            View Offers Feed
          </button>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-xl">
              <h3 className="text-xl font-semibold mb-4 text-slate-700">{t("farmer.postDemandTitle")}</h3>
              <p className="text-sm text-slate-600 mb-4">{t("farmer.postDemandDescription")}</p>
              <button
                onClick={() => setView("postDemand")}
                className="w-full text-white font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
              >
                {t("farmer.postDemandButton")}
              </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-xl">
              <h3 className="text-xl font-semibold mb-4 text-slate-700">{t("farmer.myDemandsTitle")}</h3>
              {loading ? (
                <p>{t("farmer.loadingDemands")}</p>
              ) : (
                <ul className="space-y-4">
                  {demands.map((demand) => (
                    <li key={demand._id} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-slate-800">{demand.requiredService}</p>
                        {getStatusChip(demand.status)}
                      </div>
                      <p className="text-sm text-slate-500">
                        {new Date(demand.requiredTimeSlot.start).toLocaleDateString()} -{" "}
                        {new Date(demand.requiredTimeSlot.end).toLocaleDateString()}
                      </p>
                      <button
                        onClick={() => handleViewMatches(demand._id)}
                        className="mt-2 text-sm text-white bg-sky-500 hover:bg-sky-600 px-3 py-1 rounded-md disabled:bg-slate-400 disabled:cursor-not-allowed shadow-sm transition-colors"
                        disabled={demand.status !== DemandStatus.Open}
                        aria-label={
                          demand.status !== DemandStatus.Open
                            ? t("farmer.viewMatchesNotOpenAria")
                            : `${t("farmer.viewMatchesAria")} ${demand.requiredService}`
                        }
                      >
                        {t("farmer.viewMatchesButton")}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-xl">
            <h3 className="text-xl font-semibold mb-4 text-slate-700">
              {selectedDemand
                ? `${t("farmer.matchesTitle")} "${selectedDemand.requiredService}"`
                : t("farmer.matchesPlaceholder")}
            </h3>
            {selectedDemand &&
              (!matches[selectedDemand._id] ? (
                <p>{t("farmer.loadingMatches")}</p>
              ) : matches[selectedDemand._id].length === 0 ? (
                <p>{t("farmer.noMatches")}</p>
              ) : (
                <div className="space-y-4">
                  {matches[selectedDemand._id].map((offer) => (
                    <div key={offer._id} className="p-4 border rounded-lg bg-emerald-50/50 border-emerald-200">
                      <p className="font-bold text-lg text-emerald-800">{offer.providerName}</p>
                      <p className="font-medium text-slate-700">{offer.equipmentType}</p>
                      <p className="text-sm text-slate-600">{offer.description}</p>
                      <p className="text-sm font-semibold text-slate-800 mt-2">
                        {t("farmer.rateLabel")} ${offer.priceRate}/hr
                      </p>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-xl">
          <h3 className="text-xl font-semibold mb-4 text-slate-700">{t("farmer.localOffersTitle")}</h3>
          {loading ? (
            <p>{t("farmer.loadingDemands")}</p>
          ) : localOffers.length === 0 ? (
            <p>{t("farmer.noLocalOffers")}</p>
          ) : (
            currentUser && (
              <Map
                center={[currentUser.location.coordinates[1], currentUser.location.coordinates[0]]}
                markers={getMapMarkers()}
              />
            )
          )}
        </div>
      )}
    </div>
  )
}

export default FarmerDashboard
