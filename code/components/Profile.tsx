import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { Button } from '@/components/ui/button'
import { countries } from '../services/locationData';
import { City, SetAppView, UserRole } from '../types';
import DynamicMap from './DynamicMap';
import { requestVIPUpgrade, getUserVIPRequest } from '../services/apiService';

interface ProfileProps {
    setView: SetAppView;
}

const Profile: React.FC<ProfileProps> = ({ setView }) => {
    const { currentUser, updateCurrentUser } = useAuth();
    const { t } = useLanguage();

    const [name, setName] = useState(currentUser?.name || '');
    const [phone, setPhone] = useState(currentUser?.phone || '');
    
    // Location state
    const [location, setLocation] = useState<[number, number]>([
        currentUser?.location.coordinates[1] || 40.7128, // lat
        currentUser?.location.coordinates[0] || -74.0060, // lon
    ]);
    const [selectedCountry, setSelectedCountry] = useState<string>('');
    const [selectedCity, setSelectedCity] = useState<string>('');
    const [cities, setCities] = useState<City[]>([]);

    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [hasVIPRequest, setHasVIPRequest] = useState(false);
    const [isRequestingVIP, setIsRequestingVIP] = useState(false);

    useEffect(() => {
        // This effect could be used to reverse geocode to find country/city
        // For now, we just initialize the map with user's current location
        
        // Check if user has a pending VIP request
        const checkVIPRequest = async () => {
            if (currentUser && (currentUser.role === UserRole.Farmer || currentUser.role === UserRole.Provider)) {
                const request = await getUserVIPRequest(currentUser._id);
                setHasVIPRequest(!!request);
            }
        };
        checkVIPRequest();
    }, [currentUser]);
    
    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const countryName = e.target.value;
        setSelectedCountry(countryName);
        setSelectedCity('');
        const country = countries.find(c => c.name === countryName);
        setCities(country ? country.cities : []);
    };
    
    const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const cityName = e.target.value;
        setSelectedCity(cityName);
        const city = cities.find(c => c.name === cityName);
        if (city) {
            setLocation([city.lat, city.lon]);
        }
    };
    
    const handleMarkerDragEnd = (newLocation: [number, number]) => {
        setLocation(newLocation);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSuccessMessage('');
        try {
            await updateCurrentUser({
                name,
                phone,
                location: {
                    type: 'Point',
                    coordinates: [location[1], location[0]], // [lon, lat]
                },
            });
            setSuccessMessage(t('profile.updateSuccess'));
            setTimeout(() => setSuccessMessage(''), 3000); // Clear message after 3 seconds
        } catch (error) {
            console.error(error);
            alert(t('profile.updateError'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleRequestVIPUpgrade = async () => {
        if (!currentUser) return;
        
        setIsRequestingVIP(true);
        const request = await requestVIPUpgrade(currentUser._id);
        
        if (request) {
            setHasVIPRequest(true);
            setSuccessMessage('VIP upgrade request submitted successfully! An admin will review your request.');
            setTimeout(() => setSuccessMessage(''), 5000);
        }
        
        setIsRequestingVIP(false);
    };

    if (!currentUser) {
        return <p>{t('profile.loading')}</p>;
    }

    const canRequestVIPUpgrade = currentUser.role === UserRole.Farmer || currentUser.role === UserRole.Provider;

    return (
        <div className="container mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-slate-800 border-b pb-2">{t('profile.title')}</h2>
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">{t('profile.emailLabel')}</label>
                        <input type="email" value={currentUser.email} disabled className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm bg-slate-100 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700">{t('profile.nameLabel')}</label>
                        <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-slate-700">{t('profile.phoneLabel')}</label>
                        <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('profile.phonePlaceholder')} className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
                    </div>
                    
                    {/* Location Selection */}
                    <div className="space-y-4">
                        <p className="block text-sm font-medium text-slate-700">{t('profile.locationTitle')}</p>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="country" className="block text-xs text-slate-600">{t('profile.countryLabel')}</label>
                                <select id="country" value={selectedCountry} onChange={handleCountryChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md">
                                    <option value="">{t('profile.selectCountry')}</option>
                                    {countries.map(country => <option key={country.name} value={country.name}>{country.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="city" className="block text-xs text-slate-600">{t('profile.cityLabel')}</label>
                                <select id="city" value={selectedCity} onChange={handleCityChange} disabled={!selectedCountry} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md disabled:bg-slate-100">
                                    <option value="">{t('profile.selectCity')}</option>
                                    {cities.map(city => <option key={city.name} value={city.name}>{city.name}</option>)}
                                </select>
                            </div>
                        </div>
                         <div className="p-2 border rounded-md bg-slate-50 text-center text-sm">
                            <p className="text-slate-600">{t('profile.mapInstruction')}</p>
                            <span className="font-mono text-xs text-emerald-700">Lat: {location[0].toFixed(4)}, Lon: {location[1].toFixed(4)}</span>
                        </div>
                        <DynamicMap 
                            center={location}
                            markers={[]} 
                            draggableMarkerPosition={location}
                            onMarkerDragEnd={handleMarkerDragEnd}
                        />
                    </div>

                    {successMessage && (
                        <div className="p-3 text-sm text-emerald-800 bg-emerald-100 rounded-md" role="alert">
                            {successMessage}
                        </div>
                    )}

                    <div className="flex items-center justify-end space-x-4 pt-4">
                        <Button type="button" onClick={() => setView('dashboard')} className="px-4 py-2 text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg">
                            {t('profile.backButton')}
                        </Button>
                        <Button type="submit" disabled={isSaving} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isSaving ? t('profile.savingButton') : t('profile.saveButton')}
                        </Button>
                    </div>
                </form>

                {/* VIP Upgrade Request Section */}
                {canRequestVIPUpgrade && (
                    <div className="mt-6 p-6 bg-linear-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200">
                        <h3 className="text-xl font-semibold text-slate-800 mb-2">Upgrade to VIP Account</h3>
                        <p className="text-sm text-slate-600 mb-4">
                            VIP accounts get access to both farmer and provider features, allowing you to post demands and offers.
                        </p>
                        {hasVIPRequest ? (
                            <div className="p-3 text-sm text-amber-800 bg-amber-100 rounded-md">
                                Your VIP upgrade request is pending admin approval.
                            </div>
                        ) : (
                            <Button 
                                onClick={handleRequestVIPUpgrade}
                                disabled={isRequestingVIP}
                                className="bg-linear-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-300"
                            >
                                {isRequestingVIP ? 'Submitting Request...' : 'Request VIP Upgrade'}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
