"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useLanguage } from "@/hooks/useLanguage"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Litige, Message, SetAppView } from "@/types"
import { UserRole } from "@/types"
import { getLitigesForClient, getLitigesForPrestataire, getAllLitiges, decideLitige, getConversationBetweenUsers } from "@/services/apiService"
import { ArrowLeft, Plus, Scale, Clock, CheckCircle2, XCircle, AlertTriangle, User, Wrench, Calendar, Banknote, Mail, Phone, MessageSquare, ChevronDown, ChevronUp, Image, Mic, Paperclip } from "lucide-react"

interface MyLitigesProps {
  setView: SetAppView
}

type FilterStatus = 'all' | 'en_cours' | 'clos_client' | 'clos_prestataire'

const MyLitiges: React.FC<MyLitigesProps> = ({ setView }) => {
  const { t, language } = useLanguage()
  const { currentUser } = useAuth()
  const [litiges, setLitiges] = useState<Litige[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>('all')
  const [expandedLitige, setExpandedLitige] = useState<string | null>(null)
  const [conversationMap, setConversationMap] = useState<Record<string, Message[]>>({})
  const [loadingConversation, setLoadingConversation] = useState<string | null>(null)

  const isAdmin = currentUser?.role === UserRole.Admin
  const isProvider = currentUser?.role === UserRole.Provider || 
    (currentUser?.role === UserRole.Both && currentUser?.activeMode === 'Provider')

  const fetchLitiges = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      let result: Litige[] = []
      if (isAdmin) {
        result = await getAllLitiges()
      } else {
        // Fetch litiges where user is client AND where user is prestataire, then merge & deduplicate
        const [asClient, asPrestataire] = await Promise.all([
          getLitigesForClient(currentUser._id),
          getLitigesForPrestataire(currentUser._id),
        ])
        const merged = [...asClient, ...asPrestataire]
        // Deduplicate by _id
        const seen = new Set<string>()
        result = merged.filter(l => {
          if (seen.has(l._id)) return false
          seen.add(l._id)
          return true
        })
      }
      setLitiges(result)
    } catch (error) {
      console.error("Failed to fetch litiges:", error)
    } finally {
      setLoading(false)
    }
  }, [currentUser, isAdmin])

  useEffect(() => {
    fetchLitiges()
  }, [fetchLitiges])

  const filteredLitiges = selectedStatus === 'all'
    ? litiges
    : litiges.filter(l => l.statut === selectedStatus)

  const getMotifLabel = (motif: string): string => {
    const map: Record<string, string> = {
      no_show: t('litiges.motifNoShow'),
      retard: t('litiges.motifRetard'),
      materiel_defectueux: t('litiges.motifMaterielDefectueux'),
      autre: t('litiges.motifAutre'),
    }
    return map[motif] || motif
  }

  const getMotifIcon = (motif: string): string => {
    const map: Record<string, string> = {
      no_show: '🚫',
      retard: '⏰',
      materiel_defectueux: '🔧',
      autre: '📋',
    }
    return map[motif] || '❓'
  }

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'en_cours':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 rounded-full">
            <Clock className="w-3 h-3 mr-1" />
            {t('litiges.statusEnCours')}
          </Badge>
        )
      case 'clos_client':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 rounded-full">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {t('litiges.statusClosClient')}
          </Badge>
        )
      case 'clos_prestataire':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 rounded-full">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {t('litiges.statusClosPrestataire')}
          </Badge>
        )
      default:
        return <Badge>{statut}</Badge>
    }
  }

  const handleAdminDecision = async (litigeId: string, decision: 'client' | 'prestataire') => {
    const confirmMsg = `${t('litiges.adminDecideFor')} ${decision === 'client' ? t('litiges.client') : t('litiges.prestataire')}?`
    if (!confirm(confirmMsg)) return

    try {
      const result = await decideLitige(litigeId, decision)
      if (result) {
        alert(t('litiges.decisionSuccess'))
        fetchLitiges()
      } else {
        alert(t('litiges.decisionError'))
      }
    } catch (error) {
      console.error("Error deciding litige:", error)
      alert(t('litiges.decisionError'))
    }
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString(
      language === 'ar' ? 'ar-MA' : 'fr-FR',
      { day: 'numeric', month: 'short', year: 'numeric' }
    )
  }

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString(
      language === 'ar' ? 'ar-MA' : 'fr-FR',
      { hour: '2-digit', minute: '2-digit' }
    )
  }

  const toggleExpand = async (litige: Litige) => {
    const id = litige._id
    if (expandedLitige === id) {
      setExpandedLitige(null)
      return
    }
    setExpandedLitige(id)

    // Load conversation if admin and not already loaded
    if (isAdmin && !conversationMap[id]) {
      setLoadingConversation(id)
      try {
        const messages = await getConversationBetweenUsers(litige.clientId, litige.prestataireId)
        setConversationMap(prev => ({ ...prev, [id]: messages }))
      } catch (error) {
        console.error("Error loading conversation:", error)
        setConversationMap(prev => ({ ...prev, [id]: [] }))
      } finally {
        setLoadingConversation(null)
      }
    }
  }

  const statusFilters: { key: FilterStatus; label: string; count: number }[] = [
    { key: 'all', label: t('common.all'), count: litiges.length },
    { key: 'en_cours', label: t('litiges.statusEnCours'), count: litiges.filter(l => l.statut === 'en_cours').length },
    { key: 'clos_client', label: t('litiges.statusClosClient'), count: litiges.filter(l => l.statut === 'clos_client').length },
    { key: 'clos_prestataire', label: t('litiges.statusClosPrestataire'), count: litiges.filter(l => l.statut === 'clos_prestataire').length },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#4C9A2A]/5 via-orange-50/30 to-white px-4 py-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-[#4C9A2A]/20 border-t-[#4C9A2A] mx-auto mb-3" />
          <p className="text-gray-500 text-sm">{t('litiges.loadingLitiges')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#4C9A2A]/5 via-orange-50/30 to-white px-4 py-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setView("dashboard")}
              variant="outline"
              size="sm"
              className="rounded-xl border-gray-300 text-gray-600"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold text-[#4C9A2A] font-heading flex items-center gap-2">
              <Scale className="w-6 h-6" />
              {t('litiges.myLitiges')}
            </h1>
          </div>
          {/* Open litige button — only for farmers */}
          {!isAdmin && !isProvider && (
            <Button
              onClick={() => setView('openLitige')}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl shadow-md"
            >
              <Plus className="w-4 h-4 mr-1" />
              {t('litiges.openLitige')}
            </Button>
          )}
        </div>

        {/* Status filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {statusFilters.map(filter => (
            <button
              key={filter.key}
              onClick={() => setSelectedStatus(filter.key)}
              className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${
                selectedStatus === filter.key
                  ? 'bg-[#4C9A2A] text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>

        {/* Empty state */}
        {filteredLitiges.length === 0 ? (
          <Card className="rounded-2xl border border-gray-100 shadow-sm">
            <CardContent className="p-8 text-center">
              <div className="text-5xl mb-4">⚖️</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {selectedStatus === 'all' ? t('litiges.noLitiges') : t('litiges.noFilteredLitiges')}
              </h3>
              <p className="text-gray-500 text-sm mb-4">{t('litiges.noLitigesDesc')}</p>
              {!isAdmin && !isProvider && (
                <Button
                  onClick={() => setView('openLitige')}
                  className="bg-[#4C9A2A] hover:bg-[#3d7d22] text-white rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {t('litiges.openLitige')}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredLitiges.map(litige => {
              const isExpanded = expandedLitige === litige._id
              const conversation = conversationMap[litige._id]
              const isLoadingConv = loadingConversation === litige._id

              return (
              <Card key={litige._id} className="rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                {/* Status bar on top */}
                <div className={`h-1.5 ${
                  litige.statut === 'en_cours' ? 'bg-amber-400' :
                  litige.statut === 'clos_client' ? 'bg-emerald-500' :
                  'bg-blue-500'
                }`} />

                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getMotifIcon(litige.motif)}</span>
                      <div>
                        <CardTitle className="text-base font-semibold text-gray-800">
                          {getMotifLabel(litige.motif)}
                        </CardTitle>
                        {litige.reservation && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {litige.reservation.equipmentType}
                          </p>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(litige.statut)}
                  </div>
                </CardHeader>

                <CardContent className="px-4 pb-4 space-y-3">
                  {/* Description preview */}
                  <p className="text-sm text-gray-600 line-clamp-2">{litige.description}</p>

                  {/* Info grid */}
                  <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-gray-500">
                        <User className="w-3.5 h-3.5" />
                        {isProvider || isAdmin ? t('litiges.client') : t('litiges.prestataire')}
                      </span>
                      <span className="font-medium text-gray-800">
                        {isProvider || isAdmin ? litige.clientName : litige.prestataireName}
                      </span>
                    </div>
                    {/* Show both parties for admin */}
                    {isAdmin && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-gray-500">
                          <Wrench className="w-3.5 h-3.5" />
                          {t('litiges.prestataire')}
                        </span>
                        <span className="font-medium text-gray-800">
                          {litige.prestataireName}
                        </span>
                      </div>
                    )}
                    {litige.reservation && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-gray-500">
                            <Calendar className="w-3.5 h-3.5" />
                            {t('litiges.period')}
                          </span>
                          <span className="font-medium text-gray-800 text-xs">
                            {formatDate(litige.reservation.reservedTimeSlot.start)}
                            {' → '}
                            {formatDate(litige.reservation.reservedTimeSlot.end)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-gray-500">
                            <Banknote className="w-3.5 h-3.5" />
                            {t('litiges.amount')}
                          </span>
                          <span className="font-bold text-[#4C9A2A]">
                            {litige.reservation.totalCost || litige.reservation.priceRate} MAD
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        {t('litiges.opened')}
                      </span>
                      <span className="text-gray-700 text-xs">{formatDate(litige.dateOuverture)}</span>
                    </div>
                    {litige.dateCloture && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-gray-500">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {t('litiges.closed')}
                        </span>
                        <span className="text-gray-700 text-xs">{formatDate(litige.dateCloture)}</span>
                      </div>
                    )}
                  </div>

                  {/* Preuves thumbnails */}
                  {litige.preuves && litige.preuves.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {(litige.preuves as string[]).map((preuve, idx) => (
                        <img
                          key={idx}
                          src={preuve}
                          alt={`Preuve ${idx + 1}`}
                          className="w-16 h-16 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                        />
                      ))}
                    </div>
                  )}

                  {/* Decision / Funds blocked */}
                  {litige.statut === 'en_cours' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-800 text-xs">{t('litiges.fundsBlocked')}</p>
                        <p className="text-amber-700 text-[11px] mt-0.5">{t('litiges.pendingDecision')}</p>
                      </div>
                    </div>
                  )}

                  {/* Decision display */}
                  {litige.decisionIKRI && (
                    <div className={`rounded-xl p-3 flex gap-2 ${
                      litige.decisionIKRI === 'client'
                        ? 'bg-emerald-50 border border-emerald-200'
                        : 'bg-blue-50 border border-blue-200'
                    }`}>
                      <Scale className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                        litige.decisionIKRI === 'client' ? 'text-emerald-600' : 'text-blue-600'
                      }`} />
                      <div>
                        <p className={`font-medium text-xs ${
                          litige.decisionIKRI === 'client' ? 'text-emerald-800' : 'text-blue-800'
                        }`}>
                          {t('litiges.decision')}
                        </p>
                        <p className={`text-[11px] mt-0.5 ${
                          litige.decisionIKRI === 'client' ? 'text-emerald-700' : 'text-blue-700'
                        }`}>
                          {litige.decisionIKRI === 'client'
                            ? t('litiges.decisionClient')
                            : t('litiges.decisionPrestataire')
                          }
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ====== ADMIN: Expand/Collapse button ====== */}
                  {isAdmin && (
                    <button
                      onClick={() => toggleExpand(litige)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {isExpanded ? t('litiges.collapseDetails') : t('litiges.expandDetails')}
                    </button>
                  )}

                  {/* ====== ADMIN EXPANDED: Contact Info + Conversation ====== */}
                  {isAdmin && isExpanded && (
                    <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">

                      {/* ---- Contact Info Section ---- */}
                      <div className="border border-purple-200 rounded-xl overflow-hidden">
                        <div className="bg-purple-50 px-3 py-2 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-semibold text-purple-800">{t('litiges.contactInfo')}</span>
                        </div>
                        <div className="p-3 space-y-3">
                          {/* Client contact */}
                          <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-emerald-700 mb-2 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5" />
                              {t('litiges.client')} — {litige.clientName}
                            </p>
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-xs">
                                <Mail className="w-3.5 h-3.5 text-gray-400" />
                                <a href={`mailto:${litige.clientEmail}`} className="text-blue-600 underline break-all">
                                  {litige.clientEmail || '—'}
                                </a>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <Phone className="w-3.5 h-3.5 text-gray-400" />
                                {litige.clientPhone ? (
                                  <a href={`tel:${litige.clientPhone}`} className="text-blue-600 underline">
                                    {litige.clientPhone}
                                  </a>
                                ) : (
                                  <span className="text-gray-400 italic">{t('litiges.noPhone')}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Prestataire contact */}
                          <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1.5">
                              <Wrench className="w-3.5 h-3.5" />
                              {t('litiges.prestataire')} — {litige.prestataireName}
                            </p>
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-xs">
                                <Mail className="w-3.5 h-3.5 text-gray-400" />
                                <a href={`mailto:${litige.prestataireEmail}`} className="text-blue-600 underline break-all">
                                  {litige.prestataireEmail || '—'}
                                </a>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <Phone className="w-3.5 h-3.5 text-gray-400" />
                                {litige.prestatairePhone ? (
                                  <a href={`tel:${litige.prestatairePhone}`} className="text-blue-600 underline">
                                    {litige.prestatairePhone}
                                  </a>
                                ) : (
                                  <span className="text-gray-400 italic">{t('litiges.noPhone')}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ---- Conversation Section ---- */}
                      <div className="border border-indigo-200 rounded-xl overflow-hidden">
                        <div className="bg-indigo-50 px-3 py-2 flex items-center justify-between">
                          <span className="text-sm font-semibold text-indigo-800 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-indigo-600" />
                            {t('litiges.conversationBetween')}
                          </span>
                          {conversation && (
                            <span className="text-[11px] text-indigo-500 font-medium bg-indigo-100 px-2 py-0.5 rounded-full">
                              {conversation.length} {t('litiges.messagesCount')}
                            </span>
                          )}
                        </div>

                        <div className="p-3">
                          {isLoadingConv ? (
                            <div className="flex items-center justify-center py-6">
                              <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-200 border-t-indigo-600 mr-2" />
                              <span className="text-sm text-indigo-500">{t('litiges.loadingConversation')}</span>
                            </div>
                          ) : conversation && conversation.length > 0 ? (
                            <div className="max-h-80 overflow-y-auto space-y-2 pr-1" style={{ scrollbarWidth: 'thin' }}>
                              {conversation.map((msg, idx) => {
                                const isClient = msg.senderId === litige.clientId
                                return (
                                  <div key={msg._id || idx} className={`flex ${isClient ? 'justify-start' : 'justify-end'}`}>
                                    <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                                      isClient
                                        ? 'bg-emerald-50 border border-emerald-200 rounded-tl-sm'
                                        : 'bg-blue-50 border border-blue-200 rounded-tr-sm'
                                    }`}>
                                      {/* Sender tag */}
                                      <p className={`text-[10px] font-bold mb-0.5 ${
                                        isClient ? 'text-emerald-600' : 'text-blue-600'
                                      }`}>
                                        {isClient ? `👤 ${litige.clientName}` : `🔧 ${litige.prestataireName}`}
                                      </p>

                                      {/* Message content */}
                                      {msg.content && (
                                        <p className="text-xs text-gray-800 whitespace-pre-wrap break-words">{msg.content}</p>
                                      )}

                                      {/* Audio message indicator */}
                                      {msg.audioUrl && (
                                        <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                                          <Mic className="w-3 h-3" />
                                          <span>{t('litiges.audioMessage')}</span>
                                          {msg.audioDuration && <span>({Math.round(msg.audioDuration)}s)</span>}
                                        </div>
                                      )}

                                      {/* File attachment */}
                                      {msg.fileUrl && (
                                        <div className="mt-1.5">
                                          {msg.fileType === 'image' ? (
                                            <img src={msg.fileUrl} alt="" className="max-w-full h-auto rounded-lg border border-gray-200 max-h-32" />
                                          ) : (
                                            <div className="flex items-center gap-1.5 text-xs text-indigo-600">
                                              <Paperclip className="w-3 h-3" />
                                              <span className="underline">{msg.fileName || t('litiges.attachment')}</span>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Timestamp */}
                                      <p className="text-[9px] text-gray-400 mt-1 text-right">
                                        {formatDate(msg.createdAt)} · {formatTime(msg.createdAt)}
                                      </p>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-6">
                              <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                              <p className="text-sm text-gray-400">{t('litiges.noConversation')}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Admin decision buttons */}
                      {litige.statut === 'en_cours' && (
                        <div className="border-t border-gray-100 pt-3 space-y-2">
                          <p className="text-xs font-medium text-gray-600">{t('litiges.adminDecideFor')}</p>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              onClick={() => handleAdminDecision(litige._id, 'client')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs"
                              size="sm"
                            >
                              <User className="w-3.5 h-3.5 mr-1" />
                              {t('litiges.client')}
                            </Button>
                            <Button
                              onClick={() => handleAdminDecision(litige._id, 'prestataire')}
                              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs"
                              size="sm"
                            >
                              <Wrench className="w-3.5 h-3.5 mr-1" />
                              {t('litiges.prestataire')}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Non-admin: keep decision buttons outside expanded view */}
                  {!isAdmin && litige.statut === 'en_cours' && (
                    <div className="border-t border-gray-100 pt-3 space-y-2">
                      {/* No decision buttons for non-admin, just funds blocked message already shown above */}
                    </div>
                  )}
                </CardContent>
              </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyLitiges
