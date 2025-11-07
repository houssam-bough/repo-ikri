import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { Button } from '@/components/ui/button'
import { postDemand, findLocalOffers } from '../services/apiService';
import { SetAppView, type Offer } from '../types';
import DynamicMap, { type MapMarker } from './DynamicMap';

interface PostDemandProps {
    setView: SetAppView;
}

const PostDemand: React.FC<PostDemandProps> = ({ setView }) => {
    const { currentUser } = useAuth();
    const { t } = useLanguage();

    const [requiredService, setRequiredService] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [latitude, setLatitude] = useState(currentUser?.location.coordinates[1].toString() || '');
    const [longitude, setLongitude] = useState(currentUser?.location.coordinates[0].toString() || '');
    const [photoUrl, setPhotoUrl] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localOffers, setLocalOffers] = useState<Offer[]>([]);

    useEffect(() => {
        const fetchLocalOffers = async () => {
            if (currentUser) {
                try {
                    const offers = await findLocalOffers(currentUser.location);
                    setLocalOffers(offers);
                } catch (error) {
                    console.error('Failed to fetch local offers:', error);
                }
            }
        };
        fetchLocalOffers();
    }, [currentUser]);

    if (!currentUser) {
        return <p>{t('postDemand.notLoggedIn')}</p>;
    }

    const getMapMarkers = (): MapMarker[] => {
        const userMarker: MapMarker = {
            position: [currentUser.location.coordinates[1], currentUser.location.coordinates[0]],
            popupContent: `<strong>You are here</strong><br/>${currentUser.name}`,
            type: "user",
        };

        // Group offers by provider ID
        const offersByProvider = localOffers.reduce((acc, offer) => {
            if (!acc[offer.providerId]) {
                acc[offer.providerId] = [];
            }
            acc[offer.providerId].push(offer);
            return acc;
        }, {} as Record<string, typeof localOffers>);

        // Create one marker per provider with all their offers
        const offerMarkers: MapMarker[] = Object.values(offersByProvider).map((providerOffers) => {
            const firstOffer = providerOffers[0];
            const popupContent = `
                <div style="max-width: 250px;">
                    <strong style="font-size: 14px;">${firstOffer.providerName}</strong>
                    <div style="margin-top: 8px;">
                        ${providerOffers.map(offer => `
                            <div style="border-bottom: 1px solid #e5e7eb; padding: 8px 0;">
                                <strong style="color: #059669;">${offer.equipmentType}</strong><br/>
                                <span style="font-size: 12px;">Rate: $${offer.priceRate}/hr</span><br/>
                                <span style="font-size: 11px; color: #64748b;">Available: ${offer.availability.map(a => 
                                    new Date(a.start).toLocaleDateString()
                                ).join(', ')}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            return {
                position: [firstOffer.serviceAreaLocation.coordinates[1], firstOffer.serviceAreaLocation.coordinates[0]],
                popupContent,
                type: "offer" as const,
            };
        });

        return [userMarker, ...offerMarkers];
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
            alert(t('postDemand.dateError'));
            return;
        }
        setIsSubmitting(true);
        try {
            await postDemand({
                farmerId: currentUser._id,
                farmerName: currentUser.name,
                requiredService,
                requiredTimeSlot: {
                    start: new Date(startDate),
                    end: new Date(endDate),
                },
                jobLocation: {
                    type: 'Point',
                    coordinates: [parseFloat(longitude), parseFloat(latitude)],
                },
                photoUrl: photoUrl || undefined
            });
            alert(t('postDemand.submitSuccess'));
            // Refresh local offers after posting demand
            if (currentUser) {
                const offers = await findLocalOffers(currentUser.location);
                setLocalOffers(offers);
            }
            setView('dashboard');
        } catch (error) {
            console.error(error);
            alert(t('postDemand.submitError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-slate-800 border-b pb-2">{t('postDemand.title')}</h2>
            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-xl shadow-xl">
                    <h3 className="text-xl font-semibold mb-4 text-slate-700">Available Offers Worldwide</h3>
                    {localOffers.length > 0 ? (
                        <DynamicMap
                            center={[currentUser.location.coordinates[1], currentUser.location.coordinates[0]]}
                            markers={getMapMarkers()}
                        />
                    ) : (
                        <p className="text-slate-600">No offers available at the moment.</p>
                    )}
                </div>
                <div className="bg-white p-8 rounded-xl shadow-xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="service" className="block text-sm font-medium text-slate-700">{t('postDemand.serviceLabel')}</label>
                        <input id="service" type="text" value={requiredService} onChange={(e) => setRequiredService(e.target.value)} required placeholder={t('postDemand.servicePlaceholder')} className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
                    </div>

                    <div>
                        <label htmlFor="photo" className="block text-sm font-medium text-slate-700">Job Site Photo (Optional)</label>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="start-date" className="block text-sm font-medium text-slate-700">{t('postDemand.startDateLabel')}</label>
                            <input id="start-date" type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="end-date" className="block text-sm font-medium text-slate-700">{t('postDemand.endDateLabel')}</label>
                            <input id="end-date" type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
                        </div>
                    </div>
                    
                    <p className="text-sm font-medium text-slate-700">{t('postDemand.locationLabel')}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="latitude" className="block text-xs text-slate-600">{t('postDemand.latitudeLabel')}</label>
                            <input id="latitude" type="number" step="any" placeholder="e.g., 41.6033" value={latitude} onChange={(e) => setLatitude(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="longitude" className="block text-xs text-slate-600">{t('postDemand.longitudeLabel')}</label>
                            <input id="longitude" type="number" step="any" placeholder="e.g., -93.7124" value={longitude} onChange={(e) => setLongitude(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
                        </div>
                    </div>

                        <div className="flex items-center justify-end space-x-4 pt-4">
                            <Button type="button" onClick={() => setView('dashboard')} className="py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">
                                {t('postDemand.cancelButton')}
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isSubmitting ? t('postDemand.submittingButton') : t('postDemand.submitButton')}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PostDemand;
