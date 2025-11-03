"use client"

import type React from "react"
import { useAuth } from "@/hooks/useAuth"
import { useLanguage } from "@/hooks/useLanguage"
import UserIcon from "./icons/UserIcon"
import LogoutIcon from "./icons/LogoutIcon"
import ProfileIcon from "./icons/ProfileIcon"
import Logo from "./Logo"
import { Button } from '@/components/ui/button'

import { SetAppView } from '@/types'

interface HeaderProps {
  setView: SetAppView
}

const Header: React.FC<HeaderProps> = ({ setView }) => {
  const { currentUser, logout } = useAuth()
  const { language, setLanguage, t } = useLanguage()

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "fr" : "en")
  }

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-white via-emerald-50 to-white/95 backdrop-blur-md shadow-lg border-b border-emerald-100/50">
      <div className="container mx-auto px-4 md:px-8 py-3 flex justify-between items-center">
        <div onClick={() => setView("dashboard")} className="cursor-pointer">
          <Logo variant="full" />
        </div>
        <div className="flex items-center space-x-3 md:space-x-6">
          <Button
            onClick={toggleLanguage}
            variant="ghost"
            size="sm"
            className="rounded-full px-3 py-1.5 text-sm font-semibold"
            aria-label={`Switch language to ${language === "en" ? "French" : "English"}`}
          >
            {language.toUpperCase()}
          </Button>
          {!currentUser && (
            <>
              <Button
                onClick={() => {
                  setView('auth:login')
                  try {
                    window.dispatchEvent(new CustomEvent('ikri:openAuth', { detail: { tab: 'login' } }))
                  } catch (e) {}
                }}
                variant="outline"
                size="default"
                className="px-3 py-2 rounded-lg text-sm font-medium"
              >
                {t('auth.loginTab')}
              </Button>
              <Button
                onClick={() => {
                  setView('auth:register')
                  try {
                    window.dispatchEvent(new CustomEvent('ikri:openAuth', { detail: { tab: 'register' } }))
                  } catch (e) {}
                }}
                variant="default"
                size="default"
                className="px-3 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white"
              >
                {t('auth.registerTab')}
              </Button>
            </>
          )}

          {currentUser && (
            <>
              <div className="hidden sm:flex items-center space-x-2 px-3 py-2 rounded-lg bg-emerald-50/80 shadow-sm">
                <UserIcon className="w-5 h-5 text-emerald-700" />
                <span className="text-sm text-emerald-900 font-medium">{currentUser.name}</span>
                <span className="text-xs text-emerald-600 bg-emerald-200/50 px-2 py-0.5 rounded-full font-semibold">
                  {currentUser.role}
                </span>
              </div>
              <Button
                onClick={() => setView("profile")}
                variant="default"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-emerald-600 text-white shadow-sm"
                aria-label="Edit Profile"
              >
                <ProfileIcon className="w-6 h-6" />
                <span className="hidden md:inline text-sm font-medium">{t("header.profile")}</span>
              </Button>
              <Button
                onClick={logout}
                variant="default"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-red-600 text-white"
                aria-label="Logout"
              >
                <LogoutIcon className="w-6 h-6" />
                <span className="hidden md:inline text-sm font-medium">{t("header.logout")}</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
