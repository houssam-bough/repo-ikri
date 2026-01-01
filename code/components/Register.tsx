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
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [role] = useState<UserRole>(UserRole.Both); // Force le rôle Hybride pour le marché marocain
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { register } = useAuth();
    const { t } = useLanguage();

    // Location state
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
        
        const coords = getRegionCoordinates(region);
        if (coords) {
            setLocation(coords);
        }
    };

    const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const city = e.target.value;
        setSelectedCity(city);
        
        const coords = getCityCoordinates(city);
        if (coords) {
            setLocation(coords);
        }
    };
    
    const handleMarkerDragEnd = (newLocation: [number, number]) => {
        setLocation(newLocation);
        // Force map to recenter on new location
        setTimeout(() => {
            setLocation([...newLocation] as [number, number]);
        }, 100);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            alert('Les mots de passe ne correspondent pas');
            return;
        }
        
        try {
            await register({
                name,
                email,
                password,
                phone,
                role,
                location: {
                    type: 'Point',
                    coordinates: [location[1], location[0]],
                },
            });
            setRegistrationSuccess(true);
        } catch (error: any) {
            alert(error.message);
        }
    };

    if (registrationSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-4">Merci pour votre inscription !</h3>
                    <p className="text-slate-600 leading-relaxed text-base">
                        Votre demande a été reçue avec succès. Notre équipe va examiner votre compte et l'approuver dans les prochaines minutes.
                    </p>
                    <p className="text-slate-500 text-sm mt-4">
                        Vous recevrez une notification par email dès que votre compte sera activé.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Panel */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-500 via-emerald-500 to-emerald-600 p-12 flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-white rounded-full -translate-x-1/3 -translate-y-1/3"></div>
                    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white rounded-full translate-x-1/3 translate-y-1/3"></div>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 text-white mb-16">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                            <svg className="w-8 h-8 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.53-.85-6-4.03-6-7.5V8.3l6-3.11 6 3.11v4.2c0 3.47-2.47 6.65-6 7.5z"/>
                                <path d="M9.5 11l-2 2 3.5 3.5 6-6-2-2-4 4z"/>
                            </svg>
                        </div>
                        <span className="text-3xl font-bold tracking-tight">YKRI</span>
                    </div>

                    <div className="text-white space-y-6">
                        <h1 className="text-5xl font-bold leading-tight">
                            L'Uber du<br />matériel agricole
                        </h1>
                        <p className="text-xl text-white/90 leading-relaxed">
                            Connectez-vous à une communauté d'agriculteurs et de<br />
                            prestataires à travers tout le Maroc.
                        </p>
                        
                        <div className="space-y-4 pt-4">
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-semibold text-lg">100% Sécurisé</p>
                                    <p className="text-white/80 text-sm">Vérification KYC et paiements protégés</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-semibold text-lg">Réservation Rapide</p>
                                    <p className="text-white/80 text-sm">Trouvez une machine en quelques clics</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-white/80 text-sm">
                    © 2024 YKRI - Tous droits réservés
                </div>
            </div>

            {/* Right Panel */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gray-50 overflow-y-auto">
                <div className="w-full max-w-lg py-8">
                    <div className="lg:hidden flex justify-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.53-.85-6-4.03-6-7.5V8.3l6-3.11 6 3.11v4.2c0 3.47-2.47 6.65-6 7.5z"/>
                                    <path d="M9.5 11l-2 2 3.5 3.5 6-6-2-2-4 4z"/>
                                </svg>
                            </div>
                            <span className="text-2xl font-bold text-slate-800">YKRI</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-800 mb-1">Créer un compte</h2>
                            <p className="text-slate-500 text-sm">Rejoignez la communauté YKRI en quelques minutes</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Role Selection - Masqué pour le marché marocain (tous les comptes sont Hybrides) */}
                            
                            {/* Section 1 */}
                            <div className="border-t pt-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                                    <h3 className="text-base font-bold text-slate-800">Informations personnelles</h3>
                                </div>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">Nom de société/domaine</label>
                                        <input
                                            id="name"
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            placeholder="Ferme Al Baraka"
                                            className="block w-full px-4 py-2.5 bg-gray-50 text-slate-900 border border-gray-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">Téléphone</label>
                                            <input
                                                id="phone"
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                required
                                                placeholder="06 12 34 56 78"
                                                className="block w-full px-4 py-2.5 bg-gray-50 text-slate-900 border border-gray-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                                            <input
                                                id="email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                placeholder="exemple@email.com"
                                                className="block w-full px-4 py-2.5 bg-gray-50 text-slate-900 border border-gray-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Localisation</label>
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <select 
                                                value={selectedRegion} 
                                                onChange={handleRegionChange}
                                                className="block w-full px-4 py-2.5 bg-gray-50 text-slate-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            >
                                                <option value="">Sélectionner région</option>
                                                {regions.map(region => <option key={region} value={region}>{region}</option>)}
                                            </select>
                                            <select 
                                                value={selectedCity} 
                                                onChange={handleCityChange}
                                                disabled={!selectedRegion}
                                                className="block w-full px-4 py-2.5 bg-gray-50 text-slate-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                                            >
                                                <option value="">Sélectionner ville</option>
                                                {cities.map(city => <option key={city} value={city}>{city}</option>)}
                                            </select>
                                        </div>
                                        
                                        <div className="rounded-lg overflow-hidden border-2 border-gray-200 h-64">
                                            <DynamicMap 
                                                center={location}
                                                markers={[]} 
                                                draggableMarkerPosition={location}
                                                onMarkerDragEnd={handleMarkerDragEnd}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1.5">📍 Lat: {location[0].toFixed(4)}, Lon: {location[1].toFixed(4)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2 */}
                            <div className="border-t pt-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                                    <h3 className="text-base font-bold text-slate-800">Sécurité</h3>
                                </div>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">Mot de passe</label>
                                        <div className="relative">
                                            <input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                placeholder="Minimum 8 caractères"
                                                className="block w-full px-4 py-2.5 bg-gray-50 text-slate-900 border border-gray-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">Confirmer le mot de passe</label>
                                        <div className="relative">
                                            <input
                                                id="confirmPassword"
                                                type={showConfirmPassword ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                placeholder="Retapez votre mot de passe"
                                                className="block w-full px-4 py-2.5 bg-gray-50 text-slate-900 border border-gray-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
                            >
                                Créer mon compte
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </Button>

                            {onSwitchToLogin && (
                                <button
                                    type="button"
                                    onClick={onSwitchToLogin}
                                    className="w-full py-3 px-4 bg-white border-2 border-emerald-500 text-emerald-600 font-semibold rounded-lg hover:bg-emerald-50"
                                >
                                    J'ai déjà un compte
                                </button>
                            )}
                            
                            <p className="text-xs text-center text-slate-500">
                                En créant un compte, vous acceptez nos <a href="#" className="text-emerald-600 hover:underline">Conditions d'utilisation</a> et notre <a href="#" className="text-emerald-600 hover:underline">Politique de confidentialité</a>.
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
