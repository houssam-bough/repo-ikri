"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import "leaflet/dist/leaflet.css"
import { Button } from '@/components/ui/button'

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
  const [currentLat, setCurrentLat] = useState(initialLat)
  const [currentLon, setCurrentLon] = useState(initialLon)
  const [isGeolocating, setIsGeolocating] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet").then((L) => {
        setL(L.default)
      })
    }
  }, [])

  // Update map center when city changes
  useEffect(() => {
    if (city && mapRef.current && L) {
      // Simple geocoding for Morocco cities (you can expand this)
      const moroccanCities: Record<string, [number, number]> = {
        'Casablanca': [33.5731, -7.5898],
        'Rabat': [34.0209, -6.8416],
        'Fès': [34.0181, -5.0078],
        'Marrakech': [31.6295, -7.9811],
        'Agadir': [30.4278, -9.5981],
        'Tanger': [35.7595, -5.8340],
        'Meknès': [33.8935, -5.5473],
        'Oujda': [34.6814, -1.9086],
        'Kenitra': [34.2610, -6.5802],
        'Tétouan': [35.5889, -5.3626],
        'Safi': [32.2994, -9.2372],
        'Mohammedia': [33.6866, -7.3833],
        'Khouribga': [32.8811, -6.9063],
        'El Jadida': [33.2316, -8.5007],
        'Béni Mellal': [32.3373, -6.3498],
        'Nador': [35.1681, -2.9333]
      }

      const coords = moroccanCities[city]
      if (coords) {
        mapRef.current.setView(coords, 13)
        setCurrentLat(coords[0])
        setCurrentLon(coords[1])
        onLocationChange(coords[0], coords[1])
        
        if (markerRef.current) {
          markerRef.current.setLatLng(coords)
        }
      }
    }
  }, [city, L, onLocationChange])

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
    })

    // Allow clicking on map to move marker
    mapRef.current.on('click', (e: any) => {
      const { lat, lng } = e.latlng
      markerRef.current.setLatLng([lat, lng])
      setCurrentLat(lat)
      setCurrentLon(lng)
      onLocationChange(lat, lng)
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
      alert("La géolocalisation n'est pas supportée par votre navigateur")
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
        alert("Impossible d'obtenir votre position. Veuillez vérifier vos autorisations.")
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">
          <p className="font-medium mb-1">📍 Cliquez sur la carte ou glissez le marqueur</p>
          <p className="text-xs">Latitude: <span className="font-mono font-semibold text-emerald-600">{currentLat.toFixed(6)}</span></p>
          <p className="text-xs">Longitude: <span className="font-mono font-semibold text-emerald-600">{currentLon.toFixed(6)}</span></p>
        </div>
        <Button
          type="button"
          onClick={handleGeolocate}
          disabled={isGeolocating}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all text-sm font-medium disabled:opacity-50"
        >
          {isGeolocating ? '📍 Localisation...' : '📍 Me localiser'}
        </Button>
      </div>
      
      <div 
        ref={mapContainerRef} 
        className="w-full h-[400px] rounded-lg overflow-hidden border-2 border-slate-200 relative z-0"
      />
      
      <p className="text-xs text-slate-500 italic">
        💡 Astuce : Vous pouvez déplacer le marqueur vert ou cliquer directement sur la carte pour ajuster votre position
      </p>
    </div>
  )
}

export default InteractiveLocationPicker
