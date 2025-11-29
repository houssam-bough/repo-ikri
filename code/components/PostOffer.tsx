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

    // Common fields
    const [priceRate, setPriceRate] = useState('');
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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



    if (!currentUser) {
        return <p>{t('postOffer.notLoggedIn')}</p>;
    }

    const handleLocationChange = (lat: number, lon: number) => {
        setLatitude(lat);
        setLongitude(lon);
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

        if (!validateCustomFields()) {
            return;
        }
        
        setIsSubmitting(true);
        try {
            let uploadedPhotoUrl = null;
            if (photoFile) {
                uploadedPhotoUrl = await uploadToCloudinary(photoFile);
                if (!uploadedPhotoUrl) {
                    alert('Failed to upload photo. Please try again.');
                    setIsSubmitting(false);
                    return;
                }
            }

            // Create offer with machine template data
            // Machine is available by default, reservations will block time slots
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
                    availability: [], // Empty array - availability managed by reservations
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
        <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold mb-6 text-slate-800 border-b pb-2">Publier une Offre</h2>
            
            <div className="bg-white p-8 rounded-xl shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Machine Type Selection */}
                    <div>
                        <Label htmlFor="machineType" className="text-sm font-medium text-slate-700">
                            Type de machine <span className="text-red-500">*</span>
                        </Label>
                        {loadingTemplates ? (
                            <p className="text-sm text-slate-500 mt-2">Chargement des machines disponibles...</p>
                        ) : machineTemplates.length === 0 ? (
                            <p className="text-sm text-red-500 mt-2">Aucun type de machine disponible. Contactez l'admin.</p>
                        ) : (
                            <select 
                                id="machineType" 
                                value={selectedTemplate?.id || ''} 
                                onChange={(e) => handleTemplateChange(e.target.value)} 
                                required 
                                className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="">Choisissez une machine...</option>
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
                                {selectedTemplate.name} Details
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
                                            <option value="">Select...</option>
                                            {field.options.map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* City and Address */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="city" className="text-sm font-medium text-slate-700">
                                Ville <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="city"
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="Ex: Casablanca"
                                required
                                className="mt-1"
                                list="moroccan-cities"
                            />
                            <datalist id="moroccan-cities">
                                <option value="Casablanca" />
                                <option value="Rabat" />
                                <option value="Fès" />
                                <option value="Marrakech" />
                                <option value="Agadir" />
                                <option value="Tanger" />
                                <option value="Meknès" />
                                <option value="Oujda" />
                                <option value="Kenitra" />
                                <option value="Tétouan" />
                                <option value="Safi" />
                                <option value="Mohammedia" />
                                <option value="Khouribga" />
                                <option value="El Jadida" />
                                <option value="Béni Mellal" />
                                <option value="Nador" />
                            </datalist>
                        </div>
                        <div>
                            <Label htmlFor="address" className="text-sm font-medium text-slate-700">
                                Adresse précise <span className="text-red-500">*</span>
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
                    </div>

                    {/* Interactive Location Picker */}
                    <div>
                        <Label className="text-sm font-medium text-slate-700 mb-2 block">
                            Localisation de votre machine <span className="text-red-500">*</span>
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
                        <Input 
                            id="priceRate" 
                            type="number" 
                            value={priceRate} 
                            onChange={(e) => setPriceRate(e.target.value)} 
                            required 
                            placeholder={t('postOffer.priceRatePlaceholder')} 
                            className="mt-1"
                        />
                    </div>

                    {/* Photo */}
                    <div>
                        <Label htmlFor="photo" className="text-sm font-medium text-slate-700">
                            Photo de l'équipement (Optionnel)
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
                                    📅 Disponibilité automatique
                                </p>
                                <p className="text-xs text-emerald-700 mt-1">
                                    Votre machine sera disponible par défaut. Les réservations de vos clients bloqueront automatiquement les créneaux horaires correspondants.
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
                            Annuler
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? '📤 Publication en cours...' : '📢 Publier l\'offre'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PostOffer;
