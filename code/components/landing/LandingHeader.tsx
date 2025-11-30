"use client"

import { useState, useEffect } from 'react'
import { Sprout, Menu, X } from 'lucide-react'
import { motion } from 'motion/react'
import { useLanguage } from '@/hooks/useLanguage'
import { SetAppView } from '@/types'

interface LandingHeaderProps {
  setView: SetAppView
}

export default function LandingHeader({ setView }: LandingHeaderProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { language, setLanguage, t } = useLanguage()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en')
  }

  const openLogin = () => {
    setView('auth:login')
  }

  const openRegister = () => {
    setView('auth:register')
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-20 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-lg border-b border-green-200/50 shadow-lg'
          : 'bg-gradient-to-r from-green-50 to-green-100/80 backdrop-blur-sm border-b border-green-200/30'
      }`}
    >
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo Section */}
        <motion.div
          className="flex items-center gap-3 cursor-pointer"
          whileHover={{ scale: 1.02 }}
          animate={{ scale: scrolled ? 0.95 : 1 }}
        >
          <motion.div
            className="w-12 h-12 bg-gradient-to-br from-primary to-green-700 rounded-xl shadow-md flex items-center justify-center"
            whileHover={{ scale: 1.1, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
          >
            <motion.div whileHover={{ rotate: 12 }}>
              <Sprout className="w-7 h-7 text-white" />
            </motion.div>
          </motion.div>
          <div className="flex flex-col">
            <span className="text-[22px] font-[800] text-primary tracking-[-0.5px]">IKRI</span>
            <span className="text-[11px] font-[600] text-green-700 tracking-[0.5px] leading-none">
              AGRICULTURE & SERVICES
            </span>
          </div>
        </motion.div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-3">
          <button
            onClick={toggleLanguage}
            className="group relative px-4 py-2 text-[14px] font-[700] text-green-700 hover:text-primary hover:bg-green-100/60 rounded-lg transition-all"
          >
            {language.toUpperCase()}
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 group-hover:w-3/4 h-0.5 bg-primary transition-all duration-300" />
          </button>
          
          <button
            onClick={openLogin}
            className="px-5 py-2.5 text-[14px] font-[700] text-primary hover:bg-green-100/60 rounded-lg transition-colors"
          >
            {t('landing.login')}
          </button>
          
          <motion.button
            onClick={openRegister}
            className="relative overflow-hidden px-6 py-2.5 bg-gradient-to-r from-accent to-orange-600 text-white text-[14px] font-[700] rounded-lg shadow-md hover:shadow-xl transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.span
              className="absolute inset-0 bg-gradient-to-r from-orange-600 to-accent"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            <span className="relative">{t('landing.register')}</span>
          </motion.button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          className="md:hidden border-t border-green-200/50 bg-white/95 backdrop-blur-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
            <button
              onClick={toggleLanguage}
              className="w-full px-4 py-2 text-[14px] font-[700] text-green-700 hover:bg-green-100/60 rounded-lg transition-colors text-left"
            >
              {language.toUpperCase()}
            </button>
            <button
              onClick={openLogin}
              className="w-full px-4 py-2 text-[14px] font-[700] text-primary hover:bg-green-100/60 rounded-lg transition-colors text-left"
            >
              {t('landing.login')}
            </button>
            <button
              onClick={openRegister}
              className="w-full px-4 py-2 bg-gradient-to-r from-accent to-orange-600 text-white text-[14px] font-[700] rounded-lg text-left"
            >
              {t('landing.register')}
            </button>
          </div>
        </motion.div>
      )}
    </header>
  )
}
