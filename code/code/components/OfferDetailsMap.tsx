"use client"

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'

interface OfferDetailsMapProps {
  position: [number, number]
  title: string
  city: string
}

const OfferDetailsMap: React.FC<OfferDetailsMapProps> = ({ position, title, city }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return

    const initMap = async () => {
      const L = (await import('leaflet')).default

      // Clean up existing map
      if (mapRef.current) {
        mapRef.current.remove()
      }

      // Create map
      mapRef.current = L.map(mapContainerRef.current).setView(position, 13)

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current)

      // Custom marker icon
      const markerIcon = L.divIcon({
        className: 'custom-offer-marker',
        html: `<div style="
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        ">🚜</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      })

      // Add marker
      L.marker(position, { icon: markerIcon })
        .addTo(mapRef.current)
        .bindPopup(`
          <div style="text-align: center; min-width: 150px;">
            <strong style="font-size: 14px; color: #ea580c;">${title}</strong><br/>
            <span style="font-size: 12px; color: #64748b;">${city}</span>
          </div>
        `)
        .openPopup()
    }

    initMap()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [position, title, city])

  return <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
}

export default OfferDetailsMap
