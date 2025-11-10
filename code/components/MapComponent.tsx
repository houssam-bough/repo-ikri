"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import "leaflet/dist/leaflet.css"

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

const MapComponent: React.FC<MapProps> = ({ center, markers, zoom = 13, draggableMarkerPosition, onMarkerDragEnd }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [L, setL] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet").then((L) => {
        setL(L.default)
      })
    }
  }, [])

  const getMarkerIcon = (type: "user" | "offer" | "demand") => {
    if (!L) return null
    const color = type === "user" ? "#059669" : type === "offer" ? "#0284c7" : "#ea580c"
    return L.divIcon({
      className: "flex items-center justify-center",
      html: `<div class="w-4 h-4 bg-white rounded-full border-2" style="border-color: ${color}"></div>`,
      iconSize: [16, 16],
    })
  }

  useEffect(() => {
    if (!L || !mapContainerRef.current) return

    if (mapRef.current) {
      mapRef.current.remove()
    }

    mapRef.current = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      layers: [
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        })
      ]
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [L, center, zoom])

  useEffect(() => {
    if (!L || !mapRef.current) return

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      if (marker && marker.remove) {
        marker.remove()
      }
    })
    markersRef.current = []

    // Function to create and add a marker
    const createMarker = (position: [number, number], icon: any, popupContent?: string, isDraggable = false) => {
      try {
        const marker = L.marker(position, { icon, draggable: isDraggable })
        marker.addTo(mapRef.current)
        if (popupContent) {
          marker.bindPopup(popupContent)
        }
        return marker
      } catch (error) {
        console.error('Error creating marker:', error)
        return null
      }
    }

    // Add new markers
    markers.forEach((markerData) => {
      const icon = getMarkerIcon(markerData.type)
      if (icon) {
        const marker = createMarker(markerData.position, icon, markerData.popupContent)
        if (marker) {
          markersRef.current.push(marker)
        }
      }
    })

    // Add draggable marker if position is provided
    if (draggableMarkerPosition) {
      const icon = getMarkerIcon("user")
      if (icon) {
        const marker = createMarker(draggableMarkerPosition, icon, undefined, true)
        if (marker && onMarkerDragEnd) {
          marker.on("dragend", (e: any) => {
            const position = e.target.getLatLng()
            onMarkerDragEnd([position.lat, position.lng])
          })
        }
        if (marker) {
          markersRef.current.push(marker)
        }
      }
    }

    return () => {
      markersRef.current.forEach((marker) => {
        if (marker && marker.remove) {
          marker.remove()
        }
      })
      markersRef.current = []
    }
  }, [L, markers, draggableMarkerPosition, onMarkerDragEnd])

  return <div ref={mapContainerRef} className="w-full h-[400px] rounded-lg overflow-hidden relative z-0" />
}

export default MapComponent