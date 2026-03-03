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
import { SERVICE_TYPES, getServiceName, translateMachineName } from '../constants/serviceTypes';
import { translateFieldLabel, translatePlaceholder, translateSelectOption } from '../constants/templateFieldTranslations';

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
    const { t, language } = useLanguage();
    const { toast } = useToast();

    // Service type (same as farmer form)
    const [serviceType, setServiceType] = useState('');

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
    const allCities = getCityNames(language);

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

    // Machines allowed for selected service type (based on farmer constants)
    const availableMachineNames = serviceType
        ? new Set(
            (SERVICE_TYPES.find(st => st.id === serviceType)?.machines || []).map(m => m.name)
          )
        : null

    const visibleTemplates = availableMachineNames
        ? machineTemplates.filter(tpl => availableMachineNames.has(tpl.name))
        : machineTemplates

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

    // Reset machine template when service type changes
    useEffect(() => {
        setSelectedTemplate(null)
        setCustomFieldValues({})
    }, [serviceType])

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
                alert(t('postOfferPage.photoSizeError'));
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
                alert(t('postOfferPage.fieldRequired').replace('{field}', field.label));
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!serviceType) {
            alert(t('postOfferPage.validationServiceType'));
            return;
        }
        
        if (!selectedTemplate) {
            alert(t('postOfferPage.validationMachine'));
            return;
        }

        if (!city.trim()) {
            alert(t('postOfferPage.validationCity'));
            return;
        }

        if (!address.trim()) {
            alert(t('postOfferPage.validationAddress'));
            return;
        }

        // PHOTO OBLIGATOIRE pour les machines
        if (!photoFile) {
            alert(t('postOfferPage.validationPhotoRequired'));
            return;
        }

        // Validate availability slots
        const validSlots = availabilitySlots.filter(slot => slot.startDate && slot.endDate);
        if (validSlots.length === 0) {
            alert(t('postOfferPage.validationSlots'));
            return;
        }

        // Validate that end date is after start date
        for (const slot of validSlots) {
            if (new Date(slot.endDate) <= new Date(slot.startDate)) {
                alert(t('postOfferPage.validationEndAfterStart'));
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
                    alert(t('postOfferPage.photoUploadFailed'));
                    setIsSubmitting(false);
                    return;
                }
            }

            const selectedServiceType = SERVICE_TYPES.find(st => st.id === serviceType)
            const prestationLabel = selectedServiceType?.name || serviceType

            // Create offer with machine template data and availability slots
            const response = await fetch('/api/offers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    providerId: currentUser._id,
                    providerName: currentUser.name,
                    machineTemplateId: selectedTemplate.id,
                    // IMPORTANT:
                    // - equipmentType = type de prestation
                    // - machineType = template name (resolved server-side from machineTemplateId)
                    equipmentType: prestationLabel,
                    // Keep description clean; specs live in customFields
                    description: '',
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
                    title: t('postOfferPage.successToastTitle'),
                    description: t('postOfferPage.successToastDescription').replace('{machine}', selectedTemplate.name).replace('{city}', city),
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

    const fieldClass = "mt-2 block w-full px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl text-base transition-all focus:outline-none focus:border-[#4C9A2A] focus:ring-2 focus:ring-[#4C9A2A]/20";

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#4C9A2A]/5 via-orange-50/30 to-white px-4 py-6">
            <div className="max-w-lg mx-auto pb-8">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#4C9A2A]/10 mb-3">
                        <span className="text-2xl">🚜</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 font-heading">{t('common.publishOffer')}</h2>
                    <div className="w-12 h-1 bg-gradient-to-r from-[#4C9A2A] to-[#FF8C1A] mx-auto mt-2 rounded-full"></div>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* ── Section: Service & Machine ── */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#4C9A2A]/10 text-sm">🔧</span>
                            <h3 className="text-base font-bold text-[#4C9A2A] font-heading">{t('postOfferPage.serviceTypeLabel')}</h3>
                        </div>

                        <div>
                            <Label htmlFor="serviceType" className="text-sm font-semibold text-gray-700">
                                {t('postOfferPage.serviceTypeLabel')} <span className="text-red-500">*</span>
                            </Label>
                            <select
                                id="serviceType"
                                value={serviceType}
                                onChange={(e) => setServiceType(e.target.value)}
                                required
                                className={fieldClass}
                            >
                                <option value="">{t('postOfferPage.selectServiceType')}</option>
                                {SERVICE_TYPES.map(st => (
                                    <option key={st.id} value={st.id}>{getServiceName(st, language)}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="machineType" className="text-sm font-semibold text-gray-700">
                                {t('postOfferPage.machineTypeLabel')} <span className="text-red-500">*</span>
                            </Label>
                            {loadingTemplates ? (
                                <p className="text-sm text-gray-400 mt-2">{t('common.loading')}</p>
                            ) : machineTemplates.length === 0 ? (
                                <p className="text-sm text-red-500 mt-2">{t('postOfferPage.noMachinesAvailable')}</p>
                            ) : serviceType && visibleTemplates.length === 0 ? (
                                <p className="text-sm text-red-500 mt-2">
                                    {t('postOfferPage.noMachinesConfigured')}
                                </p>
                            ) : (
                                <select 
                                    id="machineType" 
                                    value={selectedTemplate?.id || ''} 
                                    onChange={(e) => handleTemplateChange(e.target.value)} 
                                    required 
                                    className={fieldClass}
                                >
                                    <option value="">{t('common.selectMachine')}</option>
                                    {visibleTemplates.map(template => (
                                        <option key={template.id} value={template.id}>
                                            {translateMachineName(template.name, language)}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    {/* ── Section: Machine Details (Dynamic Fields) ── */}
                    {selectedTemplate && (
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#FF8C1A]/10 text-sm">⚙️</span>
                                <h3 className="text-base font-bold text-[#FF8C1A] font-heading">
                                    {t('postOfferPage.templateDetailsPrefix')} {translateMachineName(selectedTemplate.name, language)}
                                </h3>
                            </div>
                            {selectedTemplate.fieldDefinitions.map((field) => (
                                <div key={field.name}>
                                    <label 
                                        htmlFor={field.name} 
                                        className="block text-sm font-semibold text-gray-700"
                                    >
                                        {translateFieldLabel(field.label, language)}
                                        {field.required && <span className="text-red-500 ml-1">*</span>}
                                    </label>
                                    {field.type === 'text' && (
                                        <input
                                            id={field.name}
                                            type="text"
                                            value={customFieldValues[field.name] || ''}
                                            onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                                            required={field.required}
                                            placeholder={field.placeholder ? translatePlaceholder(field.placeholder, language) : undefined}
                                            className={fieldClass}
                                        />
                                    )}
                                    {field.type === 'number' && (
                                        <input
                                            id={field.name}
                                            type="number"
                                            value={customFieldValues[field.name] || ''}
                                            onChange={(e) => handleCustomFieldChange(field.name, parseFloat(e.target.value) || '')}
                                            required={field.required}
                                            placeholder={field.placeholder ? translatePlaceholder(field.placeholder, language) : undefined}
                                            className={fieldClass}
                                        />
                                    )}
                                    {field.type === 'textarea' && (
                                        <textarea
                                            id={field.name}
                                            value={customFieldValues[field.name] || ''}
                                            onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                                            required={field.required}
                                            placeholder={field.placeholder ? translatePlaceholder(field.placeholder, language) : undefined}
                                            rows={3}
                                            className={fieldClass}
                                        />
                                    )}
                                    {field.type === 'select' && field.options && (
                                        <select
                                            id={field.name}
                                            value={customFieldValues[field.name] || ''}
                                            onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                                            required={field.required}
                                            className={fieldClass}
                                        >
                                            <option value="">{t('postOfferPage.selectOption')}</option>
                                            {field.options.map(option => (
                                                <option key={option} value={option}>{translateSelectOption(option, language)}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Section: Location ── */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#4C9A2A]/10 text-sm">📍</span>
                            <h3 className="text-base font-bold text-[#4C9A2A] font-heading">{t('postOfferPage.cityLabel')}</h3>
                        </div>

                        <div>
                            <Label htmlFor="city" className="text-sm font-semibold text-gray-700">
                                {t('postOfferPage.cityLabel')} <span className="text-red-500">*</span>
                            </Label>
                            <select 
                                id="city" 
                                value={city} 
                                onChange={(e) => setCity(e.target.value)} 
                                required 
                                className={fieldClass}
                            >
                                <option value="">-- {t('postOfferPage.selectCityOption')} --</option>
                                {allCities.map(cityName => (
                                    <option key={cityName} value={cityName}>
                                        {cityName}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-400 mt-1">
                                {t('postOfferPage.cityMapHint')}
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="address" className="text-sm font-semibold text-gray-700">
                                {t('postOfferPage.addressLabel')} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="address"
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder={t('postOfferPage.addressPlaceholder')}
                                required
                                className="mt-2 rounded-xl border-2 border-gray-200 px-4 py-3 text-base focus:border-[#4C9A2A] focus:ring-2 focus:ring-[#4C9A2A]/20"
                            />
                        </div>

                        <div className="rounded-2xl overflow-hidden border-2 border-gray-200">
                            <InteractiveLocationPicker
                                initialLat={latitude}
                                initialLon={longitude}
                                onLocationChange={handleLocationChange}
                                city={city}
                            />
                        </div>
                    </div>

                    {/* ── Section: Pricing ── */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#FF8C1A]/10 text-sm">💰</span>
                            <h3 className="text-base font-bold text-[#FF8C1A] font-heading">{t('postOffer.priceRateLabel')}</h3>
                        </div>

                        <div>
                            <Label htmlFor="priceRate" className="text-sm font-semibold text-gray-700">
                                {t('postOffer.priceRateLabel')} <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative mt-2">
                                <Input 
                                    id="priceRate" 
                                    type="number" 
                                    min="0"
                                    step="50"
                                    value={priceRate} 
                                    onChange={(e) => setPriceRate(e.target.value)} 
                                    required 
                                    placeholder={t('postOffer.priceRatePlaceholder')} 
                                    className="rounded-xl border-2 border-gray-200 px-4 py-3 pr-24 text-base focus:border-[#FF8C1A] focus:ring-2 focus:ring-[#FF8C1A]/20"
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                    <span className="text-gray-500 text-sm font-semibold">{t('postOfferPage.madPerDay')}</span>
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{t('postOfferPage.priceHint')}</p>
                        </div>
                    </div>

                    {/* ── Section: Availability ── */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#4C9A2A]/10 text-sm">📆</span>
                            <div>
                                <h3 className="text-base font-bold text-[#4C9A2A] font-heading">
                                    {t('postOfferPage.availabilityLabel')} <span className="text-red-500">*</span>
                                </h3>
                                <p className="text-xs text-gray-400">{t('postOfferPage.availabilityHint')}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {availabilitySlots.map((slot, index) => (
                                <div key={index} className="flex gap-3 items-start p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <div className="flex-1 grid grid-cols-2 gap-3">
                                        <div>
                                            <Label htmlFor={`startDate-${index}`} className="text-xs font-semibold text-gray-600">
                                                {t('postOfferPage.startDateLabel')}
                                            </Label>
                                            <Input
                                                id={`startDate-${index}`}
                                                type="date"
                                                value={slot.startDate}
                                                onChange={(e) => handleSlotChange(index, 'startDate', e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                                required
                                                className="mt-1 rounded-lg border-2 border-gray-200 focus:border-[#4C9A2A]"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor={`endDate-${index}`} className="text-xs font-semibold text-gray-600">
                                                {t('postOfferPage.endDateLabel')}
                                            </Label>
                                            <Input
                                                id={`endDate-${index}`}
                                                type="date"
                                                value={slot.endDate}
                                                onChange={(e) => handleSlotChange(index, 'endDate', e.target.value)}
                                                min={slot.startDate || new Date().toISOString().split('T')[0]}
                                                required
                                                className="mt-1 rounded-lg border-2 border-gray-200 focus:border-[#4C9A2A]"
                                            />
                                        </div>
                                    </div>
                                    {availabilitySlots.length > 1 && (
                                        <Button
                                            type="button"
                                            onClick={() => handleRemoveSlot(index)}
                                            variant="ghost"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 mt-5 rounded-lg"
                                        >
                                            🗑️
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <Button
                            type="button"
                            onClick={handleAddSlot}
                            className="w-full bg-[#4C9A2A] hover:bg-[#3d8422] text-white text-sm rounded-xl py-2.5"
                        >
                            {t('postOfferPage.addSlotButton')}
                        </Button>
                    </div>

                    {/* ── Section: Photo ── */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#FF8C1A]/10 text-sm">📸</span>
                            <h3 className="text-base font-bold text-[#FF8C1A] font-heading">
                                {t('postOfferPage.machinePhotoLabel')} <span className="text-red-500">*</span>
                            </h3>
                        </div>
                        <p className="text-xs text-gray-400">{t('postOfferPage.photoQualityHint')}</p>
                        
                        <label htmlFor="photo" className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${photoPreview ? 'border-[#4C9A2A] bg-[#4C9A2A]/5' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
                            {photoPreview ? (
                                <img src={photoPreview} alt={t('postOfferPage.photoPreviewAlt')} className="h-32 rounded-lg object-cover" />
                            ) : (
                                <div className="flex flex-col items-center">
                                    <span className="text-3xl mb-1">📷</span>
                                    <span className="text-sm text-gray-500">{t('postOfferPage.machinePhotoLabel')}</span>
                                </div>
                            )}
                            <input 
                                id="photo" 
                                type="file" 
                                accept="image/*"
                                onChange={handlePhotoChange}
                                required
                                className="hidden"
                            />
                        </label>
                        {!photoFile && (
                            <p className="text-xs text-red-500">{t('postOfferPage.photoRequired')}</p>
                        )}
                        {photoPreview && (
                            <p className="text-xs text-[#4C9A2A] font-medium">{t('postOfferPage.photoAdded')}</p>
                        )}
                    </div>

                    {/* Info Box */}
                    <div className="bg-[#4C9A2A]/5 border border-[#4C9A2A]/20 p-4 rounded-2xl">
                        <div className="flex items-start gap-3">
                            <span className="text-lg">ℹ️</span>
                            <div>
                                <p className="text-sm text-[#4C9A2A] font-semibold">
                                    {t('postOfferPage.reservationManagementTitle')}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                    {t('postOfferPage.reservationInfoDetail')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3 pt-2">
                        <Button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="w-full py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-[#4C9A2A] to-[#3d8422] hover:from-[#3d8422] hover:to-[#357a1e] shadow-lg shadow-[#4C9A2A]/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-body"
                        >
                            {isSubmitting ? `📤 ${t('common.submitting')}` : `📢 ${t('common.publishOffer')}`}
                        </Button>
                        <Button 
                            type="button" 
                            onClick={() => setView('dashboard')} 
                            className="w-full py-3 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50"
                        >
                            {t('common.cancel')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PostOffer;
