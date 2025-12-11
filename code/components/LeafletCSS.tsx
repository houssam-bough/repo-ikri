'use client'

import { useEffect } from 'react'

export function LeafletCSS() {
  useEffect(() => {
    // Dynamically import Leaflet CSS only on client side
    import('leaflet/dist/leaflet.css')
  }, [])

  return null
}
