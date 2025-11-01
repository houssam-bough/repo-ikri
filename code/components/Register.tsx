import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { UserRole, City } from '../types';
import { countries } from '../services/locationData';
import Map from './Map';

const Register: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.Farmer);
    const { register } = useAuth();
    const { t } = useLanguage();

    // Location state
    const [location, setLocation] = useState<[number, number]>([40.7128, -74.0060]); // Default to New York
    const [selectedCountry, setSelectedCountry] = useState<string>('');
    const [selectedCity, setSelectedCity] = useState<string>('');
    const [cities, setCities] = useState<City[]>([]);

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
        } catch (error: any) {
            alert(error.message);
        }
    };

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
                        <label htmlFor="country" className="block text-xs text-slate-600">{t('register.countryLabel')}</label>
                        <select id="country" value={selectedCountry} onChange={handleCountryChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md">
                            <option value="">{t('register.selectCountry')}</option>
                            {countries.map(country => <option key={country.name} value={country.name}>{country.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="city" className="block text-xs text-slate-600">{t('register.cityLabel')}</label>
                        <select id="city" value={selectedCity} onChange={handleCityChange} disabled={!selectedCountry} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md disabled:bg-slate-100">
                            <option value="">{t('register.selectCity')}</option>
                            {cities.map(city => <option key={city.name} value={city.name}>{city.name}</option>)}
                        </select>
                    </div>
                </div>
                    <div className="p-2 border rounded-md bg-slate-50 text-center text-sm">
                    <p className="text-slate-600">{t('register.mapInstruction')}</p>
                    <span className="font-mono text-xs text-emerald-700">Lat: {location[0].toFixed(4)}, Lon: {location[1].toFixed(4)}</span>
                </div>
                <Map 
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
                </select>
            </div>
            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300">
                {t('register.registerButton')}
            </button>
        </form>
    );
};

export default Register;
