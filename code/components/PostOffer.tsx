import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { postOffer } from '../services/apiService';
import { SetAppView } from '../types';
import InteractiveLocationPicker from './InteractiveLocationPicker';
import { useToast } from '@/hooks/use-toast';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { getCityNames, getCityCoordinates } from '../constants/majorCities';

interface MachineTemplate {
  id: string
  name: string
  description: string | null
  fieldDefinitions: FieldDefinition[]
  isActive: boolean
}

interface FieldDefinition {
  name: string
  label: string
  type: 'text' | 'number' | 'select' | 'textarea'
  required: boolean
  options?: string[]
  placeholder?: string
}

interface PostOfferProps {
    setView: SetAppView;
}

const PostOffer: React.FC<PostOfferProps> = ({ setView }) => {
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const { toast } = useToast();

    // Machine template state
    const [machineTemplates, setMachineTemplates] = useState<MachineTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<MachineTemplate | null>(null);
    const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
    const [loadingTemplates, setLoadingTemplates] = useState(true);

    // Location fields
    const [city, setCity] = useState('');
    const [address, setAddress] = useState('');
    const [latitude, setLatitude] = useState(currentUser?.location.coordinates[1] || 33.5731);
    const [longitude, setLongitude] = useState(currentUser?.location.coordinates[0] || -7.5898);

    // Get major cities
    const allCities = getCityNames();

    // Common fields
    const [priceRate, setPriceRate] = useState('');
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Availability slots
    interface AvailabilitySlot {
        startDate: string;
        endDate: string;
    }
    const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([
        { startDate: '', endDate: '' }
    ]);

    // Fetch machine templates
    useEffect(() => {
        const fetchTemplates = async () => {
            setLoadingTemplates(true);
            try {
                const response = await fetch('/api/machine-templates?active=true');
                const data = await response.json();
                setMachineTemplates(data.templates || []);
            } catch (error) {
                console.error('Failed to fetch machine templates:', error);
            } finally {
                setLoadingTemplates(false);
            }
        };
        fetchTemplates();
    }, []);

    // Update map center when city is selected
    useEffect(() => {
        if (city) {
            const coords = getCityCoordinates(city);
            if (coords) {
                setLatitude(coords[0]);
                setLongitude(coords[1]);
            }
        }
    }, [city]);



    if (!currentUser) {
        return <p>{t('postOffer.notLoggedIn')}</p>;
    }

    const handleLocationChange = (lat: number, lon: number) => {
        setLatitude(lat);
        setLongitude(lon);
    };

    const handleAddSlot = () => {
        setAvailabilitySlots([...availabilitySlots, { startDate: '', endDate: '' }]);
    };

    const handleRemoveSlot = (index: number) => {
        if (availabilitySlots.length > 1) {
            setAvailabilitySlots(availabilitySlots.filter((_, i) => i !== index));
        }
    };

    const handleSlotChange = (index: number, field: 'startDate' | 'endDate', value: string) => {
        const updated = [...availabilitySlots];
        updated[index][field] = value;
        setAvailabilitySlots(updated);
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Photo size must be less than 5MB');
                return;
            }
            setPhotoFile(file);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleTemplateChange = (templateId: string) => {
        const template = machineTemplates.find(t => t.id === templateId);
        setSelectedTemplate(template || null);
        setCustomFieldValues({});
    };

    const handleCustomFieldChange = (fieldName: string, value: any) => {
        setCustomFieldValues(prev => ({
            ...prev,
            [fieldName]: value
        }));
    };

    const validateCustomFields = (): boolean => {
        if (!selectedTemplate) return true;
        
        for (const field of selectedTemplate.fieldDefinitions) {
            if (field.required && !customFieldValues[field.name]) {
                alert(`${field.label} is required`);
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedTemplate) {
            alert('Veuillez sélectionner un type de machine');
            return;
        }

        if (!city.trim()) {
            alert('Veuillez entrer une ville');
            return;
        }

        if (!address.trim()) {
            alert('Veuillez entrer une adresse');
            return;
        }

        // Validate availability slots
        const validSlots = availabilitySlots.filter(slot => slot.startDate && slot.endDate);
        if (validSlots.length === 0) {
            alert('Veuillez ajouter au moins une période de disponibilité');
            return;
        }

        // Validate that end date is after start date
        for (const slot of validSlots) {
            if (new Date(slot.endDate) <= new Date(slot.startDate)) {
                alert('La date de fin doit être après la date de début pour chaque créneau');
                return;
            }
        }

        if (!validateCustomFields()) {
            return;
        }
        
        setIsSubmitting(true);
        try {
            let uploadedPhotoUrl = null;
            if (photoFile) {
                uploadedPhotoUrl = await uploadToCloudinary(photoFile);
                if (!uploadedPhotoUrl) {
                    alert('Échec du téléchargement de la photo. Veuillez réessayer.');
                    setIsSubmitting(false);
                    return;
                }
            }

            // Create offer with machine template data and availability slots
            const response = await fetch('/api/offers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    providerId: currentUser._id,
                    providerName: currentUser.name,
                    machineTemplateId: selectedTemplate.id,
                    equipmentType: selectedTemplate.name,
                    description: `${selectedTemplate.name} - ${Object.entries(customFieldValues).map(([k, v]) => `${k}: ${v}`).join(', ')}`,
                    customFields: customFieldValues,
                    city: city.trim(),
                    address: address.trim(),
                    availability: validSlots.map(slot => ({
                        start: new Date(slot.startDate).toISOString(),
                        end: new Date(slot.endDate).toISOString()
                    })),
                    serviceAreaLocation: {
                        type: 'Point',
                        coordinates: [longitude, latitude],
                    },
                    priceRate: parseFloat(priceRate),
                    photoUrl: uploadedPhotoUrl
                })
            });

            if (response.ok) {
                toast({
                    title: "✅ Offre publiée avec succès !",
                    description: `Votre offre de ${selectedTemplate.name} a été publiée à ${city}`,
                    duration: 5000,
                });
                
                setTimeout(() => {
                    setView('dashboard');
                }, 1000);
            } else {
                const data = await response.json();
                alert(data.error || t('postOffer.submitError'));
            }
        } catch (error) {
            console.error(error);
            alert(t('postOffer.submitError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 p-8">
            <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-slate-800 border-b pb-2">{t('common.publishOffer')}</h2>
            
            <div className="bg-white p-8 rounded-xl shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Machine Type Selection */}
                    <div>
                        <Label htmlFor="machineType" className="text-sm font-medium text-slate-700">
                            {t('common.machineType')} <span className="text-red-500">*</span>
                        </Label>
                        {loadingTemplates ? (
                            <p className="text-sm text-slate-500 mt-2">{t('common.loading')}</p>
                        ) : machineTemplates.length === 0 ? (
                            <p className="text-sm text-red-500 mt-2">Aucun type de machine disponible. Contactez l'administrateur.</p>
                        ) : (
                            <select 
                                id="machineType" 
                                value={selectedTemplate?.id || ''} 
                                onChange={(e) => handleTemplateChange(e.target.value)} 
                                required 
                                className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="">{t('common.selectMachine')}</option>
                                {machineTemplates.map(template => (
                                    <option key={template.id} value={template.id}>
                                        {template.name}
                                        {template.description ? ` - ${template.description}` : ''}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Dynamic Fields Based on Selected Template */}
                    {selectedTemplate && (
                        <div className="space-y-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                            <h4 className="font-semibold text-emerald-800 text-sm">
                                Détails - {selectedTemplate.name}
                            </h4>
                            {selectedTemplate.fieldDefinitions.map((field) => (
                                <div key={field.name}>
                                    <label 
                                        htmlFor={field.name} 
                                        className="block text-sm font-medium text-slate-700"
                                    >
                                        {field.label}
                                        {field.required && <span className="text-red-500 ml-1">*</span>}
                                    </label>
                                    {field.type === 'text' && (
                                        <input
                                            id={field.name}
                                            type="text"
                                            value={customFieldValues[field.name] || ''}
                                            onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                                            required={field.required}
                                            placeholder={field.placeholder}
                                            className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                        />
                                    )}
                                    {field.type === 'number' && (
                                        <input
                                            id={field.name}
                                            type="number"
                                            value={customFieldValues[field.name] || ''}
                                            onChange={(e) => handleCustomFieldChange(field.name, parseFloat(e.target.value) || '')}
                                            required={field.required}
                                            placeholder={field.placeholder}
                                            className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                        />
                                    )}
                                    {field.type === 'textarea' && (
                                        <textarea
                                            id={field.name}
                                            value={customFieldValues[field.name] || ''}
                                            onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                                            required={field.required}
                                            placeholder={field.placeholder}
                                            rows={3}
                                            className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                        />
                                    )}
                                    {field.type === 'select' && field.options && (
                                        <select
                                            id={field.name}
                                            value={customFieldValues[field.name] || ''}
                                            onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                                            required={field.required}
                                            className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                        >
                                            <option value="">Sélectionnez...</option>
                                            {field.options.map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Ville */}
                    <div>
                        <Label htmlFor="city" className="text-sm font-medium text-slate-700">
                            Ville <span className="text-red-500">*</span>
                        </Label>
                        <select 
                            id="city" 
                            value={city} 
                            onChange={(e) => setCity(e.target.value)} 
                            required 
                            className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="">-- Sélectionnez une ville --</option>
                            {allCities.map(cityName => (
                                <option key={cityName} value={cityName}>
                                    {cityName}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-1">
                            La carte se déplacera automatiquement vers la ville sélectionnée
                        </p>
                    </div>

                    {/* Adresse */}
                    <div>
                        <Label htmlFor="address" className="text-sm font-medium text-slate-700">
                            Adresse <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="address"
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Ex: Hay Hassani, Route principale"
                            required
                            className="mt-1"
                        />
                    </div>

                    {/* Interactive Location Picker */}
                    <div>
                        <Label className="text-sm font-medium text-slate-700 mb-2 block">
                            Localisation GPS <span className="text-red-500">*</span>
                        </Label>
                        
                        <InteractiveLocationPicker
                            initialLat={latitude}
                            initialLon={longitude}
                            onLocationChange={handleLocationChange}
                            city={city}
                        />
                    </div>

                    <div>
                        <Label htmlFor="priceRate" className="text-sm font-medium text-slate-700">
                            {t('postOffer.priceRateLabel')} <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative mt-1">
                            <Input 
                                id="priceRate" 
                                type="number" 
                                min="0"
                                step="50"
                                value={priceRate} 
                                onChange={(e) => setPriceRate(e.target.value)} 
                                required 
                                placeholder={t('postOffer.priceRatePlaceholder')} 
                                className="pr-20"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <span className="text-slate-500 text-sm font-medium">MAD/jour</span>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Indiquez le tarif de location journalier de votre machine</p>
                    </div>

                    {/* Périodes de disponibilité */}
                    <div className="space-y-4 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-base font-semibold text-slate-800">
                                    📅 Périodes de disponibilité <span className="text-red-500">*</span>
                                </Label>
                                <p className="text-xs text-slate-600 mt-1">
                                    Définissez quand votre machine est disponible à la location
                                </p>
                            </div>
                            <Button
                                type="button"
                                onClick={handleAddSlot}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm"
                            >
                                + Ajouter un créneau
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {availabilitySlots.map((slot, index) => (
                                <div key={index} className="flex gap-3 items-start p-4 bg-white rounded-lg border border-blue-200">
                                    <div className="flex-1 grid grid-cols-2 gap-3">
                                        <div>
                                            <Label htmlFor={`startDate-${index}`} className="text-xs font-medium text-slate-700">
                                                Date de début
                                            </Label>
                                            <Input
                                                id={`startDate-${index}`}
                                                type="date"
                                                value={slot.startDate}
                                                onChange={(e) => handleSlotChange(index, 'startDate', e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                                required
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor={`endDate-${index}`} className="text-xs font-medium text-slate-700">
                                                Date de fin
                                            </Label>
                                            <Input
                                                id={`endDate-${index}`}
                                                type="date"
                                                value={slot.endDate}
                                                onChange={(e) => handleSlotChange(index, 'endDate', e.target.value)}
                                                min={slot.startDate || new Date().toISOString().split('T')[0]}
                                                required
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>
                                    {availabilitySlots.length > 1 && (
                                        <Button
                                            type="button"
                                            onClick={() => handleRemoveSlot(index)}
                                            variant="ghost"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 mt-6"
                                        >
                                            🗑️
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Photo */}
                    <div>
                        <Label htmlFor="photo" className="text-sm font-medium text-slate-700">
                            {t('common.photoOptional')}
                        </Label>
                        <input 
                            id="photo" 
                            type="file" 
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500" 
                        />
                        {photoPreview && (
                            <div className="mt-3">
                                <img src={photoPreview} alt="Preview" className="max-h-48 rounded-md border-2 border-slate-300" />
                            </div>
                        )}
                    </div>

                    {/* Info Box */}
                    <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-md">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-emerald-800 font-medium">
                                    💼 Gestion des réservations
                                </p>
                                <p className="text-xs text-emerald-700 mt-1">
                                    Les agriculteurs pourront réserver votre machine durant les périodes définies. Vous recevrez une notification pour chaque réservation et pourrez l'approuver ou la refuser depuis votre tableau de bord.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                        <Button 
                            type="button" 
                            onClick={() => setView('dashboard')} 
                            className="py-2 px-6 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? `📤 ${t('common.submitting')}` : `📢 ${t('common.publishOffer')}`}
                        </Button>
                    </div>
                </form>
            </div>
            </div>
        </div>
    );
};

export default PostOffer;
