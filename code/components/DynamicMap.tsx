import dynamic from 'next/dynamic'
import type { MapMarker } from './MapComponent'

const LoadingMap = () => (
  <div className="w-full h-[400px] rounded-lg overflow-hidden bg-slate-100 animate-pulse flex items-center justify-center">
    <div className="text-center">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
      <p className="text-slate-500">Loading map...</p>
    </div>
  </div>
)

const DynamicMap = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: LoadingMap,
})

export type { MapMarker }
export default DynamicMap