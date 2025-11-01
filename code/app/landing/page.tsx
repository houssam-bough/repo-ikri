import type React from "react"
import Link from "next/link"

const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-amber-50/30 text-slate-800">
      <h1 className="text-5xl font-bold mb-8">Welcome to Ikri</h1>
      <p className="text-xl mb-12 text-center max-w-2xl">
        Your platform for connecting farmers and providers.
      </p>
      <Link
        href="/main"
        className="px-8 py-4 bg-emerald-500 text-white font-bold rounded-full hover:bg-emerald-600 transition-colors"
      >
        Get Started
      </Link>
    </div>
  )
}

export default LandingPage
