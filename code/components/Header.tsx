"use client"

import type React from "react"
import { useAuth } from "@/hooks/useAuth"
import { useLanguage } from "@/hooks/useLanguage"
import UserIcon from "./icons/UserIcon"
import LogoutIcon from "./icons/LogoutIcon"
import ProfileIcon from "./icons/ProfileIcon"
import Logo from "./Logo"

interface HeaderProps {
  setView: (view: "dashboard" | "profile" | "postDemand" | "postOffer") => void
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
          <button
            onClick={toggleLanguage}
            className="text-sm font-semibold text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200 border border-emerald-300 rounded-full px-4 py-1.5 transition-all duration-200 shadow-sm"
            aria-label={`Switch language to ${language === "en" ? "French" : "English"}`}
          >
            {language.toUpperCase()}
          </button>
          {currentUser && (
            <>
              <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-emerald-50/80 rounded-lg">
                <UserIcon className="w-5 h-5 text-emerald-700" />
                <span className="text-sm text-emerald-900 font-medium">{currentUser.name}</span>
                <span className="text-xs text-emerald-600 bg-emerald-200/50 px-2 py-0.5 rounded-full font-semibold">
                  {currentUser.role}
                </span>
              </div>
              <button
                onClick={() => setView("profile")}
                className="flex items-center space-x-2 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100/50 px-3 py-2 rounded-lg transition-all duration-200"
                aria-label="Edit Profile"
              >
                <ProfileIcon className="w-6 h-6" />
                <span className="hidden md:inline text-sm font-medium">{t("header.profile")}</span>
              </button>
              <button
                onClick={logout}
                className="flex items-center space-x-2 text-emerald-700 hover:text-red-700 hover:bg-red-50/50 px-3 py-2 rounded-lg transition-all duration-200"
                aria-label="Logout"
              >
                <LogoutIcon className="w-6 h-6" />
                <span className="hidden md:inline text-sm font-medium">{t("header.logout")}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
