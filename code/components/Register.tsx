import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { Button } from '@/components/ui/button'
import { UserRole } from '../types';
import { getRegions, getCitiesByRegion, getCityCoordinates, getRegionCoordinates } from '@/constants/moroccoRegions';
import DynamicMap from './DynamicMap';

interface RegisterProps {
    onSwitchToLogin?: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
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
                phone,
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
            <div className="px-4 py-12">
                <div className="max-w-md mx-auto text-center">
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-amber-100">
                        <h3 className="text-2xl font-bold text-slate-800 mb-3">{t('register.pendingTitle')}</h3>
                        <p className="text-slate-600 leading-relaxed">{t('register.pendingMessage')}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex justify-center">
            <div className="max-w-3xl w-full px-4 py-8">
                {/* Header Section */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-slate-800 mb-2">{t('register.title')}</h2>
                    <p className="text-slate-600">Rejoignez la communauté agricole IKRI</p>
                </div>

                {/* Form Card */}
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-slate-100">
                    {/* Name Input */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">{t('register.nameLabel')}</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <input 
                                type="text" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                required 
                                placeholder="Votre nom complet"
                                className="block w-full pl-10 pr-3 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 sm:text-sm"
                            />
                        </div>
                    </div>

                    {/* Email Input */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">{t('register.emailLabel')}</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                </svg>
                            </div>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                                placeholder="votre@email.com"
                                className="block w-full pl-10 pr-3 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 sm:text-sm"
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">{t('register.passwordLabel')}</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <input 
                                type="password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                                placeholder="••••••••"
                                className="block w-full pl-10 pr-3 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 sm:text-sm"
                            />
                        </div>
                    </div>

                    {/* Phone Input */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Numéro de téléphone</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </div>
                            <input 
                                type="tel" 
                                value={phone} 
                                onChange={(e) => setPhone(e.target.value)} 
                                placeholder="+212 6XX XXX XXX"
                                className="block w-full pl-10 pr-3 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 sm:text-sm"
                            />
                        </div>
                    </div>

                    {/* Role Selection */}
                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-slate-700">Je m'inscris en tant que :</label>
                        <div className="grid grid-cols-1 gap-3">
                            <label className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${role === UserRole.Farmer ? 'border-emerald-500 bg-emerald-50 shadow-md' : 'border-slate-200 hover:border-emerald-300'}`}>
                                <input 
                                    type="radio" 
                                    name="role" 
                                    value={UserRole.Farmer}
                                    checked={role === UserRole.Farmer}
                                    onChange={(e) => setRole(e.target.value as UserRole)}
                                    className="sr-only"
                                />
                                <div className="flex items-center gap-4 w-full">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 shadow-sm">
                                        <span className="text-2xl">🌾</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-800">Agriculteur</p>
                                        <p className="text-xs text-slate-600">Je cherche des machines à louer</p>
                                    </div>
                                    {role === UserRole.Farmer && (
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600">
                                            <span className="text-white text-sm">✓</span>
                                        </div>
                                    )}
                                </div>
                            </label>

                            <label className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${role === UserRole.Provider ? 'border-emerald-500 bg-emerald-50 shadow-md' : 'border-slate-200 hover:border-emerald-300'}`}>
                                <input 
                                    type="radio" 
                                    name="role" 
                                    value={UserRole.Provider}
                                    checked={role === UserRole.Provider}
                                    onChange={(e) => setRole(e.target.value as UserRole)}
                                    className="sr-only"
                                />
                                <div className="flex items-center gap-4 w-full">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 shadow-sm">
                                        <span className="text-2xl">🚜</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-800">Prestataire</p>
                                        <p className="text-xs text-slate-600">Je propose mes machines en location</p>
                                    </div>
                                    {role === UserRole.Provider && (
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600">
                                            <span className="text-white text-sm">✓</span>
                                        </div>
                                    )}
                                </div>
                            </label>

                            <label className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${role === UserRole.Both ? 'border-emerald-500 bg-emerald-50 shadow-md' : 'border-slate-200 hover:border-emerald-300'}`}>
                                <input 
                                    type="radio" 
                                    name="role" 
                                    value={UserRole.Both}
                                    checked={role === UserRole.Both}
                                    onChange={(e) => setRole(e.target.value as UserRole)}
                                    className="sr-only"
                                />
                                <div className="flex items-center gap-4 w-full">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 shadow-sm">
                                        <span className="text-2xl">🌾🚜</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-800">Les deux</p>
                                        <p className="text-xs text-slate-600">Je cherche ET je propose des machines</p>
                                    </div>
                                    {role === UserRole.Both && (
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600">
                                            <span className="text-white text-sm">✓</span>
                                        </div>
                                    )}
                                </div>
                            </label>
                        </div>
                    </div>
                    
                    {/* Location Selection */}
                    <div className="space-y-4">
                        <p className="block text-sm font-semibold text-slate-700">{t('register.locationTitle')}</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="region" className="block text-xs font-medium text-slate-600 mb-1">{t('register.regionLabel')}</label>
                                <select 
                                    id="region" 
                                    value={selectedRegion} 
                                    onChange={handleRegionChange} 
                                    className="block w-full pl-3 pr-10 py-2.5 text-base bg-slate-50 text-slate-900 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm rounded-lg transition-all duration-200"
                                >
                                    <option value="">{t('register.selectRegion')}</option>
                                    {regions.map(region => <option key={region} value={region}>{region}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="city" className="block text-xs font-medium text-slate-600 mb-1">{t('register.cityLabel')}</label>
                                <select 
                                    id="city" 
                                    value={selectedCity} 
                                    onChange={handleCityChange} 
                                    disabled={!selectedRegion} 
                                    className="block w-full pl-3 pr-10 py-2.5 text-base bg-slate-50 text-slate-900 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm rounded-lg disabled:bg-slate-100 disabled:cursor-not-allowed transition-all duration-200"
                                >
                                    <option value="">{t('register.selectCity')}</option>
                                    {cities.map(city => <option key={city} value={city}>{city}</option>)}
                                </select>
                            </div>
                        </div>
                        
                        <div className="p-3 border border-slate-200 rounded-lg bg-slate-50 text-center">
                            <p className="text-xs text-slate-600 mb-1">{t('register.mapInstruction')}</p>
                            <span className="font-mono text-xs text-emerald-700 font-semibold">
                                Lat: {location[0].toFixed(4)}, Lon: {location[1].toFixed(4)}
                            </span>
                        </div>
                        
                        <div className="rounded-lg overflow-hidden border-2 border-slate-200 shadow-sm">
                            <DynamicMap 
                                center={location}
                                markers={[]} 
                                draggableMarkerPosition={location}
                                onMarkerDragEnd={handleMarkerDragEnd}
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <Button 
                        type="submit" 
                        className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                    >
                        {t('register.registerButton')}
                    </Button>

                    {/* Switch to Login */}
                    {onSwitchToLogin && (
                        <div className="mt-6 text-center">
                            <p className="text-sm text-slate-600">
                                Vous avez déjà un compte ?{' '}
                                <button
                                    type="button"
                                    onClick={onSwitchToLogin}
                                    className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors duration-200"
                                >
                                    Connectez-vous
                                </button>
                            </p>
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-slate-600">
                        En vous inscrivant, vous rejoignez la plateforme de location agricole IKRI
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
