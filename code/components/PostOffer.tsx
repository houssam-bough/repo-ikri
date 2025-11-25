import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { Button } from '@/components/ui/button'
import { postOffer, findLocalDemands } from '../services/apiService';
import { SetAppView, type Demand } from '../types';
import DynamicMap, { type MapMarker } from './DynamicMap';
import { addRandomOffset50m, isSameLocation } from '../services/geoService';

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

    // Machine template state
    const [machineTemplates, setMachineTemplates] = useState<MachineTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<MachineTemplate | null>(null);
    const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
    const [loadingTemplates, setLoadingTemplates] = useState(true);

    // Common fields
    const [priceRate, setPriceRate] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [latitude, setLatitude] = useState(currentUser?.location.coordinates[1].toString() || '');
    const [longitude, setLongitude] = useState(currentUser?.location.coordinates[0].toString() || '');
    const [photoUrl, setPhotoUrl] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localDemands, setLocalDemands] = useState<Demand[]>([]);

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

    useEffect(() => {
        const fetchLocalDemands = async () => {
            if (currentUser) {
                try {
                    const demands = await findLocalDemands(currentUser.location);
                    setLocalDemands(demands);
                } catch (error) {
                    console.error('Failed to fetch local demands:', error);
                }
            }
        };
        fetchLocalDemands();
    }, [currentUser]);

    if (!currentUser) {
        return <p>{t('postOffer.notLoggedIn')}</p>;
    }

    const getMapMarkers = (): MapMarker[] => {
        const userMarker: MapMarker = {
            position: [currentUser.location.coordinates[1], currentUser.location.coordinates[0]],
            popupContent: `<strong>You are here</strong><br/>${currentUser.name}`,
            type: "user",
        };

        const markers: MapMarker[] = [userMarker]
        const usedPositions: Array<[number, number]> = []

        // Helper function to get a unique position with random offset if needed
        const getUniquePosition = (originalLat: number, originalLon: number): [number, number] => {
            let position: [number, number] = [originalLat, originalLon]
            
            // Check if this position is already used
            while (usedPositions.some(pos => isSameLocation(pos, position))) {
                // Add random offset of ~50m
                position = addRandomOffset50m(originalLat, originalLon)
            }
            
            usedPositions.push(position)
            return position
        }

        // Group demands by requiredService (machine) instead of farmer
        const demandsByMachine = localDemands.reduce((acc, demand) => {
            if (!acc[demand.requiredService]) {
                acc[demand.requiredService] = [];
            }
            acc[demand.requiredService].push(demand);
            return acc;
        }, {} as Record<string, typeof localDemands>);

        // Create one marker per machine type
        Object.entries(demandsByMachine).forEach(([machineType, machineDemands]) => {
            machineDemands.forEach((demand) => {
                const originalLat = demand.jobLocation.coordinates[1]
                const originalLon = demand.jobLocation.coordinates[0]
                const position = getUniquePosition(originalLat, originalLon)
                
                const popupContent = `
                    <div style="max-width: 280px;">
                        <strong style="font-size: 14px; color: #ea580c;">🔍 ${machineType}</strong>
                        <div style="margin-top: 8px; padding: 8px 0; border-top: 2px solid #ea580c;">
                            <p style="font-size: 12px; margin-bottom: 4px;"><strong>Titre:</strong> ${demand.title || machineType}</p>
                            <p style="font-size: 12px; margin-bottom: 4px;"><strong>Ville:</strong> ${demand.city}</p>
                            <p style="font-size: 12px; margin-bottom: 4px;"><strong>Agriculteur:</strong> ${demand.farmerName}</p>
                            <p style="font-size: 11px; color: #64748b; margin-bottom: 8px;">Nécessaire: ${new Date(demand.requiredTimeSlot.start).toLocaleDateString()} - ${new Date(demand.requiredTimeSlot.end).toLocaleDateString()}</p>
                            <a href="/demands/${demand._id}" 
                               style="display: inline-block; background: linear-gradient(to right, #3b82f6, #6366f1); color: white; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 600; margin-top: 4px;">
                              👁️ Voir les détails
                            </a>
                        </div>
                    </div>
                `
                
                markers.push({
                    position,
                    popupContent,
                    type: "demand" as const,
                    equipmentType: machineType,
                    itemId: demand._id
                })
            })
        })

        return markers;
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Photo size must be less than 5MB');
                return;
            }
            // Convert to base64
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoUrl(reader.result as string);
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
            alert('Please select a machine type');
            return;
        }
        
        if (!startDate || !endDate) {
            alert(t('postOffer.dateError'));
            return;
        }

        if (!validateCustomFields()) {
            return;
        }
        
        setIsSubmitting(true);
        try {
            // Create offer with machine template data
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
                    availability: [{
                        start: new Date(startDate),
                        end: new Date(endDate),
                    }],
                    serviceAreaLocation: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)],
                    },
                    priceRate: parseFloat(priceRate),
                    photoUrl: photoUrl || null
                })
            });

            if (response.ok) {
                alert(t('postOffer.submitSuccess'));
                setView('dashboard');
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
        <div className="container mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-slate-800 border-b pb-2">{t('postOffer.title')}</h2>
            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-xl shadow-xl">
                    <h3 className="text-xl font-semibold mb-4 text-slate-700">Available Demands Worldwide</h3>
                    {localDemands.length > 0 ? (
                        <DynamicMap
                            center={[currentUser.location.coordinates[1], currentUser.location.coordinates[0]]}
                            markers={getMapMarkers()}
                        />
                    ) : (
                        <p className="text-slate-600">No demands available at the moment.</p>
                    )}
                </div>
                <div className="bg-white p-8 rounded-xl shadow-xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Machine Type Selection */}
                    <div>
                        <label htmlFor="machineType" className="block text-sm font-medium text-slate-700">
                            Select Machine Type *
                        </label>
                        {loadingTemplates ? (
                            <p className="text-sm text-slate-500 mt-2">Loading available machines...</p>
                        ) : machineTemplates.length === 0 ? (
                            <p className="text-sm text-red-500 mt-2">No machine types available. Contact admin to add machines.</p>
                        ) : (
                            <select 
                                id="machineType" 
                                value={selectedTemplate?.id || ''} 
                                onChange={(e) => handleTemplateChange(e.target.value)} 
                                required 
                                className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                            >
                                <option value="">Choose a machine...</option>
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

                    <div>
                        <label htmlFor="priceRate" className="block text-sm font-medium text-slate-700">{t('postOffer.priceRateLabel')}</label>
                        <input id="priceRate" type="number" value={priceRate} onChange={(e) => setPriceRate(e.target.value)} required placeholder={t('postOffer.priceRatePlaceholder')} className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
                    </div>

                    <div>
                        <label htmlFor="photo" className="block text-sm font-medium text-slate-700">Equipment Photo (Optional)</label>
                        <input 
                            id="photo" 
                            type="file" 
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" 
                        />
                        {photoUrl && (
                            <div className="mt-2">
                                <img src={photoUrl} alt="Preview" className="max-h-40 rounded-md border border-slate-300" />
                            </div>
                        )}
                    </div>

                    <p className="text-sm font-medium text-slate-700">{t('postOffer.availabilityLabel')}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="start-date" className="block text-xs text-slate-600">{t('postOffer.availableFromLabel')}</label>
                            <input id="start-date" type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="end-date" className="block text-xs text-slate-600">{t('postOffer.availableUntilLabel')}</label>
                            <input id="end-date" type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
                        </div>
                    </div>
                    
                    <p className="text-sm font-medium text-slate-700">{t('postOffer.locationLabel')}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="latitude" className="block text-xs text-slate-600">{t('postOffer.latitudeLabel')}</label>
                            <input id="latitude" type="number" step="any" placeholder="e.g., 41.5868" value={latitude} onChange={(e) => setLatitude(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="longitude" className="block text-xs text-slate-600">{t('postOffer.longitudeLabel')}</label>
                            <input id="longitude" type="number" step="any" placeholder="e.g., -93.6210" value={longitude} onChange={(e) => setLongitude(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
                        </div>
                    </div>

                        <div className="flex items-center justify-end space-x-4 pt-4">
                            <Button type="button" onClick={() => setView('dashboard')} className="py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">
                                {t('postOffer.cancelButton')}
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isSubmitting ? t('postOffer.submittingButton') : t('postOffer.submitButton')}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PostOffer;
