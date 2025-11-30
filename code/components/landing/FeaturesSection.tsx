"use client"

import { motion } from 'motion/react'
import { Tractor, Users, ShieldCheck, MapPin, Clock, ArrowRight } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'

export default function FeaturesSection() {
  const { t } = useLanguage()

  const features = [
    {
      icon: Tractor,
      iconGradient: 'from-green-500 to-green-600',
      bgGradient: 'from-green-50 to-green-100',
      accent: 'bg-green-500',
      title: t('landing.feature1Title'),
      description: t('landing.feature1Description'),
    },
    {
      icon: Users,
      iconGradient: 'from-accent to-orange-600',
      bgGradient: 'from-orange-50 to-orange-100',
      accent: 'bg-accent',
      title: t('landing.feature2Title'),
      description: t('landing.feature2Description'),
    },
    {
      icon: ShieldCheck,
      iconGradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      accent: 'bg-blue-500',
      title: t('landing.feature3Title'),
      description: t('landing.feature3Description'),
    },
    {
      icon: MapPin,
      iconGradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
      accent: 'bg-purple-500',
      title: t('landing.feature4Title'),
      description: t('landing.feature4Description'),
    },
    {
      icon: Clock,
      iconGradient: 'from-teal-500 to-teal-600',
      bgGradient: 'from-teal-50 to-teal-100',
      accent: 'bg-teal-500',
      title: t('landing.feature5Title'),
      description: t('landing.feature5Description'),
    },
  ]

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-green-50/30 to-white" />
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="plus" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M30 25 L30 35 M25 30 L35 30" stroke="#22c55e" strokeWidth="1" opacity="0.05" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#plus)" />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 border border-green-300/50 rounded-full"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[13px] font-[700] text-green-800 tracking-[0.5px] uppercase">
              {t('landing.featuresSubtitle')}
            </span>
          </motion.div>

          <motion.h2
            className="text-[48px] font-[900] tracking-[-1px] text-primary"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {t('landing.featuresTitle')}
          </motion.h2>

          <motion.p
            className="text-[19px] leading-[1.7] text-green-800/70 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            A complete platform designed to streamline agricultural equipment services across Morocco and beyond
          </motion.p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                className={`group relative p-8 bg-gradient-to-br ${feature.bgGradient} border border-white rounded-3xl shadow-lg hover:shadow-2xl transition-all cursor-pointer`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
              >
                {/* Accent Line */}
                <motion.div
                  className={`absolute top-0 left-0 right-0 h-1 ${feature.accent} origin-left rounded-t-3xl`}
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.5 }}
                />

                {/* Icon Container */}
                <div className="relative mb-6">
                  <motion.div
                    className={`w-16 h-16 bg-gradient-to-br ${feature.iconGradient} rounded-2xl shadow-lg flex items-center justify-center`}
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </motion.div>
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.iconGradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity`}
                  />
                </div>

                {/* Content */}
                <h3 className="text-[22px] font-[700] text-primary group-hover:text-green-900 mb-3 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-[15px] leading-[1.7] text-green-800/80">{feature.description}</p>

                {/* Hover Arrow */}
                <motion.div
                  className="absolute bottom-8 right-8 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={{ opacity: 0, x: -10 }}
                  whileHover={{ opacity: 1, x: 0 }}
                >
                  <ArrowRight className="w-5 h-5 text-primary" />
                </motion.div>
              </motion.div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-[16px] text-green-800/70">Want to see how it works?</p>
          <motion.button
            className="group px-8 py-4 bg-white hover:bg-primary border-2 border-primary text-primary hover:text-white text-[16px] font-[700] rounded-xl transition-colors"
            whileHover={{ scale: 1.05 }}
          >
            {t('landing.exploreAllFeatures')}
            <motion.span
              className="inline-block ml-2"
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.span>
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}
