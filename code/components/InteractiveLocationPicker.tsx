"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import "leaflet/dist/leaflet.css"
import { Button } from '@/components/ui/button'
import { getCityCoordinatesMap } from '../constants/majorCities'
import { useLanguage } from '@/hooks/useLanguage'

interface InteractiveLocationPickerProps {
  initialLat: number
  initialLon: number
  onLocationChange: (lat: number, lon: number) => void
  city?: string
}

const InteractiveLocationPicker: React.FC<InteractiveLocationPickerProps> = ({
  initialLat,
  initialLon,
  onLocationChange,
  city
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [L, setL] = useState<any>(null)
  const { t } = useLanguage()
  const [currentLat, setCurrentLat] = useState(initialLat)
  const [currentLon, setCurrentLon] = useState(initialLon)
  const [isGeolocating, setIsGeolocating] = useState(false)
  const [hasUserMoved, setHasUserMoved] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet").then((L) => {
        setL(L.default)
      })
    }
  }, [])

  // Update internal state when props change
  useEffect(() => {
    setCurrentLat(initialLat)
    setCurrentLon(initialLon)
    // Reset hasUserMoved when coordinates change from parent (city selection)
    if (Math.abs(initialLat - currentLat) > 0.01 || Math.abs(initialLon - currentLon) > 0.01) {
      setHasUserMoved(false)
    }
  }, [initialLat, initialLon])

  // Update map center when coordinates change
  useEffect(() => {
    if (mapRef.current && markerRef.current && L) {
      const currentZoom = mapRef.current.getZoom();
      mapRef.current.setView([currentLat, currentLon], currentZoom)
      markerRef.current.setLatLng([currentLat, currentLon])
    }
  }, [currentLat, currentLon, L])

  useEffect(() => {
    if (!L || !mapContainerRef.current) return

    if (mapRef.current) {
      mapRef.current.remove()
    }

    mapRef.current = L.map(mapContainerRef.current, {
      center: [currentLat, currentLon],
      zoom: 13,
      layers: [
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        })
      ]
    })

    // Custom draggable marker icon
    const markerIcon = L.divIcon({
      className: "custom-marker",
      html: `<div style="
        width: 32px;
        height: 32px;
        background-color: #059669;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: move;
      "></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })

    // Add draggable marker
    markerRef.current = L.marker([currentLat, currentLon], {
      icon: markerIcon,
      draggable: true
    }).addTo(mapRef.current)

    // Update coordinates when marker is dragged
    markerRef.current.on('dragend', (e: any) => {
      const position = e.target.getLatLng()
      setCurrentLat(position.lat)
      setCurrentLon(position.lng)
      onLocationChange(position.lat, position.lng)
      setHasUserMoved(true) // Prevent auto-recentering after user drags
    })

    // Allow clicking on map to move marker
    mapRef.current.on('click', (e: any) => {
      const { lat, lng } = e.latlng
      markerRef.current.setLatLng([lat, lng])
      setCurrentLat(lat)
      setCurrentLon(lng)
      onLocationChange(lat, lng)
      setHasUserMoved(true) // Prevent auto-recentering after user clicks
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [L])

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      alert(t('misc.geoNotAvailable'))
      return
    }

    setIsGeolocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lon = position.coords.longitude
        
        setCurrentLat(lat)
        setCurrentLon(lon)
        onLocationChange(lat, lon)

        if (mapRef.current) {
          mapRef.current.setView([lat, lon], 15)
        }
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lon])
        }
        
        setIsGeolocating(false)
      },
      (error) => {
        console.error('Geolocation error:', error)
        alert(t('misc.geoError'))
        setIsGeolocating(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    )
  }

  return (
    <div>
      {/* Map */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-[280px] relative z-0"
      />
      
      {/* Bottom bar */}
      <div className="bg-gray-50 px-4 py-2.5 border-t border-gray-200 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            <span className="font-mono font-semibold text-[#4C9A2A]">{currentLat.toFixed(4)}</span>
            <span className="mx-1.5 text-gray-300">|</span>
            <span className="font-mono font-semibold text-[#4C9A2A]">{currentLon.toFixed(4)}</span>
          </p>
          <Button
            type="button"
            onClick={handleGeolocate}
            disabled={isGeolocating}
            className="shrink-0 px-3 py-1.5 bg-[#4C9A2A] hover:bg-[#3d8422] text-white rounded-lg transition-all text-xs font-semibold disabled:opacity-50"
          >
            {isGeolocating ? t('misc.locating') : t('misc.useMyLocation')}
          </Button>
        </div>
        <p className="text-[11px] text-gray-400">{t('misc.dragMarkerInstruction')}</p>
      </div>
    </div>
  )
}

export default InteractiveLocationPicker
