"use client"

import React, { useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Paperclip, FileText, X, Download } from "lucide-react"

interface FileAttachmentProps {
  onFileSelect: (fileUrl: string, fileType: 'image' | 'pdf', fileName: string) => void
  disabled?: boolean
}

export const FileAttachment: React.FC<FileAttachmentProps> = ({ onFileSelect, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleMobileFilePicker = async () => {
    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera')
      const { isMobileApp } = await import('@/lib/mobileUtils')
      
      if (!isMobileApp()) {
        // Web: use standard file input
        fileInputRef.current?.click()
        return
      }
      
      // Mobile: use native picker with prompt
      const result = await Camera.pickImages({
        quality: 90,
        limit: 1
      })
      
      if (result.photos && result.photos.length > 0) {
        const photo = result.photos[0]
        const base64 = `data:image/${photo.format};base64,${photo.base64String}`
        const fileName = `image_${Date.now()}.${photo.format}`
        onFileSelect(base64, 'image', fileName)
      }
    } catch (error) {
      console.error('Error picking file:', error)
      // Fallback to web input
      fileInputRef.current?.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Le fichier est trop volumineux (max 5MB)")
      return
    }

    const fileType = file.type.startsWith('image/') ? 'image' : 'pdf'
    
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64data = reader.result as string
      onFileSelect(base64data, fileType, file.name)
    }
    reader.readAsDataURL(file)
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,application/pdf"
        className="hidden"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleMobileFilePicker}
        disabled={disabled}
        className="text-slate-500 hover:text-purple-600 hover:bg-purple-50"
        title="Joindre un fichier"
      >
        <Paperclip className="h-5 w-5" />
      </Button>
    </>
  )
}

interface FilePreviewProps {
  fileUrl: string
  fileType: 'image' | 'pdf' | 'audio' | string
  fileName: string
  onRemove?: () => void
  showRemove?: boolean
}

export const FilePreview: React.FC<FilePreviewProps> = ({ 
  fileUrl, 
  fileType, 
  fileName, 
  onRemove, 
  showRemove = false 
}) => {
  const isImage = fileType === 'image'
  
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const { downloadFile } = await import('@/lib/mobileUtils')
      await downloadFile(fileUrl, fileName)
    } catch (error) {
      console.error('Download error:', error)
      alert('Erreur lors du téléchargement')
    }
  }

  return (
    <div className={`relative group flex items-center gap-3 p-2 rounded-lg border ${isImage ? 'bg-slate-50' : 'bg-white'}`}>
      {isImage ? (
        <div className="relative h-16 w-16 rounded-md overflow-hidden bg-slate-200 shrink-0">
          <img src={fileUrl} alt={fileName} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="h-12 w-12 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
          <FileText className="h-6 w-6 text-red-500" />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 truncate" title={fileName}>
          {fileName}
        </p>
        <p className="text-xs text-slate-500 uppercase">{fileType}</p>
        
        {!showRemove && (
          <button 
            onClick={handleDownload}
            className="text-xs text-purple-600 hover:underline flex items-center gap-1 mt-1 cursor-pointer bg-transparent border-none p-0"
          >
            <Download className="h-3 w-3" /> Télécharger
          </button>
        )}
      </div>

      {showRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-8 w-8 text-slate-400 hover:text-red-500"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
