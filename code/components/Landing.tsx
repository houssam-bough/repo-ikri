"use client"

import React from 'react'
import Link from 'next/link'
import { SetAppView } from '@/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type LandingProps = {
  setView?: SetAppView
}

export default function Landing({ setView }: LandingProps) {
  const openRegister = () => {
    if (setView) return setView('auth:register')
    // fallback: dispatch event (Header listens for this)
    window.dispatchEvent(new CustomEvent('ikri:openAuth', { detail: { tab: 'register' } }))
  }

  const openLogin = () => {
    if (setView) return setView('auth:login')
    window.dispatchEvent(new CustomEvent('ikri:openAuth', { detail: { tab: 'login' } }))
  }

  return (
    <div data-ikri-landing className="min-h-screen flex flex-col">
      <style dangerouslySetInnerHTML={{ __html: `
        [data-ikri-landing] {
          --ikri-green: #164e2a; /* deep earthy green */
          --ikri-gold: #b77a2f; /* warm gold/brown */
          --ikri-cream: #fbf9f6; /* off-white background */
        }
      `}} />

      <div className="bg-[color:var(--ikri-cream)]">
        <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md" style={{ backgroundColor: 'var(--ikri-green)' }} />
            <div>
              <div className="text-xl font-bold" style={{ color: 'var(--ikri-green)' }}>IKRI</div>
              <div className="text-xs text-muted-foreground">Agricultural Platform</div>
            </div>
          </div>
          <nav className="flex items-center gap-3">
            <button onClick={openLogin} className="text-sm text-foreground hover:underline">Sign in</button>
            <Button variant="default" onClick={openRegister} className="bg-[color:var(--ikri-gold)] text-white">Get Started</Button>
          </nav>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-12">
          {/* Hero */}
          <section className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight" style={{ color: 'var(--ikri-green)' }}>
                IKRI Agricultural Platform
              </h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-xl">
                Connect farmers and service providers with secure, geo-aware matching and time slot coordination — built for agriculture.
              </p>

              <div className="mt-6 flex gap-3">
                <Button onClick={openRegister} className="bg-[color:var(--ikri-green)] text-white">Get Started</Button>
                <a href="#features" className="inline-flex items-center text-sm underline text-[color:var(--ikri-green)]">Learn More</a>
              </div>
            </div>

            <div className="rounded-lg shadow-xl bg-white overflow-hidden">
              <div className="p-8">
                <img src="/images/landing-hero.jpg" alt="farm landscape" className="w-full h-64 object-cover rounded-md" />
              </div>
            </div>
          </section>

          {/* Three-column features */}
          <section id="features" className="mt-16">
            <h2 className="text-2xl font-semibold text-center" style={{ color: 'var(--ikri-green)' }}>How IKRI helps</h2>
            <div className="mt-8 grid md:grid-cols-3 gap-6">
              <FeatureCard title="Service Providers" icon={<IconGear />} className="bg-white">
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  <li>Connect with nearby farmers</li>
                  <li>Manage availability and pricing</li>
                  <li>Secure, verified bookings</li>
                </ul>
              </FeatureCard>

              <FeatureCard title="Farmers" icon={<IconFarm />} className="bg-white">
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  <li>Find trusted equipment & services</li>
                  <li>Geo-matched providers in your area</li>
                  <li>Transparent time-slot and pricing</li>
                </ul>
              </FeatureCard>

              <FeatureCard title="Verified & Secure" icon={<IconShield />} className="bg-white">
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  <li>Identity & approval checks</li>
                  <li>Secure local matching flow</li>
                  <li>Activity logs and history</li>
                </ul>
              </FeatureCard>
            </div>
          </section>

          {/* Key features */}
          <section className="mt-16 grid md:grid-cols-2 gap-6 items-start">
            <div className="p-6 bg-white rounded-lg shadow-sm flex gap-4 items-start">
              <IconMap className="h-8 w-8 text-[color:var(--ikri-gold)]" />
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--ikri-green)' }}>Geo-Location Matching</h3>
                <p className="text-sm text-muted-foreground">Automatically match farmers with providers operating within the required service area.</p>
              </div>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-sm flex gap-4 items-start">
              <IconClock className="h-8 w-8 text-[color:var(--ikri-gold)]" />
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--ikri-green)' }}>Time Slot Matching</h3>
                <p className="text-sm text-muted-foreground">Coordinate availability with precise time-slot matching to avoid conflicts and delays.</p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="mt-16 bg-[color:var(--ikri-green)] text-white rounded-lg p-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold">Ready to streamline farm services?</h3>
              <p className="text-sm mt-1 text-[color:rgba(255,255,255,0.9)]">Create your account and start matching today.</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={openRegister} className="bg-[color:var(--ikri-gold)] text-[color:var(--ikri-green)]">Create Your Account</Button>
            </div>
          </section>

          <footer className="mt-8 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} IKRI Agricultural Platform. All rights reserved.</footer>
        </main>
      </div>
    </div>
  )
}

function FeatureCard({ title, icon, children, className = '' }: { title: string; icon: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('p-6 rounded-lg shadow-sm', className)}>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-md flex items-center justify-center bg-[color:var(--ikri-green)] text-white">{icon}</div>
        <h4 className="font-semibold">{title}</h4>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  )
}

function IconGear() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M19.4 15a1.9 1.9 0 0 0 .3 2l.1.1a1 1 0 0 1 .2 1.1l-.6 1.1a1 1 0 0 1-1 .5l-1.3-.2a1.9 1.9 0 0 0-1.7.7l-.8.9a1 1 0 0 1-1.2.3l-1.4-.7a1.9 1.9 0 0 0-2.2 0l-1.4.7a1 1 0 0 1-1.2-.3l-.8-.9a1.9 1.9 0 0 0-1.7-.7L3.7 20a1 1 0 0 1-1-.5L2.1 18.4a1 1 0 0 1 .2-1.1l.1-.1a1.9 1.9 0 0 0 .3-2l-.3-1.5a1 1 0 0 1 .5-1l1.1-.6a1.9 1.9 0 0 0 .9-1.6V6.2a1 1 0 0 1 .9-1h1.3a1.9 1.9 0 0 0 1.6-.9l.6-1.1a1 1 0 0 1 1-.5h1.6a1 1 0 0 1 1 .5l.6 1.1a1.9 1.9 0 0 0 1.6.9h1.3a1 1 0 0 1 .9 1v1.3c0 .6.4 1.2.9 1.6l1.1.6a1 1 0 0 1 .5 1l-.3 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  )
}

function IconFarm() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 11l9-7 9 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 11v8h14v-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  )
}

function IconShield() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3l7 3v5c0 5-3.6 9.7-7 11-3.4-1.3-7-6-7-11V6l7-3z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  )
}

function IconMap(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6l6-2 6 2 6-2v13l-6 2-6-2-6 2V6z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  )
}

function IconClock(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  )
}
