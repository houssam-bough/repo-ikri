"use client"

import { Sprout, Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLanguage } from '@/hooks/useLanguage'

export default function LandingFooter() {
  const { t } = useLanguage()

  const footerLinks = {
    product: [t('landing.productFeatures'), t('landing.productPricing'), t('landing.productDemo'), t('landing.productUpdates')],
    company: [t('landing.companyAbout'), t('landing.companyBlog'), t('landing.companyCareers'), t('landing.companyContact')],
    legal: [t('landing.legalPrivacy'), t('landing.legalTerms'), t('landing.legalSecurity'), t('landing.legalCompliance')],
    support: [t('landing.supportHelp'), t('landing.supportDocs'), t('landing.supportCommunity'), t('landing.supportStatus')],
  }

  return (
    <footer className="relative bg-gradient-to-br from-green-950 via-green-900 to-green-950 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="footer-circles" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="2" fill="white" />
              <circle cx="50" cy="50" r="3" fill="white" />
              <circle cx="80" cy="30" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#footer-circles)" />
        </svg>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-16 lg:py-20 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-accent to-orange-600 rounded-2xl shadow-xl flex items-center justify-center">
                <Sprout className="w-8 h-8 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[24px] font-[800] tracking-[-0.5px]">YKRI</span>
                <span className="text-[12px] font-[600] text-green-300 tracking-[0.5px] leading-none">
                  AGRICULTURE & SERVICES
                </span>
              </div>
            </div>

            <p className="text-[15px] leading-[1.7] text-green-200/80 max-w-xs">
              {t('landing.footerDescription')}
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-green-200/80 text-[14px]">
                <Mail className="w-4 h-4" />
                <span>{t('landing.footerEmail')}</span>
              </div>
              <div className="flex items-center gap-3 text-green-200/80 text-[14px]">
                <Phone className="w-4 h-4" />
                <span>{t('landing.footerPhone')}</span>
              </div>
              <div className="flex items-center gap-3 text-green-200/80 text-[14px]">
                <MapPin className="w-4 h-4" />
                <span>{t('landing.footerLocation')}</span>
              </div>
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-[16px] font-[700] mb-4">{t('landing.productTitle')}</h3>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-[14px] text-green-200/70 hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-[16px] font-[700] mb-4">{t('landing.companyTitle')}</h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-[14px] text-green-200/70 hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-[16px] font-[700] mb-4">{t('landing.legalTitle')}</h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-[14px] text-green-200/70 hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-[16px] font-[700] mb-4">{t('landing.supportTitle')}</h3>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-[14px] text-green-200/70 hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-green-800/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-[14px] text-green-300/70">
              {t('landing.footerCopyright')}
            </p>

            <div className="flex gap-3">
              {[
                { icon: Facebook, href: '#' },
                { icon: Twitter, href: '#' },
                { icon: Instagram, href: '#' },
                { icon: Linkedin, href: '#' },
              ].map((social, index) => {
                const Icon = social.icon
                return (
                  <motion.a
                    key={index}
                    href={social.href}
                    className="w-10 h-10 bg-green-800/50 hover:bg-accent rounded-xl flex items-center justify-center transition-colors"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="w-5 h-5 text-green-300 group-hover:text-white" />
                  </motion.a>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
