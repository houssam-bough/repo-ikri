"use client"

import React from 'react'
import { SetAppView } from '@/types'
import LandingHeader from './landing/LandingHeader'
import HeroSection from './landing/HeroSection'
import StatsSection from './landing/StatsSection'
import FeaturesSection from './landing/FeaturesSection'
import HowItWorksSection from './landing/HowItWorksSection'
import CTABanner from './landing/CTABanner'
import LandingFooter from './landing/LandingFooter'

type LandingProps = {
  setView?: SetAppView
}

export default function Landing({ setView }: LandingProps) {
  const defaultSetView: SetAppView = setView || (() => {})

  return (
    <div className="min-h-screen bg-[#fdfcf9]">
      <LandingHeader setView={defaultSetView} />
      <main className="pt-1">
        <HeroSection setView={defaultSetView} />
        <StatsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CTABanner setView={defaultSetView} />
      </main>
      <LandingFooter />
    </div>
  )
}
