import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { postDemand } from '../services/apiService';

interface PostDemandProps {
    setView: (view: 'dashboard' | 'profile' | 'postDemand') => void;
}

const PostDemand: React.FC<PostDemandProps> = ({ setView }) => {
    const { currentUser } = useAuth();
    const { t } = useLanguage();

    const [requiredService, setRequiredService] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [latitude, setLatitude] = useState(currentUser?.location.coordinates[1].toString() || '');
    const [longitude, setLongitude] = useState(currentUser?.location.coordinates[0].toString() || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!currentUser) {
        return <p>{t('postDemand.notLoggedIn')}</p>;
    }

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
                }
            });
            alert(t('postDemand.submitSuccess'));
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
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="service" className="block text-sm font-medium text-slate-700">{t('postDemand.serviceLabel')}</label>
                        <input id="service" type="text" value={requiredService} onChange={(e) => setRequiredService(e.target.value)} required placeholder={t('postDemand.servicePlaceholder')} className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
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
                        <button type="button" onClick={() => setView('dashboard')} className="py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
                            {t('postDemand.cancelButton')}
                        </button>
                        <button type="submit" disabled={isSubmitting} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isSubmitting ? t('postDemand.submittingButton') : t('postDemand.submitButton')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PostDemand;
