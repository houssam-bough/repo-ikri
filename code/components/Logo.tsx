import type React from "react"
import Image from "next/image"

interface LogoProps {
  variant?: "full" | "icon"
  className?: string
}

const Logo: React.FC<LogoProps> = ({ variant = "full", className = "" }) => {
  if (variant === "icon") {
    return (
      <div className={`w-10 h-10 ${className}`}>
        <Image src="/ikri-logo.png" alt="IKRI Logo" width={40} height={40} className="w-full h-full object-contain" />
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="w-12 h-12">
        <Image src="/ikri-logo.png" alt="IKRI Logo" width={48} height={48} className="w-full h-full object-contain" />
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold text-emerald-800">IKRI</span>
        <span className="text-xs font-medium text-emerald-600">Agriculture &amp; Services</span>
      </div>
    </div>
  )
}

export default Logo
