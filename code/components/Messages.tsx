"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useLanguage } from "@/hooks/useLanguage"
import { Button } from "@/components/ui/button"
import type { Conversation, Message, SetAppView } from "@/types"
import { getConversationsForUser, getConversationBetweenUsers, sendMessage, markConversationAsRead } from "@/services/apiService"
import { localDb } from "@/services/localDb"
import { VoiceRecorder, AudioPlayer } from "./VoiceRecorder"
import { FileAttachment, FilePreview } from "./FileAttachment"
import { X, Send } from "lucide-react"

interface MessagesProps {
  setView: SetAppView
  initialReceiverId?: string
  initialReceiverName?: string
  initialOfferId?: string
  initialDemandId?: string
}

const Messages: React.FC<MessagesProps> = ({ setView, initialReceiverId, initialReceiverName, initialOfferId, initialDemandId }) => {
  const { currentUser } = useAuth()
  const { t, language } = useLanguage()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(initialReceiverId || null)
  const [selectedUserName, setSelectedUserName] = useState<string>(initialReceiverName || "")
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [contextOfferId, setContextOfferId] = useState<string | undefined>(initialOfferId)
  const [contextDemandId, setContextDemandId] = useState<string | undefined>(initialDemandId)
  
  // New states for attachments
  const [pendingAudio, setPendingAudio] = useState<{ audioUrl: string; duration: number } | null>(null)
  const [pendingFile, setPendingFile] = useState<{ fileUrl: string; fileType: 'image' | 'pdf'; fileName: string } | null>(null)
  
  // Mobile-only state: track if we're in chat view (true) or conversation list (false)
  const [mobileShowChat, setMobileShowChat] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // Detect mobile environment
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(document.body.classList.contains('mobile-app') || !!window.Capacitor)
    }
    checkMobile()
  }, [])

  // Parse hash on mount to handle navigation with context
  useEffect(() => {
    const parseHash = async () => {
      const hash = window.location.hash
      if (hash.startsWith('#messages-')) {
        const parts = hash.substring('#messages-'.length).split('-')
        const userId = parts[0]
        const offerId = parts[1]
        const demandId = parts[2]
        
        if (userId && userId !== selectedConversation) {
          // Fetch user name
          const userResult = await localDb.getUserById(userId)
          if (userResult.success && userResult.data) {
            setSelectedConversation(userId)
            setSelectedUserName(userResult.data.name)
            if (offerId) setContextOfferId(offerId)
            if (demandId) setContextDemandId(demandId)
          }
        }
        
        // Clear hash after parsing
        window.location.hash = ''
      }
    }
    
    parseHash()
  }, [])

  // Listen for custom navigation events from UserSearch
  useEffect(() => {
    const handleNavigateToMessages = async (event: any) => {
      const { userId, userName } = event.detail
      if (userId) {
        setSelectedConversation(userId)
        setSelectedUserName(userName || 'User')
      }
    }
    
    window.addEventListener('navigateToMessages', handleNavigateToMessages)
    return () => window.removeEventListener('navigateToMessages', handleNavigateToMessages)
  }, [])

  // Check sessionStorage for message target on mount
  useEffect(() => {
    const messageTarget = sessionStorage.getItem('messageTarget')
    if (messageTarget) {
      try {
        const { userId, userName, demandId, offerId } = JSON.parse(messageTarget)
        if (userId) {
          setSelectedConversation(userId)
          setSelectedUserName(userName || 'User')
          if (demandId) setContextDemandId(demandId)
          if (offerId) setContextOfferId(offerId)
          // Clear the stored target
          sessionStorage.removeItem('messageTarget')
        }
      } catch (error) {
        console.error('Failed to parse message target:', error)
      }
    }
  }, [])

  const fetchConversations = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      const convos = await getConversationsForUser(currentUser._id)
      setConversations(convos)
    } catch (error) {
      console.error("Failed to fetch conversations:", error)
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  const fetchMessages = useCallback(async (otherUserId: string) => {
    if (!currentUser) return
    try {
      const msgs = await getConversationBetweenUsers(currentUser._id, otherUserId)
      setMessages(msgs)
      // Mark as read
      await markConversationAsRead(currentUser._id, otherUserId)
      // Refresh conversations to update unread count
      fetchConversations()
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    }
  }, [currentUser, fetchConversations])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation)
    }
  }, [selectedConversation, fetchMessages])

  const handleSelectConversation = (otherUserId: string, otherUserName: string) => {
    setSelectedConversation(otherUserId)
    setSelectedUserName(otherUserName)
    // Mobile: navigate to chat view
    if (isMobile) {
      setMobileShowChat(true)
    }
    // Clear pending attachments when switching conversations
    setPendingAudio(null)
    setPendingFile(null)
  }

  const handleSendMessage = async () => {
    if (!currentUser || !selectedConversation) return
    
    // Check if we have text, audio, or file
    const hasContent = newMessage.trim() || pendingAudio || pendingFile
    if (!hasContent) return
    
    setSending(true)
    try {
      const messageData: any = {
        senderId: currentUser._id,
        senderName: currentUser.name,
        receiverId: selectedConversation,
        receiverName: selectedUserName,
        content: newMessage.trim() || (pendingAudio ? t('messagesPage.voiceMessage') : pendingFile?.fileType === 'image' ? t('messagesPage.imageMessage') : t('messagesPage.documentMessage')),
        relatedOfferId: contextOfferId || initialOfferId,
        relatedDemandId: contextDemandId || initialDemandId
      }

      // Add audio if present
      if (pendingAudio) {
        messageData.audioUrl = pendingAudio.audioUrl
        messageData.audioDuration = pendingAudio.duration
        messageData.fileType = 'audio'
      }

      // Add file if present
      if (pendingFile) {
        messageData.fileUrl = pendingFile.fileUrl
        messageData.fileType = pendingFile.fileType
        messageData.fileName = pendingFile.fileName
      }

      const result = await sendMessage(
        messageData.senderId,
        messageData.senderName,
        messageData.receiverId,
        messageData.receiverName,
        messageData.content,
        messageData.relatedOfferId,
        messageData.relatedDemandId,
        messageData.fileUrl,
        messageData.fileType,
        messageData.fileName,
        messageData.audioUrl,
        messageData.audioDuration
      )
      
      if (result) {
        setNewMessage("")
        setPendingAudio(null)
        setPendingFile(null)
        await fetchMessages(selectedConversation)
        await fetchConversations()
      }
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleRecordingComplete = (audioUrl: string, duration: number) => {
    setPendingAudio({ audioUrl, duration })
    setPendingFile(null) // Clear file if audio is selected
  }

  const handleFileSelect = (fileUrl: string, fileType: 'image' | 'pdf', fileName: string) => {
    setPendingFile({ fileUrl, fileType, fileName })
    setPendingAudio(null) // Clear audio if file is selected
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleString(language === 'ar' ? 'ar-MA' : 'fr-FR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Handle action button click from notification messages
  const handleActionButtonClick = (actionButton: { label: string; labelKey?: string; targetView: string; params?: Record<string, string> }) => {
    // Navigate to the target view
    setView(actionButton.targetView as any)
  }

  return (
    <div className="bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
      {/* ═══════════════════════════════════════════════
          MOBILE – Chat View (covers full screen incl. header/nav)
      ═══════════════════════════════════════════════ */}
      {isMobile && mobileShowChat ? (
        <div
          className="fixed inset-0 flex flex-col bg-[#f0f2f5]"
          style={{ zIndex: 2000 }}
        >
          {/* ── Fixed chat header ── */}
          <div
            className="flex-shrink-0 flex items-center gap-3 bg-[#4C9A2A] px-4 pb-3 shadow-sm"
            style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))' }}
          >
            <button
              onClick={() => setMobileShowChat(false)}
              className="text-white p-1 -ml-1 active:opacity-70"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-white/25 flex items-center justify-center text-white font-bold text-[15px] flex-shrink-0">
              {selectedUserName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-[15px] leading-tight truncate">{selectedUserName}</p>
            </div>
          </div>

          {/* ── Scrollable messages ── */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
            {messages.map((msg) => {
              const isSent = msg.senderId === currentUser?._id
              const isSystemNotification = msg.senderName === 'Système YKRI'
              return (
                <div
                  key={msg._id}
                  className={`flex ${isSent && !isSystemNotification ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-3 py-2 shadow-sm ${
                      isSystemNotification
                        ? 'bg-white border border-[#4C9A2A]/20 text-slate-800 rounded-2xl'
                        : isSent
                        ? 'bg-[#4C9A2A] text-white rounded-br-sm'
                        : 'bg-white text-slate-800 rounded-bl-sm'
                    }`}
                  >
                    {isSystemNotification && (
                      <div className="flex items-center gap-1 mb-1.5">
                        <span className="text-[11px] font-medium text-[#4C9A2A] bg-green-100 px-2 py-0.5 rounded-full">
                          🔔 {t('messagesPage.notification')}
                        </span>
                      </div>
                    )}
                    {msg.content && <p className="text-[14px] leading-snug mb-1">{msg.content}</p>}
                    {msg.actionButton && msg.receiverId === currentUser?._id && (
                      <Button
                        size="sm"
                        onClick={() => handleActionButtonClick(msg.actionButton!)}
                        className="mt-1 bg-[#4C9A2A] hover:bg-[#3d8422] text-white text-xs"
                      >
                        {msg.actionButton.labelKey ? t(msg.actionButton.labelKey) : msg.actionButton.label}
                      </Button>
                    )}
                    {msg.audioUrl && msg.fileType === 'audio' && (
                      <div className="mb-1"><AudioPlayer audioUrl={msg.audioUrl} duration={msg.audioDuration} /></div>
                    )}
                    {msg.fileUrl && (msg.fileType === 'image' || msg.fileType === 'pdf') && (
                      <div className="mb-1">
                        <FilePreview fileUrl={msg.fileUrl} fileType={msg.fileType} fileName={msg.fileName || 'file'} />
                      </div>
                    )}
                    <p className={`text-[10px] mt-0.5 text-right ${isSystemNotification ? 'text-[#4C9A2A]' : isSent ? 'text-green-200' : 'text-slate-400'}`}>
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Pending attachment preview ── */}
          {(pendingAudio || pendingFile) && (
            <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-white border-t border-slate-100">
              <span className="text-xs text-slate-500">{t('common.attachment')}:</span>
              {pendingAudio && (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <AudioPlayer audioUrl={pendingAudio.audioUrl} duration={pendingAudio.duration} />
                  <button onClick={() => setPendingAudio(null)} className="text-slate-400 active:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {pendingFile && (
                <div className="flex-1 min-w-0">
                  <FilePreview fileUrl={pendingFile.fileUrl} fileType={pendingFile.fileType} fileName={pendingFile.fileName} onRemove={() => setPendingFile(null)} showRemove={true} />
                </div>
              )}
            </div>
          )}

          {/* ── Fixed input bar ── */}
          <div
            className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-[#f0f2f5]"
            style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="flex items-center gap-1">
              <FileAttachment onFileSelect={handleFileSelect} disabled={sending || !!pendingAudio} />
              <VoiceRecorder onRecordingComplete={handleRecordingComplete} disabled={sending || !!pendingFile} />
            </div>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('common.typeMessage')}
              className="flex-1 px-4 py-2.5 bg-white border-0 rounded-full text-[14px] focus:outline-none focus:ring-0 shadow-sm"
            />
            <button
              onClick={handleSendMessage}
              disabled={sending || (!newMessage.trim() && !pendingAudio && !pendingFile)}
              className="w-10 h-10 rounded-full bg-[#4C9A2A] flex items-center justify-center text-white active:bg-[#3d8422] disabled:opacity-40 flex-shrink-0 shadow-sm"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

      ) : isMobile && !mobileShowChat ? (
        /* ═══════════════════════════════════════════════
           MOBILE – Conversation list (native style)
        ═══════════════════════════════════════════════ */
        <div className="flex flex-col">
          {loading ? (
            <p className="text-center text-slate-400 py-12">{t('messagesPage.loading')}</p>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-slate-400 text-[14px]">{t('messagesPage.noConversations')}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {conversations.map((convo) => {
                const initial = convo.otherUserName?.charAt(0)?.toUpperCase() || '?'
                const colors = ['bg-[#4C9A2A]', 'bg-[#FF8C1A]', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500']
                const colorIdx = convo.otherUserId.charCodeAt(0) % colors.length
                return (
                  <div
                    key={convo.otherUserId}
                    onClick={() => handleSelectConversation(convo.otherUserId, convo.otherUserName)}
                    className="flex items-center gap-3 px-1 py-3 active:bg-slate-50 cursor-pointer"
                  >
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-full ${colors[colorIdx]} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white font-bold text-[17px]">{initial}</span>
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-[15px] text-slate-800 truncate">{convo.otherUserName}</p>
                        <p className="text-[11px] text-slate-400 flex-shrink-0 ml-2">{formatTime(convo.lastMessageDate)}</p>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-[13px] text-slate-500 truncate flex-1">{convo.lastMessage}</p>
                        {convo.unreadCount > 0 && (
                          <span className="ml-2 min-w-[20px] h-5 px-1 bg-[#4C9A2A] text-white text-[11px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                            {convo.unreadCount > 9 ? '9+' : convo.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      ) : (
        /* ═══════════════════════════════════════════════
           WEB – Original two-column layout (unchanged)
        ═══════════════════════════════════════════════ */
        <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4 mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-[#4C9A2A] font-heading">
          {t('messagesPage.title')}
        </h2>
        <Button
          onClick={() => setView("dashboard")}
          className="px-4 py-2 text-[#4C9A2A] bg-green-50 hover:bg-green-100 rounded-lg w-full sm:w-auto"
        >
          {t('messagesPage.backToDashboard')}
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4 md:gap-6">
        {/* Conversations List */}
        <div className="bg-white rounded-xl shadow-lg p-4 overflow-y-auto max-h-80 md:max-h-full">
          <h3 className="text-lg font-semibold mb-4 text-[#4C9A2A] font-heading">{t('messagesPage.conversations')}</h3>
          {loading ? (
            <p className="text-center text-slate-500">{t('messagesPage.loading')}</p>
          ) : conversations.length === 0 ? (
            <p className="text-center text-slate-500 text-sm">{t('messagesPage.noConversations')}</p>
          ) : (
            <div className="space-y-2">
              {conversations.map((convo) => (
                <div
                  key={convo.otherUserId}
                  onClick={() => handleSelectConversation(convo.otherUserId, convo.otherUserName)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedConversation === convo.otherUserId
                      ? 'bg-green-50 border-2 border-[#4C9A2A]'
                      : 'bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-slate-800">{convo.otherUserName}</p>
                    {convo.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {convo.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 truncate">{convo.lastMessage}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatTime(convo.lastMessageDate)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Messages View */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-lg flex flex-col min-h-[420px]">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold text-[#4C9A2A] font-heading">{selectedUserName}</h3>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => {
                  const isSent = msg.senderId === currentUser?._id
                  const isSystemNotification = msg.senderName === 'Système YKRI'
                  return (
                    <div
                      key={msg._id}
                      className={`flex ${isSent && !isSystemNotification ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isSystemNotification
                            ? 'bg-green-50 border border-[#4C9A2A]/20 text-slate-800'
                            : isSent
                            ? 'bg-[#4C9A2A] text-white'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {isSystemNotification && (
                          <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-xs font-medium text-[#4C9A2A] bg-green-100 px-2 py-0.5 rounded-full">
                          🔔 {t('messagesPage.notification')}
                        </span>
                      </div>
                    )}
                        {msg.content && (
                          <p className="text-sm mb-2">{msg.content}</p>
                        )}
                        {msg.actionButton && msg.receiverId === currentUser?._id && (
                          <Button
                            size="sm"
                            onClick={() => handleActionButtonClick(msg.actionButton!)}
                            className="mt-2 bg-[#4C9A2A] hover:bg-[#3d8422] text-white text-xs"
                          >
                            {msg.actionButton.labelKey ? t(msg.actionButton.labelKey) : msg.actionButton.label}
                          </Button>
                        )}
                        {msg.audioUrl && msg.fileType === 'audio' && (
                          <div className="mb-2">
                            <AudioPlayer audioUrl={msg.audioUrl} duration={msg.audioDuration} />
                          </div>
                        )}
                        {msg.fileUrl && (msg.fileType === 'image' || msg.fileType === 'pdf') && (
                          <div className="mb-2">
                            <FilePreview
                              fileUrl={msg.fileUrl}
                              fileType={msg.fileType}
                              fileName={msg.fileName || 'file'}
                            />
                          </div>
                        )}
                        <p className={`text-xs mt-1 ${isSystemNotification ? 'text-[#4C9A2A]' : isSent ? 'text-green-200' : 'text-slate-500'}`}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pending attachments preview */}
              {(pendingAudio || pendingFile) && (
                <div className="px-4 py-2 border-t bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">{t('common.attachment')}:</span>
                    {pendingAudio && (
                      <div className="flex items-center gap-2">
                        <AudioPlayer audioUrl={pendingAudio.audioUrl} duration={pendingAudio.duration} />
                        <Button type="button" onClick={() => setPendingAudio(null)} size="icon" variant="ghost" className="h-6 w-6">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {pendingFile && (
                      <div className="flex-1">
                        <FilePreview fileUrl={pendingFile.fileUrl} fileType={pendingFile.fileType} fileName={pendingFile.fileName} onRemove={() => setPendingFile(null)} showRemove={true} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                  <FileAttachment onFileSelect={handleFileSelect} disabled={sending || !!pendingAudio} />
                  <VoiceRecorder onRecordingComplete={handleRecordingComplete} disabled={sending || !!pendingFile} />
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t('common.typeMessage')}
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#4C9A2A]"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={sending || (!newMessage.trim() && !pendingAudio && !pendingFile)}
                    size="icon"
                    className="w-10 h-10 rounded-full bg-[#4C9A2A] text-white hover:bg-[#3d8422] disabled:opacity-50 shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <p>{t('common.selectConversation')}</p>
            </div>
          )}
        </div>
      </div>
      </>
      )}
      </div>
    </div>
  )
}

export default Messages
