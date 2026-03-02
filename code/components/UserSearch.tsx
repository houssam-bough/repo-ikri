"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { User } from "../types"
import { UserRole } from "../types"
import { searchUsersByName } from "../services/apiService"
import { useLanguage } from "../hooks/useLanguage"
import { Button } from '@/components/ui/button'

interface UserSearchProps {
  currentUser: User
  onBack: () => void
  setView?: (view: 'messages') => void
}

const UserSearch: React.FC<UserSearchProps> = ({ currentUser, onBack, setView }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const { t } = useLanguage()

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setHasSearched(false)
      return
    }

    setLoading(true)
    setHasSearched(true)
    try {
      const results = await searchUsersByName(searchQuery)
      // Filter out the current user from results
      setSearchResults(results.filter(user => user._id !== currentUser._id))
    } catch (error) {
      console.error("Search error:", error)
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const getRoleBadgeColor = (role: UserRole) => {
    return role === UserRole.Admin 
      ? 'bg-purple-100 text-purple-800'
      : 'bg-green-100 text-green-800'
  }

  return (
    <div className="bg-linear-to-br from-purple-50 via-white to-violet-50 p-3 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 md:py-8">

        {/* Hero Header */}
        <div className="mb-4 md:mb-8">
          <div className="bg-linear-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-2xl p-5 md:p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10">
              <span className="text-[120px] md:text-[200px]">🔍</span>
            </div>
            <div className="relative z-10">
              <h1 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2">
                {t('common.searchUsers')}
              </h1>
              <p className="text-blue-100 text-sm md:text-lg">
                {t('common.enterNameToSearch')}
              </p>
              <Button
                onClick={onBack}
                className="mt-3 px-4 py-2 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-xl hover:bg-white/30 transition-all text-sm"
              >
                {t('common.backToDashboard')}
              </Button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-xl border mb-4 md:mb-8">
          <div className="flex gap-2 md:gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('common.searchByUserName')}
              className="flex-1 min-w-0 px-3 md:px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-slate-50 text-sm md:text-base"
            />
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="px-4 md:px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 text-sm md:text-base"
            >
              {loading ? t('common.searching') : t('common.search')}
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-xl border">
          <h3 className="text-lg md:text-xl font-semibold mb-4 text-slate-700">
            {hasSearched ? `${t('common.searchResults')} (${searchResults.length})` : t('common.enterNameToSearch')}
          </h3>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-slate-500">{t('common.searching')}</p>
            </div>
          ) : hasSearched && searchResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-lg text-slate-600">{t('common.noUsersFound')} "{searchQuery}"</p>
              <p className="text-sm mt-2 text-slate-400">{t('common.tryDifferentSearch')}</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-3">
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors gap-3"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 ${
                      user.role === UserRole.Admin ? 'bg-linear-to-br from-purple-400 to-violet-500' : 'bg-linear-to-br from-emerald-400 to-teal-500'
                    }`}>
                      {user.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800">{user.name}</p>
                      <p className="text-sm text-slate-500 truncate">{user.email}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                        {user.phone && (
                          <span className="text-xs text-slate-400">📞 {user.phone}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      sessionStorage.setItem('messageTarget', JSON.stringify({ 
                        userId: user._id, 
                        userName: user.name 
                      }));
                      if (setView) {
                        setView('messages');
                      } else {
                        window.location.href = '/?view=messages';
                      }
                    }}
                    className="px-5 py-2.5 bg-linear-to-r from-purple-500 to-violet-500 text-white rounded-xl hover:shadow-lg transition-all text-sm shrink-0"
                  >
                    💬 {t('common.contactUser')}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-lg text-slate-400">{t('common.startSearching')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserSearch
