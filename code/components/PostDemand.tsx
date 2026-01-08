import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { findLocalOffers } from '../services/apiService';
import { SetAppView, type Offer } from '../types';
import DynamicMap, { type MapMarker } from './DynamicMap';
import InteractiveLocationPicker from './InteractiveLocationPicker';
import { addRandomOffset50m, isSameLocation } from '../services/geoService';
import { useToast } from '@/hooks/use-toast';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { SERVICE_TYPES, CROP_TYPES } from '../constants/serviceTypes';
import { getCityNames, getCityCoordinates } from '../constants/majorCities';

interface PostDemandProps {
    setView: SetAppView;
}

const PostDemand: React.FC<PostDemandProps> = ({ setView }) => {
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const { toast } = useToast();

    // Form state
    const [serviceType, setServiceType] = useState('');
    const [machineType, setMachineType] = useState('');
    const [cropType, setCropType] = useState('');
    const [otherCropType, setOtherCropType] = useState('');
    const [area, setArea] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [address, setAddress] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [latitude, setLatitude] = useState(currentUser?.location.coordinates[1] || 33.5731);
    const [longitude, setLongitude] = useState(currentUser?.location.coordinates[0] || -7.5898);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localOffers, setLocalOffers] = useState<Offer[]>([]);

    // Get available machines based on selected service type
    const availableMachines = serviceType 
        ? SERVICE_TYPES.find(st => st.id === serviceType)?.machines || []
        : [];

    // Get major cities only
    const allCities = getCityNames();

    // Reset machine type when service type changes
    useEffect(() => {
        setMachineType('');
    }, [serviceType]);

    // Update map center when city is selected
    useEffect(() => {
        if (selectedCity) {
            const coords = getCityCoordinates(selectedCity);
            if (coords) {
                setLatitude(coords[0]);
                setLongitude(coords[1]);
            }
        }
    }, [selectedCity]);

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

        // Group offers by equipmentType (machine) instead of provider
        const offersByMachine = localOffers.reduce((acc, offer) => {
            if (!acc[offer.equipmentType]) {
                acc[offer.equipmentType] = [];
            }
            acc[offer.equipmentType].push(offer);
            return acc;
        }, {} as Record<string, typeof localOffers>);

        // Create one marker per machine type
        Object.entries(offersByMachine).forEach(([machineType, machineOffers]) => {
            machineOffers.forEach((offer) => {
                const originalLat = offer.serviceAreaLocation.coordinates[1]
                const originalLon = offer.serviceAreaLocation.coordinates[0]
                const position = getUniquePosition(originalLat, originalLon)
                
                const popupContent = `
                    <div style="max-width: 250px;">
                        <strong style="font-size: 14px; color: #0284c7;">📍 ${machineType}</strong>
                        <div style="margin-top: 8px; padding: 8px 0; border-top: 2px solid #0284c7;">
                            <p style="font-size: 12px; margin-bottom: 4px;"><strong>Provider:</strong> ${offer.providerName}</p>
                            <p style="font-size: 12px; margin-bottom: 4px;"><strong>Rate:</strong> ${offer.priceRate} MAD/jour</p>
                            <p style="font-size: 11px; color: #64748b;">Available: ${offer.availability.map(a => 
                                new Date(a.start).toLocaleDateString()
                            ).join(', ')}</p>
                        </div>
                    </div>
                `
                
                markers.push({
                    position,
                    popupContent,
                    type: "offer" as const,
                    equipmentType: machineType,
                    itemId: offer._id
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
            setPhotoFile(file);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!serviceType) {
            alert('Veuillez sélectionner un type de prestation');
            return;
        }

        if (!machineType) {
            alert('Veuillez sélectionner un type de machine');
            return;
        }

        if (!cropType) {
            alert('Veuillez sélectionner un type de culture');
            return;
        }

        if (cropType === 'autre' && !otherCropType.trim()) {
            alert('Veuillez préciser le type de culture');
            return;
        }

        if (!area || parseFloat(area) <= 0) {
            alert('Veuillez entrer une superficie valide');
            return;
        }

        if (!selectedCity) {
            alert('Veuillez sélectionner une ville');
            return;
        }

        if (!address.trim()) {
            alert('Veuillez entrer une adresse');
            return;
        }
        
        if (!startDate || !endDate) {
            alert('Veuillez sélectionner les dates de prestation');
            return;
        }
        
        setIsSubmitting(true);
        try {
            let uploadedPhotoUrl = null;
            if (photoFile) {
                uploadedPhotoUrl = await uploadToCloudinary(photoFile);
                if (!uploadedPhotoUrl) {
                    alert('Échec du téléchargement de la photo. Veuillez réessayer.');
                    setIsSubmitting(false);
                    return;
                }
            }

            const selectedServiceType = SERVICE_TYPES.find(st => st.id === serviceType);
            const finalCropType = cropType === 'autre' ? otherCropType : CROP_TYPES.find(ct => ct.id === cropType)?.name || cropType;

            const response = await fetch('/api/demands', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    farmerId: currentUser._id,
                    farmerName: currentUser.name,
                    title: `${selectedServiceType?.name} - ${machineType}`,
                    city: selectedCity,
                    address: address.trim(),
                    requiredService: machineType,
                    serviceType: serviceType,
                    cropType: finalCropType,
                    area: parseFloat(area),
                    description: notes.trim() || undefined,
                    requiredTimeSlot: {
                        start: new Date(startDate),
                        end: new Date(endDate),
                    },
                    jobLocation: {
                        type: 'Point',
                        coordinates: [longitude, latitude],
                    },
                    photoUrl: uploadedPhotoUrl || undefined
                })
            });

            if (response.ok) {
                toast({
                    title: "✅ Demande publiée avec succès !",
                    description: `Votre demande a été publiée à ${selectedCity}`,
                    duration: 5000,
                });

                if (currentUser) {
                    const offers = await findLocalOffers(currentUser.location);
                    setLocalOffers(offers);
                }
                
                setTimeout(() => {
                    setView('dashboard');
                }, 1000);
            } else {
                const data = await response.json();
                alert(data.error || 'Erreur lors de la publication');
            }
        } catch (error) {
            console.error(error);
            alert('Erreur lors de la publication');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLocationChange = (lat: number, lon: number) => {
        setLatitude(lat);
        setLongitude(lon);
    };

    return (
        <div className="bg-linear-to-br from-slate-50 to-emerald-50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-slate-800 border-b pb-2">📢 Publier un Besoin</h2>
            
            <div className="bg-white p-8 rounded-xl shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Type de Prestation */}
                    <div>
                        <Label htmlFor="serviceType" className="text-sm font-medium text-slate-700">
                            Type de Prestation <span className="text-red-500">*</span>
                        </Label>
                        <select 
                            id="serviceType" 
                            value={serviceType} 
                            onChange={(e) => setServiceType(e.target.value)} 
                            required 
                            className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="">-- Sélectionnez un type de prestation --</option>
                            {SERVICE_TYPES.map(service => (
                                <option key={service.id} value={service.id}>
                                    {service.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Type de Machine (dépend du type de prestation) */}
                    {serviceType && (
                        <div>
                            <Label htmlFor="machineType" className="text-sm font-medium text-slate-700">
                                Type de Machine <span className="text-red-500">*</span>
                            </Label>
                            <select 
                                id="machineType" 
                                value={machineType} 
                                onChange={(e) => setMachineType(e.target.value)} 
                                required 
                                className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="">-- Sélectionnez un type de machine --</option>
                                {availableMachines.map((machine, index) => (
                                    <option key={index} value={machine.name}>
                                        {machine.subcategory && `${machine.subcategory} - `}{machine.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Type de Culture */}
                    <div>
                        <Label htmlFor="cropType" className="text-sm font-medium text-slate-700">
                            Type de Culture <span className="text-red-500">*</span>
                        </Label>
                        <select 
                            id="cropType" 
                            value={cropType} 
                            onChange={(e) => setCropType(e.target.value)} 
                            required 
                            className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="">-- Sélectionnez un type de culture --</option>
                            {CROP_TYPES.map(crop => (
                                <option key={crop.id} value={crop.id}>
                                    {crop.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Autre Type de Culture (si "Autre" sélectionné) */}
                    {cropType === 'autre' && (
                        <div>
                            <Label htmlFor="otherCropType" className="text-sm font-medium text-slate-700">
                                Précisez le Type de Culture <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="otherCropType"
                                type="text"
                                value={otherCropType}
                                onChange={(e) => setOtherCropType(e.target.value)}
                                placeholder="Ex: Plantes médicinales"
                                required
                                className="mt-1"
                            />
                        </div>
                    )}

                    {/* Superficie Approximative */}
                    <div>
                        <Label htmlFor="area" className="text-sm font-medium text-slate-700">
                            Superficie Approximative (hectares) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="area"
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={area}
                            onChange={(e) => setArea(e.target.value)}
                            placeholder="Ex: 10.5"
                            required
                            className="mt-1"
                        />
                    </div>

                    {/* Observation / Note (facultative) */}
                    <div>
                        <Label htmlFor="notes" className="text-sm font-medium text-slate-700">
                            Observation ou Note (facultatif)
                        </Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Informations complémentaires : type de sol, contraintes spécifiques, conditions particulières..."
                            rows={4}
                            className="mt-1"
                        />
                    </div>

                    {/* Ville */}
                    <div>
                        <Label htmlFor="city" className="text-sm font-medium text-slate-700">
                            Ville <span className="text-red-500">*</span>
                        </Label>
                        <select 
                            id="city" 
                            value={selectedCity} 
                            onChange={(e) => setSelectedCity(e.target.value)} 
                            required 
                            className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="">-- Sélectionnez une ville --</option>
                            {allCities.map(city => (
                                <option key={city} value={city}>
                                    {city}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-1">
                            La carte se déplacera automatiquement vers la ville sélectionnée
                        </p>
                    </div>

                    {/* Adresse */}
                    <div>
                        <Label htmlFor="address" className="text-sm font-medium text-slate-700">
                            Adresse <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="address"
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Ex: Hay Hassani, Route principale"
                            required
                            className="mt-1"
                        />
                    </div>

                    {/* Interactive Location Picker */}
                    <div>
                        <Label className="text-sm font-medium text-slate-700 mb-2 block">
                            Localisation GPS <span className="text-red-500">*</span>
                        </Label>
                        <p className="text-xs text-slate-500 mb-2">
                            Déplacez le marqueur pour préciser la localisation exacte
                        </p>
                        <InteractiveLocationPicker
                            initialLat={latitude}
                            initialLon={longitude}
                            onLocationChange={handleLocationChange}
                            city={selectedCity}
                        />
                    </div>

                    {/* Période de Prestation */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="start-date" className="text-sm font-medium text-slate-700">
                                Période De <span className="text-red-500">*</span>
                            </Label>
                            <input 
                                id="start-date" 
                                type="date" 
                                value={startDate} 
                                onChange={(e) => setStartDate(e.target.value)} 
                                required 
                                className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500" 
                            />
                        </div>
                        <div>
                            <Label htmlFor="end-date" className="text-sm font-medium text-slate-700">
                                Période À <span className="text-red-500">*</span>
                            </Label>
                            <input 
                                id="end-date" 
                                type="date" 
                                value={endDate} 
                                onChange={(e) => setEndDate(e.target.value)} 
                                required 
                                className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500" 
                            />
                        </div>
                    </div>

                    {/* Photo du Champ (optionnel) */}
                    <div>
                        <Label htmlFor="photo" className="text-sm font-medium text-slate-700">
                            Photo du Champ (optionnel)
                        </Label>
                        <input 
                            id="photo" 
                            type="file" 
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500" 
                        />
                        {photoPreview && (
                            <div className="mt-3">
                                <img src={photoPreview} alt="Aperçu" className="max-h-48 rounded-md border-2 border-slate-300" />
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">
                            Une photo aide les prestataires à mieux comprendre votre besoin
                        </p>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center justify-center pt-6 border-t">
                        <Button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="py-3 px-8 border border-transparent rounded-md shadow-lg text-base font-medium text-white bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? '📤 Publication en cours...' : '📢 Publier ma Demande'}
                        </Button>
                    </div>
                </form>
            </div>
            </div>
        </div>
    );
};

export default PostDemand;
