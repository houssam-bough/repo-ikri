"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Mic, Square, Play, Pause } from "lucide-react"
import { useLanguage } from "@/hooks/useLanguage"

interface VoiceRecorderProps {
  onRecordingComplete: (audioUrl: string, duration: number) => void
  disabled?: boolean
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onRecordingComplete, disabled }) => {
  const { t } = useLanguage()
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      chunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        // Convert blob to base64 for storage
        const reader = new FileReader()
        reader.readAsDataURL(blob)
        reader.onloadend = () => {
          const base64data = reader.result as string
          onRecordingComplete(base64data, recordingTime)
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
    } catch (err) {
      console.error("Error accessing microphone:", err)
      alert(t('common.microphoneAccessError'))
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-2">
      {!isRecording ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={startRecording}
          disabled={disabled}
          className="text-slate-500 hover:text-purple-600 hover:bg-purple-50"
          title="Enregistrer un message vocal"
        >
          <Mic className="h-5 w-5" />
        </Button>
      ) : (
        <div className="flex items-center gap-2 bg-red-50 px-3 py-1 rounded-full animate-pulse">
          <span className="text-red-500 text-xs font-medium">{formatTime(recordingTime)}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={stopRecording}
            className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-100"
          >
            <Square className="h-4 w-4 fill-current" />
          </Button>
        </div>
      )}
    </div>
  )
}

interface AudioPlayerProps {
  audioUrl: string
  duration?: number
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, duration }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleEnded = () => setIsPlaying(false)
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)

    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('timeupdate', handleTimeUpdate)

    return () => {
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [])

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const formatTime = (seconds: number) => {
    if (!seconds) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-2 bg-slate-100/50 p-2 rounded-lg min-w-[200px]">
      <audio ref={audioRef} src={audioUrl} className="hidden" />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={togglePlay}
        className="h-8 w-8 rounded-full bg-white shadow-xs hover:bg-slate-50"
      >
        {isPlaying ? (
          <Pause className="h-4 w-4 text-slate-700" />
        ) : (
          <Play className="h-4 w-4 text-slate-700 ml-0.5" />
        )}
      </Button>
      <div className="flex-1 h-1 bg-slate-300 rounded-full overflow-hidden">
        <div 
          className="h-full bg-purple-500 transition-all duration-100"
          style={{ width: `${(currentTime / (duration || audioRef.current?.duration || 1)) * 100}%` }}
        />
      </div>
      <span className="text-xs text-slate-500 font-medium tabular-nums">
        {formatTime(duration || 0)}
      </span>
    </div>
  )
}
