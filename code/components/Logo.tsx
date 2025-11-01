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
    <div className={`flex items-center space-x-4 ${className}`}>
      <div className="w-16 h-16">
        <Image src="/ikri-logo.png" alt="IKRI Logo" width={64} height={64} className="w-full h-full object-contain" />
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold text-emerald-800">IKRI</span>
        <span className="text-sm font-medium text-emerald-600">Agriculture &amp; Services</span>
      </div>
    </div>
  )
}

export default Logo
