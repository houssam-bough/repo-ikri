"use client"

import type React from "react"
import { Button } from "@/components/ui/button"

interface ContactButtonProps {
  receiverId: string
  receiverName: string
  onContact: (receiverId: string, receiverName: string, offerId?: string, demandId?: string) => void
  offerId?: string
  demandId?: string
  className?: string
}

const ContactButton: React.FC<ContactButtonProps> = ({
  receiverId,
  receiverName,
  onContact,
  offerId,
  demandId,
  className = ""
}) => {
  return (
    <Button
      onClick={() => onContact(receiverId, receiverName, offerId, demandId)}
      className={`px-4 py-2 bg-linear-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all ${className}`}
    >
      💬 Contact {receiverName}
    </Button>
  )
}

export default ContactButton
