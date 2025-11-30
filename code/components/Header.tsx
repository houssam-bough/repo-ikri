"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useLanguage } from "@/hooks/useLanguage"
import { Sprout, Menu, X, User } from "lucide-react"
import UserIcon from "./icons/UserIcon"
import LogoutIcon from "./icons/LogoutIcon"
import ProfileIcon from "./icons/ProfileIcon"
import NotificationBell from "./NotificationBell"
import { motion, AnimatePresence } from "motion/react"
import { SetAppView } from '@/types'

interface HeaderProps {
  setView: SetAppView
}

const Header: React.FC<HeaderProps> = ({ setView }) => {
  const { currentUser, logout } = useAuth()
  const { language, setLanguage, t } = useLanguage()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "fr" : "en")
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-lg shadow-lg'
          : 'bg-linear-to-r from-green-50 to-green-100/80 backdrop-blur-sm border-b border-green-200/30'
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="h-20 flex items-center justify-between">
          {/* Logo */}
          <motion.div
            onClick={() => setView("dashboard")}
            className="flex items-center gap-3 cursor-pointer"
            whileHover={{ scale: 1.02 }}
          >
            <div
              className="w-12 h-12 bg-linear-to-br from-primary to-green-700 rounded-xl shadow-md flex items-center justify-center"
            >
              <Sprout className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[22px] font-extrabold text-primary tracking-[-0.5px]">IKRI</span>
              <span className="text-[11px] font-semibold text-green-700 tracking-[0.5px] leading-none">
                Agricultural Platform
              </span>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-2">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="group relative px-4 py-2 text-[14px] font-bold text-green-700 hover:text-primary hover:bg-green-100/60 rounded-lg transition-all"
            >
              <span className="relative">
                {language.toUpperCase()}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </span>
            </button>

            {!currentUser && (
              <>
                {/* Login Button */}
                <button
                  onClick={() => {
                    setView('auth:login')
                    try {
                      window.dispatchEvent(new CustomEvent('ikri:openAuth', { detail: { tab: 'login' } }))
                    } catch (e) {}
                  }}
                  className="px-5 py-2.5 text-[14px] font-bold text-primary hover:bg-green-100/60 rounded-lg transition-colors"
                >
                  {t('auth.loginTab')}
                </button>

                {/* Register Button */}
                <motion.button
                  onClick={() => {
                    setView('auth:register')
                    try {
                      window.dispatchEvent(new CustomEvent('ikri:openAuth', { detail: { tab: 'register' } }))
                    } catch (e) {}
                  }}
                  className="relative overflow-hidden px-6 py-2.5 bg-linear-to-r from-accent to-orange-600 text-white text-[14px] font-bold rounded-lg shadow-md hover:shadow-xl transition-all"
                  whileHover={{ scale: 1.05 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-linear-to-r from-orange-600 to-accent"
                    initial={{ x: '100%' }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                  <span className="relative z-10">{t('auth.registerTab')}</span>
                </motion.button>
              </>
            )}

            {currentUser && (
              <>
                {/* Notification Bell */}
                <NotificationBell />

                {/* User Info */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50/80 border border-green-200/50">
                  <UserIcon className="w-5 h-5 text-green-700" />
                  <span className="text-sm text-green-900 font-semibold">{currentUser.name}</span>
                  <span className="text-xs text-green-700 bg-green-200/60 px-2 py-0.5 rounded-full font-bold">
                    {currentUser.role}
                  </span>
                </div>

                {/* Profile Button */}
                <button
                  onClick={() => setView("profile")}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-green-700 text-white text-[14px] font-bold rounded-lg shadow-sm hover:shadow-md transition-all"
                  aria-label="Edit Profile"
                >
                  <ProfileIcon className="w-5 h-5" />
                  <span>{t("header.profile")}</span>
                </button>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-[14px] font-bold rounded-lg shadow-sm hover:shadow-md transition-all"
                  aria-label="Logout"
                >
                  <LogoutIcon className="w-5 h-5" />
                  <span>{t("header.logout")}</span>
                </button>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-primary hover:bg-green-100/60 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-green-200/30 overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4 space-y-2">
              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="w-full px-4 py-2 text-[14px] font-bold text-green-700 hover:bg-green-100/60 rounded-lg transition-colors text-left"
              >
                {language.toUpperCase()}
              </button>

              {!currentUser && (
                <>
                  <button
                    onClick={() => {
                      setView('auth:login')
                      setMobileMenuOpen(false)
                      try {
                        window.dispatchEvent(new CustomEvent('ikri:openAuth', { detail: { tab: 'login' } }))
                      } catch (e) {}
                    }}
                    className="w-full px-4 py-2 text-[14px] font-bold text-primary hover:bg-green-100/60 rounded-lg transition-colors text-left"
                  >
                    {t('auth.loginTab')}
                  </button>
                  <button
                    onClick={() => {
                      setView('auth:register')
                      setMobileMenuOpen(false)
                      try {
                        window.dispatchEvent(new CustomEvent('ikri:openAuth', { detail: { tab: 'register' } }))
                      } catch (e) {}
                    }}
                    className="w-full px-4 py-2 bg-linear-to-r from-accent to-orange-600 text-white text-[14px] font-bold rounded-lg text-left"
                  >
                    {t('auth.registerTab')}
                  </button>
                </>
              )}

              {currentUser && (
                <>
                  <div className="px-4 py-2 bg-green-50/80 rounded-lg border border-green-200/50">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-5 h-5 text-green-700" />
                      <span className="text-sm text-green-900 font-semibold">{currentUser.name}</span>
                      <span className="text-xs text-green-700 bg-green-200/60 px-2 py-0.5 rounded-full font-bold">
                        {currentUser.role}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setView("profile")
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 bg-primary text-white text-[14px] font-bold rounded-lg text-left"
                  >
                    <ProfileIcon className="w-5 h-5" />
                    <span>{t("header.profile")}</span>
                  </button>
                  <button
                    onClick={() => {
                      logout()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-[14px] font-bold rounded-lg text-left"
                  >
                    <LogoutIcon className="w-5 h-5" />
                    <span>{t("header.logout")}</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Header
