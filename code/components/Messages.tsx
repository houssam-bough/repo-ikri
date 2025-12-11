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
import { X } from "lucide-react"

interface MessagesProps {
  setView: SetAppView
  initialReceiverId?: string
  initialReceiverName?: string
  initialOfferId?: string
  initialDemandId?: string
}

const Messages: React.FC<MessagesProps> = ({ setView, initialReceiverId, initialReceiverName, initialOfferId, initialDemandId }) => {
  const { currentUser } = useAuth()
  const { t } = useLanguage()
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
        content: newMessage.trim() || (pendingAudio ? '🎤 Message vocal' : pendingFile?.fileType === 'image' ? '🖼️ Image' : '📄 Document'),
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
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <h2 className="text-3xl font-bold bg-linear-to-r from-purple-700 to-pink-900 bg-clip-text text-transparent">
          Messages
        </h2>
        <Button
          onClick={() => setView("dashboard")}
          className="px-4 py-2 text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-lg"
        >
          Back to Dashboard
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <div className="bg-white rounded-xl shadow-lg p-4 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4 text-slate-700">Conversations</h3>
          {loading ? (
            <p className="text-center text-slate-500">Loading...</p>
          ) : conversations.length === 0 ? (
            <p className="text-center text-slate-500 text-sm">No conversations yet</p>
          ) : (
            <div className="space-y-2">
              {conversations.map((convo) => (
                <div
                  key={convo.otherUserId}
                  onClick={() => handleSelectConversation(convo.otherUserId, convo.otherUserName)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedConversation === convo.otherUserId
                      ? 'bg-purple-100 border-2 border-purple-500'
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
        <div className="md:col-span-2 bg-white rounded-xl shadow-lg flex flex-col">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold text-slate-800">{selectedUserName}</h3>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => {
                  const isSent = msg.senderId === currentUser?._id
                  return (
                    <div
                      key={msg._id}
                      className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isSent
                            ? 'bg-purple-500 text-white'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {/* Text content */}
                        {msg.content && (
                          <p className="text-sm mb-2">{msg.content}</p>
                        )}
                        
                        {/* Audio player */}
                        {msg.audioUrl && msg.fileType === 'audio' && (
                          <div className="mb-2">
                            <AudioPlayer audioUrl={msg.audioUrl} duration={msg.audioDuration} />
                          </div>
                        )}
                        
                        {/* File attachment */}
                        {msg.fileUrl && (msg.fileType === 'image' || msg.fileType === 'pdf') && (
                          <div className="mb-2">
                            <FilePreview
                              fileUrl={msg.fileUrl}
                              fileType={msg.fileType}
                              fileName={msg.fileName || 'file'}
                            />
                          </div>
                        )}
                        
                        <p className={`text-xs mt-1 ${isSent ? 'text-purple-200' : 'text-slate-500'}`}>
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
                        <Button
                          type="button"
                          onClick={() => setPendingAudio(null)}
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {pendingFile && (
                      <div className="flex-1">
                        <FilePreview
                          fileUrl={pendingFile.fileUrl}
                          fileType={pendingFile.fileType}
                          fileName={pendingFile.fileName}
                          onRemove={() => setPendingFile(null)}
                          showRemove={true}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2 items-end">
                  <div className="flex gap-2">
                    <VoiceRecorder
                      onRecordingComplete={handleRecordingComplete}
                      disabled={sending || !!pendingFile}
                    />
                    <FileAttachment
                      onFileSelect={handleFileSelect}
                      disabled={sending || !!pendingAudio}
                    />
                  </div>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t('common.typeMessage')}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    rows={2}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={sending || (!newMessage.trim() && !pendingAudio && !pendingFile)}
                    className="px-6 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
                  >
                    {sending ? "..." : t('common.send')}
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
      </div>
    </div>
  )
}

export default Messages
