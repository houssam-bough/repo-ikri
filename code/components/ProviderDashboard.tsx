"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../hooks/useAuth"
import { useLanguage } from "../hooks/useLanguage"
import { Button } from '@/components/ui/button'
import { type Demand, type Offer, OfferStatus } from "../types"
import { getOffersForProvider, findLocalDemands } from "../services/apiService"
import DynamicMap, { type MapMarker } from "./DynamicMap"
import ListIcon from "./icons/ListIcon"
import MapIcon from "./icons/MapIcon"

import { SetAppView } from '../types'

interface ProviderDashboardProps {
  setView: SetAppView
}

const ProviderDashboard: React.FC<ProviderDashboardProps> = ({ setView }) => {
  const { currentUser } = useAuth()
  const { t } = useLanguage()
  const [offers, setOffers] = useState<Offer[]>([])
  const [localDemands, setLocalDemands] = useState<Demand[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"list" | "map">("list")

  const fetchData = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      const [providerOffers, demands] = await Promise.all([
        getOffersForProvider(currentUser._id),
        findLocalDemands(currentUser.location),
      ])
      setOffers(providerOffers)
      setLocalDemands(demands)
    } catch (error) {
      console.error("Failed to fetch provider data:", error)
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getStatusChip = (status: OfferStatus) => {
    const statusText = {
      [OfferStatus.Pending]: t("status.pending"),
      [OfferStatus.Approved]: t("status.approved"),
      [OfferStatus.Rejected]: t("status.rejected"),
    }[status]

    const statusColor = {
      [OfferStatus.Pending]: "bg-amber-100 text-amber-800",
      [OfferStatus.Approved]: "bg-emerald-100 text-emerald-800",
      [OfferStatus.Rejected]: "bg-rose-100 text-rose-800",
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

    const demandMarkers: MapMarker[] = localDemands.map((demand) => ({
      position: [demand.jobLocation.coordinates[1], demand.jobLocation.coordinates[0]],
      popupContent: `<strong>${demand.requiredService}</strong><br/>From: ${demand.farmerName}<br/>Needed: ${new Date(demand.requiredTimeSlot.start).toLocaleDateString()} - ${new Date(demand.requiredTimeSlot.end).toLocaleDateString()}`,
      type: "demand",
    }))

    return [userMarker, ...demandMarkers]
  }

  const viewModeButtonClasses = (mode: "list" | "map") =>
    `p-2 rounded-lg transition-all duration-300 shadow-sm ${viewMode === mode ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg" : "bg-white text-slate-600 hover:bg-slate-100"}`

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center border-b pb-2 mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
          {t("provider.title")}
        </h2>
        <div className="flex items-center space-x-2 p-1 bg-slate-200/50 rounded-lg">
          <Button
            onClick={() => setViewMode("list")}
            className={viewModeButtonClasses("list")}
            aria-label={t("provider.listView")}
          >
            <ListIcon className="w-5 h-5" />
          </Button>
          <Button
            onClick={() => setViewMode("map")}
            className={viewModeButtonClasses("map")}
            aria-label={t("provider.mapView")}
          >
            <MapIcon className="w-5 h-5" />
          </Button>
          <Button
            onClick={() => setView("demandsFeed")}
            className="ml-4 px-3 py-2 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-lg transition-all text-sm font-medium"
          >
            View Demands Feed
          </Button>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-xl">
              <h3 className="text-xl font-semibold mb-4 text-slate-700">{t("provider.postOfferTitle")}</h3>
              <p className="text-sm text-slate-600 mb-4">{t("provider.postOfferDescription")}</p>
              <Button
                onClick={() => setView("postOffer")}
                className="w-full text-white font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 rounded-lg shadow-md transition-all duration-300"
              >
                {t("provider.postOfferButton")}
              </Button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-xl">
              <h3 className="text-xl font-semibold mb-4 text-slate-700">{t("provider.myOffersTitle")}</h3>
              {loading ? (
                <p>{t("provider.loadingOffers")}</p>
              ) : (
                <ul className="space-y-3">
                  {offers.map((offer) => (
                    <li key={offer._id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-slate-800">{offer.equipmentType}</p>
                        {getStatusChip(offer.status)}
                      </div>
                      <p className="text-sm text-slate-500">${offer.priceRate}/hr</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-xl">
            <h3 className="text-xl font-semibold mb-4 text-slate-700">{t("provider.localDemandsTitle")}</h3>
            {loading ? (
              <p>{t("provider.loadingDemands")}</p>
            ) : localDemands.length === 0 ? (
              <p>{t("provider.noLocalDemands")}</p>
            ) : (
              <div className="space-y-4">
                {localDemands.map((demand) => (
                  <div key={demand._id} className="p-4 border rounded-lg bg-sky-50/50 border-sky-200">
                    <p className="font-bold text-lg text-sky-800">{demand.requiredService}</p>
                    <p className="font-medium text-slate-700">
                      {t("provider.demandFrom")}: {demand.farmerName}
                    </p>
                    <p className="text-sm text-slate-600">
                      {t("provider.demandNeeded")}: {new Date(demand.requiredTimeSlot.start).toLocaleDateString()} to{" "}
                      {new Date(demand.requiredTimeSlot.end).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-xl">
          <h3 className="text-xl font-semibold mb-4 text-slate-700">{t("provider.localDemandsTitle")}</h3>
          {loading ? (
            <p>{t("provider.loadingDemands")}</p>
          ) : localDemands.length === 0 ? (
            <p>{t("provider.noLocalDemands")}</p>
          ) : (
            currentUser && (
              <DynamicMap
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

export default ProviderDashboard
