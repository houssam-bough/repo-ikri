import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { postOffer } from '../services/apiService';

interface PostOfferProps {
    setView: (view: 'dashboard' | 'profile' | 'postOffer') => void;
}

const PostOffer: React.FC<PostOfferProps> = ({ setView }) => {
    const { currentUser } = useAuth();
    const { t } = useLanguage();

    const [equipmentType, setEquipmentType] = useState('');
    const [description, setDescription] = useState('');
    const [priceRate, setPriceRate] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [latitude, setLatitude] = useState(currentUser?.location.coordinates[1].toString() || '');
    const [longitude, setLongitude] = useState(currentUser?.location.coordinates[0].toString() || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!currentUser) {
        return <p>{t('postOffer.notLoggedIn')}</p>;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!startDate || !endDate) {
            alert(t('postOffer.dateError'));
            return;
        }
        setIsSubmitting(true);
        try {
            await postOffer({
                providerId: currentUser._id,
                providerName: currentUser.name,
                equipmentType,
                description,
                priceRate: parseFloat(priceRate),
                availability: [{
                    start: new Date(startDate),
                    end: new Date(endDate),
                }],
                serviceAreaLocation: {
                    type: 'Point',
                    coordinates: [parseFloat(longitude), parseFloat(latitude)],
                }
            });
            alert(t('postOffer.submitSuccess'));
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
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="equipmentType" className="block text-sm font-medium text-slate-700">{t('postOffer.equipmentLabel')}</label>
                        <input id="equipmentType" type="text" value={equipmentType} onChange={(e) => setEquipmentType(e.target.value)} required placeholder={t('postOffer.equipmentPlaceholder')} className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
                    </div>
                     <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-700">{t('postOffer.descriptionLabel')}</label>
                        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required rows={3} placeholder={t('postOffer.descriptionPlaceholder')} className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
                    </div>

                    <div>
                        <label htmlFor="priceRate" className="block text-sm font-medium text-slate-700">{t('postOffer.priceRateLabel')}</label>
                        <input id="priceRate" type="number" value={priceRate} onChange={(e) => setPriceRate(e.target.value)} required placeholder={t('postOffer.priceRatePlaceholder')} className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
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
                        <button type="button" onClick={() => setView('dashboard')} className="py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
                            {t('postOffer.cancelButton')}
                        </button>
                        <button type="submit" disabled={isSubmitting} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isSubmitting ? t('postOffer.submittingButton') : t('postOffer.submitButton')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PostOffer;
