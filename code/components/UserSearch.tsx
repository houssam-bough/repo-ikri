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
    <div className="container mx-auto pt-16">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4 mb-6">
        <h2 className="text-3xl font-bold bg-linear-to-r from-blue-700 to-indigo-900 bg-clip-text text-transparent">
          🔍 {t('common.searchUsers')}
        </h2>
        <Button
          onClick={onBack}
          className="px-4 py-2 text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg"
        >
          {t('common.backToDashboard')}
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
        <div className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('common.searchByUserName')}
            className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          <Button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-3 bg-linear-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('common.searching') : t('common.search')}
          </Button>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold mb-4 text-slate-700">
          {hasSearched ? `${t('common.searchResults')} (${searchResults.length})` : t('common.enterNameToSearch')}
        </h3>

        {loading ? (
          <div className="text-center py-12 text-slate-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            {t('common.searching')}
          </div>
        ) : hasSearched && searchResults.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-lg">{t('common.noUsersFound')} "{searchQuery}"</p>
            <p className="text-sm mt-2">{t('common.tryDifferentSearch')}</p>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((user) => (
              <div
                key={user._id}
                className="p-5 border border-slate-200 rounded-lg hover:shadow-md transition-shadow bg-slate-50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-slate-800 mb-1">{user.name}</h4>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.role)}`}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">✉️</span>
                    <span className="truncate">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">📞</span>
                      <span>{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">📍</span>
                    <span className="text-xs">
                      {user.location.coordinates[1].toFixed(4)}, {user.location.coordinates[0].toFixed(4)}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    // Store the selected user in sessionStorage for Messages component to pick up
                    sessionStorage.setItem('messageTarget', JSON.stringify({ 
                      userId: user._id, 
                      userName: user.name 
                    }));
                    // Navigate to messages view
                    if (setView) {
                      setView('messages');
                    } else {
                      // If setView is not provided, navigate via URL
                      window.location.href = '/?view=messages';
                    }
                  }}
                  className="w-full mt-4 px-2 py-2 bg-linear-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all text-sm whitespace-normal leading-tight"
                >
                  💬 {t('common.contactUser')}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <p className="text-lg">👥 {t('common.startSearching')}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserSearch
