"use client"

import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react'
import { SetAppView } from '@/types'
import { useLanguage } from '@/hooks/useLanguage'

interface CTABannerProps {
  setView: SetAppView
}

export default function CTABanner({ setView }: CTABannerProps) {
  const { t } = useLanguage()

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Base Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-green-700 to-green-900" />
      
      {/* Animated Stripe Pattern */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 30px, rgba(255,255,255,0.1) 30px, rgba(255,255,255,0.1) 60px)',
          backgroundSize: '60px 60px',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      />

      {/* Static SVG Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="plus-cta" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M30 25 L30 35 M25 30 L35 30" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#plus-cta)" />
        </svg>
      </div>

      {/* Floating Particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 bg-white rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [-50, 0, -50],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 5 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* Animated Blobs */}
      <motion.div
        className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/30 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-green-300/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{ duration: 10, repeat: Infinity, delay: 1 }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-5 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-[13px] font-[700] text-white tracking-[0.5px] uppercase">
              {t('landing.ctaBadge')}
            </span>
            <Sparkles className="w-4 h-4 text-yellow-300" />
          </motion.div>

          {/* Heading */}
          <motion.h2
            className="text-[52px] font-[900] tracking-[-1px] text-white leading-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            {t('landing.ctaTitle')}
          </motion.h2>

          {/* Description */}
          <motion.p
            className="text-[19px] leading-[1.8] text-green-100 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            {t('landing.ctaDescription')}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-wrap justify-center gap-4 pt-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <motion.button
              onClick={() => setView('auth:register')}
              className="group relative overflow-hidden px-10 py-5 bg-white hover:bg-green-50 text-primary text-[17px] font-[700] rounded-2xl shadow-2xl hover:shadow-3xl transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.span
                className="absolute inset-0 bg-gradient-to-r from-green-50 to-transparent"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
              />
              <span className="relative flex items-center gap-2">
                {t('landing.createYourAccount')}
                <motion.span whileHover={{ x: 4 }}>
                  <ArrowRight className="w-5 h-5" />
                </motion.span>
              </span>
            </motion.button>

            <motion.button
              className="px-10 py-5 bg-transparent hover:bg-white/10 border-2 border-white/40 hover:border-white text-white text-[17px] font-[700] rounded-2xl backdrop-blur-sm shadow-lg transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              {t('landing.contactSales')}
            </motion.button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            className="flex flex-wrap justify-center gap-8 pt-8 text-white/80"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
          >
            {[t('landing.noCredit'), t('landing.freeTrial'), t('landing.cancelAnytime')].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-300" />
                <span className="text-[14px] font-[600]">{item}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
