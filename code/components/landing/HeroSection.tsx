"use client"

import { motion } from 'framer-motion'
import { CheckCircle2, ArrowRight, Play } from 'lucide-react'
import { SetAppView } from '@/types'
import { useLanguage } from '@/hooks/useLanguage'

interface HeroSectionProps {
  setView: SetAppView
}

export default function HeroSection({ setView }: HeroSectionProps) {
  const { t } = useLanguage()

  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-orange-50/40" />
      
      {/* Animated Blobs */}
      <motion.div
        className="absolute top-20 right-0 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-green-300/30 to-green-500/20 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-orange-300/20 to-accent/20 blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 10, repeat: Infinity, delay: 1 }}
      />

      {/* Floating Particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-green-400 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [-30, 0, -30],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 5 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Column - Content */}
          <div className="space-y-6">
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 border border-green-300/50 rounded-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[13px] font-[700] text-green-800 tracking-[0.5px] uppercase">
                {t('landing.badge')}
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              className="text-[56px] font-[900] leading-[1.1] tracking-[-1px] text-primary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              {t('landing.title')}
            </motion.h1>

            {/* Description */}
            <motion.p
              className="text-[19px] leading-[1.8] text-green-800/90 max-w-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              {t('landing.subtitle')}
            </motion.p>

            {/* Benefits List */}
            <motion.div
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              {[t('landing.benefit1'), t('landing.benefit2'), t('landing.benefit3')].map((benefit) => (
                <div key={benefit} className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-[15px] font-[600] text-green-800">{benefit}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-wrap gap-4 pt-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <motion.button
                onClick={() => setView('auth:register')}
                className="group relative overflow-hidden px-8 py-4 bg-gradient-to-r from-primary to-green-700 text-white text-[17px] font-[700] rounded-xl shadow-xl hover:shadow-2xl transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-green-700 to-primary"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                />
                <span className="relative flex items-center gap-2">
                  {t('landing.getStartedFree')}
                  <motion.span whileHover={{ x: 4 }}>
                    <ArrowRight className="w-5 h-5" />
                  </motion.span>
                </span>
              </motion.button>

              <motion.button
                className="group flex items-center gap-3 px-8 py-4 bg-white hover:bg-green-50 border-2 border-green-200 hover:border-primary/40 text-[17px] font-[700] text-primary rounded-xl transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  className="w-10 h-10 bg-gradient-to-br from-accent to-orange-600 rounded-full flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                >
                  <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                </motion.div>
                {t('landing.watchDemo')}
              </motion.button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              className="flex items-center gap-8 pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex -space-x-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 border-2 border-white"
                  />
                ))}
              </div>
              <div>
                <p className="text-[16px] font-[700] text-primary">{t('landing.activeUsers')}</p>
                <p className="text-[13px] text-green-700/70">Trusted across Morocco</p>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Image with 3D Effects */}
          <div className="relative">
            {/* Floating Cards */}
            <motion.div
              className="absolute -left-4 top-20 z-20 bg-white p-4 rounded-2xl shadow-2xl border border-green-100"
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-[14px] font-[700] text-primary">Verified Provider</p>
                  <p className="text-[12px] text-green-700/70">CMI Secured</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="absolute -right-4 bottom-32 z-20 bg-white p-4 rounded-2xl shadow-2xl border border-orange-100"
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-accent to-orange-600 rounded-2xl flex items-center justify-center">
                  <span className="text-[16px] font-[700] text-white">24h</span>
                </div>
                <div>
                  <p className="text-[14px] font-[700] text-primary">Fast Response</p>
                  <p className="text-[12px] text-orange-700/70">Quick Matching</p>
                </div>
              </div>
            </motion.div>

            {/* Main Image Container */}
            <motion.div
              className="relative"
              whileHover={{ scale: 1.02, rotateY: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              {/* Shadow Layer */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-green-400/40 to-orange-400/40 rounded-3xl blur-2xl translate-y-4"
                whileHover={{ scale: 1.05 }}
              />
              
              {/* Image Frame */}
              <div className="relative bg-white rounded-3xl shadow-2xl border-4 border-white overflow-hidden">
                <div className="aspect-[4/3] relative">
                  <img
                    src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80"
                    alt="Tractor in field"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-green-900/20 to-transparent" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
