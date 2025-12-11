'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

interface ProposalModalProps {
  isOpen: boolean
  onClose: () => void
  demandId: string
  demandTitle: string
  providerId: string
  onSuccess: () => void
}

export default function ProposalModal({
  isOpen,
  onClose,
  demandId,
  demandTitle,
  providerId,
  onSuccess,
}: ProposalModalProps) {
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!price || parseFloat(price) <= 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer un prix valide',
        variant: 'destructive',
      })
      return
    }

    if (!description || description.trim().length < 50) {
      toast({
        title: 'Erreur',
        description: 'La description doit contenir au moins 50 caractères',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          demandId,
          providerId,
          price: parseFloat(price),
          description: description.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la soumission')
      }

      toast({
        title: '✅ Proposition envoyée !',
        description: 'Votre proposition a été envoyée avec succès',
        className: 'bg-emerald-50 border-emerald-200',
      })

      // Reset form
      setPrice('')
      setDescription('')
      onClose()
      onSuccess()
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de soumettre la proposition',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setPrice('')
      setDescription('')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] z-10000">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-emerald-700">
            Soumettre une Proposition
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Pour : <span className="font-semibold text-slate-900">{demandTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="price" className="text-slate-700 font-semibold">
              Votre prix (MAD) <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Ex: 1500"
                className="pr-16"
                required
                disabled={isSubmitting}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                MAD
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-700 font-semibold">
              Détails de votre proposition <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre expérience, les machines que vous utiliserez, vos garanties, vos références..."
              className="min-h-[150px] resize-none"
              required
              disabled={isSubmitting}
            />
            <div className="flex justify-between items-center text-sm">
              <span
                className={
                  description.length < 50
                    ? 'text-amber-600 font-medium'
                    : 'text-emerald-600 font-medium'
                }
              >
                {description.length} / 50 caractères minimum
              </span>
              {description.length > 0 && description.length < 50 && (
                <span className="text-amber-600">
                  Encore {50 - description.length} caractères requis
                </span>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !price || description.length < 50}
              className="bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Envoi en cours...
                </>
              ) : (
                'Soumettre ma Proposition'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
