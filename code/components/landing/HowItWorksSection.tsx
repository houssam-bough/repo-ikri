"use client"

import { motion } from 'framer-motion'
import { Search, CheckSquare, Handshake, Star, ChevronRight } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'

export default function HowItWorksSection() {
  const { t } = useLanguage()

  const steps = [
    {
      icon: Search,
      gradient: 'from-green-500 to-green-600',
      title: t('landing.step1Title'),
      description: t('landing.step1Description'),
    },
    {
      icon: CheckSquare,
      gradient: 'from-blue-500 to-blue-600',
      title: t('landing.step2Title'),
      description: t('landing.step2Description'),
    },
    {
      icon: Handshake,
      gradient: 'from-accent to-orange-600',
      title: t('landing.step3Title'),
      description: t('landing.step3Description'),
    },
    {
      icon: Star,
      gradient: 'from-purple-500 to-purple-600',
      title: t('landing.step4Title'),
      description: t('landing.step4Description'),
    },
  ]

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-white" />
      
      {/* Background Decorations */}
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-gradient-to-br from-green-100/50 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-orange-100/50 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 border border-orange-300/50 rounded-full"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            <span className="text-[13px] font-[700] text-orange-800 tracking-[0.5px] uppercase">
              SIMPLE PROCESS
            </span>
          </motion.div>

          <motion.h2
            className="text-[48px] font-[900] tracking-[-1px] text-primary"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {t('landing.howItWorksTitle')}
          </motion.h2>

          <motion.p
            className="text-[19px] leading-[1.7] text-green-800/70 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            {t('landing.howItWorksSubtitle')}
          </motion.p>
        </div>

        {/* Steps Container */}
        <div className="max-w-6xl mx-auto relative">
          {/* Connection Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-green-200 via-orange-200 to-purple-200 -translate-y-1/2" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.title}
                  className="relative z-10 bg-white p-8 rounded-2xl border-2 border-gray-100 hover:border-primary/30 shadow-lg hover:shadow-2xl transition-all"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                >
                  {/* Number Badge */}
                  <div className="absolute -top-4 -right-4 w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 border-4 border-white rounded-full shadow-lg flex items-center justify-center">
                    <span className="text-[18px] font-[900] text-primary">
                      0{index + 1}
                    </span>
                  </div>

                  {/* Icon */}
                  <motion.div
                    className={`w-16 h-16 bg-gradient-to-br ${step.gradient} rounded-2xl shadow-lg flex items-center justify-center mb-6`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </motion.div>

                  {/* Content */}
                  <h3 className="text-[20px] font-[700] text-primary mb-3">{step.title}</h3>
                  <p className="text-[14px] leading-[1.7] text-green-800/70">{step.description}</p>

                  {/* Arrow Connector (Desktop, not on last card) */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-6 bg-white border-2 border-green-300 rounded-full -translate-y-1/2">
                      <ChevronRight className="w-3 h-3 text-green-600 ml-0.5" />
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
