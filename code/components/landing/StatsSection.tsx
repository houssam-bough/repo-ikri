"use client"

import { motion } from 'framer-motion'
import { Users, MapPin, TrendingUp, Shield } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'

export default function StatsSection() {
  const { t } = useLanguage()

  const stats = [
    { icon: Users, gradient: 'from-green-500 to-green-600', value: '2,500+', label: t('landing.statsActiveUsersLabel') },
    { icon: MapPin, gradient: 'from-blue-500 to-blue-600', value: '150+', label: t('landing.statsServiceAreasLabel') },
    { icon: TrendingUp, gradient: 'from-accent to-orange-600', value: '98%', label: t('landing.statsSuccessRateLabel') },
    { icon: Shield, gradient: 'from-purple-500 to-purple-600', value: '100%', label: t('landing.statsSecurePaymentsLabel') },
  ]

  return (
    <section className="relative py-16 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-green-700 to-green-900" />
      
      {/* Pattern Overlay */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="circles" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="2" fill="white" />
              <circle cx="50" cy="50" r="3" fill="white" />
              <circle cx="80" cy="30" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circles)" />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <motion.div
                  className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${stat.gradient} rounded-2xl shadow-lg flex items-center justify-center`}
                  initial={{ scale: 0.5 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 + 0.2, type: 'spring', stiffness: 200 }}
                  whileHover={{ scale: 1.1 }}
                >
                  <Icon className="w-8 h-8 text-white" />
                </motion.div>
                <motion.p
                  className="text-[36px] font-[900] text-white mb-1"
                  initial={{ scale: 0.5 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 + 0.3, type: 'spring' }}
                >
                  {stat.value}
                </motion.p>
                <p className="text-[14px] font-[600] text-green-200">{stat.label}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
