import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { Button } from '@/components/ui/button'
import { postOffer, findLocalDemands } from '../services/apiService';
import { SetAppView, type Demand } from '../types';
import DynamicMap, { type MapMarker } from './DynamicMap';

interface PostOfferProps {
    setView: SetAppView;
}

const PostOffer: React.FC<PostOfferProps> = ({ setView }) => {
    const { currentUser } = useAuth();
    const { t } = useLanguage();

    const [equipmentType, setEquipmentType] = useState('');
    const [customEquipmentType, setCustomEquipmentType] = useState('');
    const [description, setDescription] = useState('');
    const [priceRate, setPriceRate] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [latitude, setLatitude] = useState(currentUser?.location.coordinates[1].toString() || '');
    const [longitude, setLongitude] = useState(currentUser?.location.coordinates[0].toString() || '');
    const [photoUrl, setPhotoUrl] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localDemands, setLocalDemands] = useState<Demand[]>([]);

    const equipmentOptions = [
        'Tractor',
        'Combine Harvester',
        'Sprayer',
        'Seeder',
        'Plow',
        'Harrow',
        'Spreader',
        'Mower',
        'Baler',
        'Other'
    ];

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

        // Group demands by farmer ID
        const demandsByFarmer = localDemands.reduce((acc, demand) => {
            if (!acc[demand.farmerId]) {
                acc[demand.farmerId] = [];
            }
            acc[demand.farmerId].push(demand);
            return acc;
        }, {} as Record<string, typeof localDemands>);

        // Create one marker per farmer with all their demands
        const demandMarkers: MapMarker[] = Object.values(demandsByFarmer).map((farmerDemands) => {
            const firstDemand = farmerDemands[0];
            const popupContent = `
                <div style="max-width: 250px;">
                    <strong style="font-size: 14px;">${firstDemand.farmerName}</strong>
                    <div style="margin-top: 8px;">
                        ${farmerDemands.map(demand => `
                            <div style="border-bottom: 1px solid #e5e7eb; padding: 8px 0;">
                                <strong style="color: #0284c7;">${demand.requiredService}</strong><br/>
                                <span style="font-size: 12px;">Needed: ${new Date(demand.requiredTimeSlot.start).toLocaleDateString()} - ${new Date(demand.requiredTimeSlot.end).toLocaleDateString()}</span><br/>
                                <span style="font-size: 11px; color: #64748b;">Status: ${demand.status}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            return {
                position: [firstDemand.jobLocation.coordinates[1], firstDemand.jobLocation.coordinates[0]],
                popupContent,
                type: "demand" as const,
            };
        });

        return [userMarker, ...demandMarkers];
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!startDate || !endDate) {
            alert(t('postOffer.dateError'));
            return;
        }
        setIsSubmitting(true);
        try {
            const finalEquipmentType = equipmentType === 'Other' ? customEquipmentType : equipmentType;
            
            if (equipmentType === 'Other' && !customEquipmentType.trim()) {
                alert('Please specify the equipment type');
                setIsSubmitting(false);
                return;
            }
            
            await postOffer(
                currentUser._id,
                currentUser.name,
                finalEquipmentType,
                description,
                [{
                    start: new Date(startDate),
                    end: new Date(endDate),
                }],
                {
                    type: 'Point',
                    coordinates: [parseFloat(longitude), parseFloat(latitude)],
                },
                parseFloat(priceRate),
                photoUrl || undefined
            );
            alert(t('postOffer.submitSuccess'));
            // Refresh local demands after posting offer
            if (currentUser) {
                const demands = await findLocalDemands(currentUser.location);
                setLocalDemands(demands);
            }
            setView('dashboard');
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
                    <div>
                        <label htmlFor="equipmentType" className="block text-sm font-medium text-slate-700">{t('postOffer.equipmentLabel')}</label>
                        <select 
                            id="equipmentType" 
                            value={equipmentType} 
                            onChange={(e) => setEquipmentType(e.target.value)} 
                            required 
                            className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                        >
                            <option value="">Select equipment type...</option>
                            {equipmentOptions.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                    
                    {equipmentType === 'Other' && (
                        <div>
                            <label htmlFor="customEquipmentType" className="block text-sm font-medium text-slate-700">Specify Equipment Type</label>
                            <input 
                                id="customEquipmentType" 
                                type="text" 
                                value={customEquipmentType} 
                                onChange={(e) => setCustomEquipmentType(e.target.value)} 
                                required 
                                placeholder="Enter equipment type..." 
                                className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" 
                            />
                        </div>
                    )}

                     <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-700">{t('postOffer.descriptionLabel')}</label>
                        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required rows={3} placeholder={t('postOffer.descriptionPlaceholder')} className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
                    </div>

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
