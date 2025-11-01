"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import L from "leaflet"

export interface MapMarker {
  position: [number, number]
  popupContent: string
  type: "user" | "offer" | "demand"
}

interface MapProps {
  center: [number, number]
  markers: MapMarker[]
  zoom?: number
  draggableMarkerPosition?: [number, number]
  onMarkerDragEnd?: (position: [number, number]) => void
}

const Map: React.FC<MapProps> = ({ center, markers, zoom = 11, draggableMarkerPosition, onMarkerDragEnd }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any | null>(null)
  const markersRef = useRef<any[]>([])
  const draggableMarkerRef = useRef<any | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    const checkLeafletLoaded = () => {
      if (typeof window !== "undefined" && window.L) {
        setIsReady(true)
      } else {
        setTimeout(checkLeafletLoaded, 100)
      }
    }
    checkLeafletLoaded()
  }, [])

  const createIcon = (type: MapMarker["type"]) => {
    const colors = {
      user: "#059669",
      offer: "#f59e0b",
      demand: "#3b82f6",
    }
    const color = colors[type]

    return L.divIcon({
      html: `<div style="background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); width: 32px; height: 32px; border-radius: 50%; display: flex; justify-content: center; align-items: center; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.25); font-weight: bold; color: white; font-size: 14px;">📍</div>`,
      className: "map-marker",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    })
  }

  useEffect(() => {
    if (!isReady || !mapContainerRef.current || mapRef.current) return

    try {
      mapRef.current = L.map(mapContainerRef.current).setView(center, zoom)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapRef.current)
      setMapLoaded(true)
    } catch (error) {
      console.error("[v0] Error initializing map:", error)
    }
  }, [isReady, center, zoom])

  useEffect(() => {
    if (mapRef.current && mapLoaded) {
      mapRef.current.setView(center, mapRef.current.getZoom(), {
        animate: true,
        pan: { duration: 0.5 },
      })
    }
  }, [center, mapLoaded])

  useEffect(() => {
    if (mapRef.current && mapLoaded) {
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
      markers.forEach((markerData) => {
        const icon = createIcon(markerData.type)
        if (icon) {
          const marker = L.marker(markerData.position, { icon })
            .addTo(mapRef.current)
            .bindPopup(markerData.popupContent)
          markersRef.current.push(marker)
        }
      })
    }
  }, [markers, mapLoaded])

  useEffect(() => {
    if (mapRef.current && mapLoaded && draggableMarkerPosition) {
      if (draggableMarkerRef.current) {
        draggableMarkerRef.current.setLatLng(draggableMarkerPosition)
      } else {
        const icon = createIcon("user")
        if (icon) {
          const marker = L.marker(draggableMarkerPosition, {
            icon,
            draggable: true,
            zIndexOffset: 1000,
          }).addTo(mapRef.current)

          if (onMarkerDragEnd) {
            marker.on("dragend", (event: any) => {
              const { lat, lng } = event.target.getLatLng()
              onMarkerDragEnd([lat, lng])
            })
          }
          draggableMarkerRef.current = marker
        }
      }
    }
  }, [draggableMarkerPosition, onMarkerDragEnd, mapLoaded])

  return (
    <div
      ref={mapContainerRef}
      style={{ height: "500px", width: "100%" }}
      className="relative z-10 rounded-2xl shadow-xl border border-emerald-100/50 overflow-hidden"
      title="Map for location selection"
    />
  )
}

export default Map
