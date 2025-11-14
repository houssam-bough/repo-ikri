import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { Button } from '@/components/ui/button'
import { UserRole } from '../types';
import { getRegions, getCitiesByRegion, getCityCoordinates, getRegionCoordinates } from '@/constants/moroccoRegions';
import DynamicMap from './DynamicMap';

const Register: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.Farmer);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const { register } = useAuth();
    const { t } = useLanguage();

    // Location state - Default to Morocco center (approximately Rabat)
    const [location, setLocation] = useState<[number, number]>([33.9716, -6.8498]);
    const [selectedRegion, setSelectedRegion] = useState<string>('');
    const [selectedCity, setSelectedCity] = useState<string>('');
    const [cities, setCities] = useState<string[]>([]);
    const regions = getRegions();

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const region = e.target.value;
    setSelectedRegion(region);
    const regionCities = getCitiesByRegion(region);
    setCities(regionCities);
    setSelectedCity('');
    
    // Update map to region center
    const coords = getRegionCoordinates(region);
    if (coords) {
      setLocation(coords);
    }
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const city = e.target.value;
    setSelectedCity(city);
    
    // Update map to city coordinates
    const coords = getCityCoordinates(city);
    if (coords) {
      setLocation(coords);
    }
  };    const handleMarkerDragEnd = (newLocation: [number, number]) => {
        setLocation(newLocation);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await register({
                name,
                email,
                password,
                role,
                location: {
                    type: 'Point',
                    coordinates: [location[1], location[0]], // [lon, lat]
                },
            });
            setRegistrationSuccess(true);
        } catch (error: any) {
            alert(error.message);
        }
    };

    if (registrationSuccess) {
        return (
            <div className="space-y-6 text-center">
                <h2 className="text-2xl font-bold text-slate-800">{t('register.title')}</h2>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                    <div className="text-4xl mb-4">⏳</div>
                    <h3 className="text-xl font-semibold text-amber-800 mb-2">{t('register.pendingTitle')}</h3>
                    <p className="text-slate-700">{t('register.pendingMessage')}</p>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-slate-800">{t('register.title')}</h2>
            <div>
                <label className="block text-sm font-medium text-slate-700">{t('register.nameLabel')}</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700">{t('register.emailLabel')}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700">{t('register.passwordLabel')}</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
            </div>
            
            {/* Location Selection */}
            <div className="space-y-4">
                <p className="block text-sm font-medium text-slate-700">{t('register.locationTitle')}</p>
                <div className="grid grid-cols-2 gap-4">
                        <div>
                        <label htmlFor="region" className="block text-xs text-slate-600">{t('register.regionLabel')}</label>
                        <select id="region" value={selectedRegion} onChange={handleRegionChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md">
                            <option value="">{t('register.selectRegion')}</option>
                            {regions.map(region => <option key={region} value={region}>{region}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="city" className="block text-xs text-slate-600">{t('register.cityLabel')}</label>
                        <select id="city" value={selectedCity} onChange={handleCityChange} disabled={!selectedRegion} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md disabled:bg-slate-100">
                            <option value="">{t('register.selectCity')}</option>
                            {cities.map(city => <option key={city} value={city}>{city}</option>)}
                        </select>
                    </div>
                </div>
                    <div className="p-2 border rounded-md bg-slate-50 text-center text-sm">
                    <p className="text-slate-600">{t('register.mapInstruction')}</p>
                    <span className="font-mono text-xs text-emerald-700">Lat: {location[0].toFixed(4)}, Lon: {location[1].toFixed(4)}</span>
                </div>
                <DynamicMap 
                    center={location}
                    markers={[]} 
                    draggableMarkerPosition={location}
                    onMarkerDragEnd={handleMarkerDragEnd}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700">{t('register.roleLabel')}</label>
                <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md">
                    <option value={UserRole.Farmer}>{t('register.roleFarmer')}</option>
                    <option value={UserRole.Provider}>{t('register.roleProvider')}</option>
                    <option value={UserRole.VIP}>VIP</option>
                </select>
            </div>
            <Button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-linear-to-r from-emerald-500 to-teal-500 transition-all duration-300">
                {t('register.registerButton')}
            </Button>
        </form>
    );
};

export default Register;
