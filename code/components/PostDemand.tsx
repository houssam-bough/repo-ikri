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
import { SERVICE_TYPES, CROP_TYPES, getServiceName, getMachineName, getMachineSubcategory, getCropName } from '../constants/serviceTypes';
import { getCityNames, getCityCoordinates } from '../constants/majorCities';

interface PostDemandProps {
    setView: SetAppView;
}

const PostDemand: React.FC<PostDemandProps> = ({ setView }) => {
    const { currentUser } = useAuth();
    const { t, language } = useLanguage();
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
    const allCities = getCityNames(language);

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
            popupContent: `<strong>${t('postDemandPage.mapYouAreHere')}</strong><br/>${currentUser.name}`,
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
                            <p style="font-size: 12px; margin-bottom: 4px;"><strong>${t('postDemandPage.mapProvider')}:</strong> ${offer.providerName}</p>
                            <p style="font-size: 12px; margin-bottom: 4px;"><strong>${t('postDemandPage.mapRate')}:</strong> ${offer.priceRate} ${t('postDemandPage.mapMadPerDay')}</p>
                            <p style="font-size: 11px; color: #64748b;">${t('postDemandPage.mapAvailable')}: ${offer.availability.map(a => 
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
                alert(t('postDemandPage.photoSizeError'));
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
            alert(t('postDemandPage.validationServiceType'));
            return;
        }

        if (!machineType) {
            alert(t('postDemandPage.validationMachine'));
            return;
        }

        if (!cropType) {
            alert(t('postDemandPage.validationCropType'));
            return;
        }

        if (cropType === 'autre' && !otherCropType.trim()) {
            alert(t('postDemandPage.validationSpecifyCrop'));
            return;
        }

        if (!area || parseFloat(area) <= 0) {
            alert(t('postDemandPage.validationArea'));
            return;
        }

        if (!selectedCity) {
            alert(t('postDemandPage.validationCity'));
            return;
        }

        if (!address.trim()) {
            alert(t('postDemandPage.validationAddress'));
            return;
        }
        
        if (!startDate || !endDate) {
            alert(t('postDemandPage.validationDates'));
            return;
        }
        
        setIsSubmitting(true);
        try {
            let uploadedPhotoUrl = null;
            if (photoFile) {
                uploadedPhotoUrl = await uploadToCloudinary(photoFile);
                if (!uploadedPhotoUrl) {
                    alert(t('postDemandPage.photoUploadFailed'));
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
                    title: t('postDemandPage.successToastTitle'),
                    description: `${t('postDemandPage.successToastDescription')} ${selectedCity}`,
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
                alert(data.error || t('postDemandPage.errorGeneral'));
            }
        } catch (error) {
            console.error(error);
            alert(t('postDemandPage.errorGeneral'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLocationChange = (lat: number, lon: number) => {
        setLatitude(lat);
        setLongitude(lon);
    };

    const fieldClass = "mt-2 block w-full px-4 py-3 bg-white text-gray-800 border-2 border-gray-200 rounded-xl text-base transition-all focus:outline-none focus:border-[#4C9A2A] focus:ring-2 focus:ring-[#4C9A2A]/20";

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#4C9A2A]/5 via-orange-50/30 to-white px-4 py-6">
            <div className="max-w-lg mx-auto pb-8">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#FF8C1A]/10 mb-3">
                        <span className="text-2xl">🌾</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 font-heading">{t('postDemandPage.headingTitle')}</h2>
                    <div className="w-12 h-1 bg-gradient-to-r from-[#4C9A2A] to-[#FF8C1A] mx-auto mt-2 rounded-full"></div>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* ── Section: Service & Machine ── */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#4C9A2A]/10 text-sm">🔧</span>
                            <h3 className="text-base font-bold text-[#4C9A2A] font-heading">{t('postDemandPage.serviceTypeLabel')}</h3>
                        </div>

                        <div>
                            <Label htmlFor="serviceType" className="text-sm font-semibold text-gray-700">
                                {t('postDemandPage.serviceTypeLabel')} <span className="text-red-500">*</span>
                            </Label>
                            <select 
                                id="serviceType" 
                                value={serviceType} 
                                onChange={(e) => setServiceType(e.target.value)} 
                                required 
                                className={fieldClass}
                            >
                                <option value="">-- {t('postDemandPage.selectServiceType')} --</option>
                                {SERVICE_TYPES.map(service => (
                                    <option key={service.id} value={service.id}>
                                        {getServiceName(service, language)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {serviceType && (
                            <div>
                                <Label htmlFor="machineType" className="text-sm font-semibold text-gray-700">
                                    {t('postDemandPage.machineTypeLabel')} <span className="text-red-500">*</span>
                                </Label>
                                <select 
                                    id="machineType" 
                                    value={machineType} 
                                    onChange={(e) => setMachineType(e.target.value)} 
                                    required 
                                    className={fieldClass}
                                >
                                    <option value="">-- {t('postDemandPage.selectMachineTypeOption')} --</option>
                                    {availableMachines.map((machine, index) => (
                                        <option key={index} value={machine.name}>
                                            {getMachineSubcategory(machine, language) && `${getMachineSubcategory(machine, language)} - `}{getMachineName(machine, language)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* ── Section: Crop Details ── */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#FF8C1A]/10 text-sm">🌱</span>
                            <h3 className="text-base font-bold text-[#FF8C1A] font-heading">{t('postDemandPage.cropTypeLabel')}</h3>
                        </div>

                        <div>
                            <Label htmlFor="cropType" className="text-sm font-semibold text-gray-700">
                                {t('postDemandPage.cropTypeLabel')} <span className="text-red-500">*</span>
                            </Label>
                            <select 
                                id="cropType" 
                                value={cropType} 
                                onChange={(e) => setCropType(e.target.value)} 
                                required 
                                className={fieldClass}
                            >
                                <option value="">-- {t('postDemandPage.selectCropType')} --</option>
                                {CROP_TYPES.map(crop => (
                                    <option key={crop.id} value={crop.id}>
                                        {getCropName(crop, language)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {cropType === 'autre' && (
                            <div>
                                <Label htmlFor="otherCropType" className="text-sm font-semibold text-gray-700">
                                    {t('postDemandPage.specifyCropTypeLabel')} <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="otherCropType"
                                    type="text"
                                    value={otherCropType}
                                    onChange={(e) => setOtherCropType(e.target.value)}
                                    placeholder={t('postDemandPage.specifyCropPlaceholder')}
                                    required
                                    className="mt-2 rounded-xl border-2 border-gray-200 px-4 py-3 text-base focus:border-[#4C9A2A] focus:ring-2 focus:ring-[#4C9A2A]/20"
                                />
                            </div>
                        )}

                        <div>
                            <Label htmlFor="area" className="text-sm font-semibold text-gray-700">
                                {t('postDemandPage.areaLabel')} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="area"
                                type="number"
                                step="0.1"
                                min="0.1"
                                value={area}
                                onChange={(e) => setArea(e.target.value)}
                                placeholder={t('postDemandPage.areaPlaceholder')}
                                required
                                className="mt-2 rounded-xl border-2 border-gray-200 px-4 py-3 text-base focus:border-[#4C9A2A] focus:ring-2 focus:ring-[#4C9A2A]/20"
                            />
                        </div>

                        <div>
                            <Label htmlFor="notes" className="text-sm font-semibold text-gray-700">
                                {t('postDemandPage.notesLabel')}
                            </Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder={t('postDemandPage.notesPlaceholder')}
                                rows={4}
                                className="mt-2 rounded-xl border-2 border-gray-200 px-4 py-3 text-base focus:border-[#4C9A2A] focus:ring-2 focus:ring-[#4C9A2A]/20"
                            />
                        </div>
                    </div>

                    {/* ── Section: Location ── */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#4C9A2A]/10 text-sm">📍</span>
                            <h3 className="text-base font-bold text-[#4C9A2A] font-heading">{t('postDemandPage.cityLabel')}</h3>
                        </div>

                        <div>
                            <Label htmlFor="city" className="text-sm font-semibold text-gray-700">
                                {t('postDemandPage.cityLabel')} <span className="text-red-500">*</span>
                            </Label>
                            <select 
                                id="city" 
                                value={selectedCity} 
                                onChange={(e) => setSelectedCity(e.target.value)} 
                                required 
                                className={fieldClass}
                            >
                                <option value="">-- {t('postDemandPage.selectCityOption')} --</option>
                                {allCities.map(city => (
                                    <option key={city} value={city}>
                                        {city}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-400 mt-1">
                                {t('postDemandPage.cityMapHint')}
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="address" className="text-sm font-semibold text-gray-700">
                                {t('postDemandPage.addressLabel')} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="address"
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder={t('postDemandPage.addressPlaceholder')}
                                required
                                className="mt-2 rounded-xl border-2 border-gray-200 px-4 py-3 text-base focus:border-[#4C9A2A] focus:ring-2 focus:ring-[#4C9A2A]/20"
                            />
                        </div>

                        <div className="rounded-2xl overflow-hidden border-2 border-gray-200">
                            <InteractiveLocationPicker
                                initialLat={latitude}
                                initialLon={longitude}
                                onLocationChange={handleLocationChange}
                                city={selectedCity}
                            />
                        </div>
                    </div>

                    {/* ── Section: Period ── */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#4C9A2A]/10 text-sm">📅</span>
                            <h3 className="text-base font-bold text-[#4C9A2A] font-heading">{t('postDemandPage.periodFrom')}</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="start-date" className="text-sm font-semibold text-gray-700">
                                    {t('postDemandPage.periodFrom')} <span className="text-red-500">*</span>
                                </Label>
                                <input 
                                    id="start-date" 
                                    type="date" 
                                    value={startDate} 
                                    onChange={(e) => setStartDate(e.target.value)} 
                                    required 
                                    className={fieldClass} 
                                />
                            </div>
                            <div>
                                <Label htmlFor="end-date" className="text-sm font-semibold text-gray-700">
                                    {t('postDemandPage.periodTo')} <span className="text-red-500">*</span>
                                </Label>
                                <input 
                                    id="end-date" 
                                    type="date" 
                                    value={endDate} 
                                    onChange={(e) => setEndDate(e.target.value)} 
                                    required 
                                    className={fieldClass} 
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Section: Photo ── */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#FF8C1A]/10 text-sm">📸</span>
                            <h3 className="text-base font-bold text-[#FF8C1A] font-heading">{t('postDemandPage.fieldPhotoLabel')}</h3>
                        </div>

                        <label htmlFor="photo" className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${photoPreview ? 'border-[#4C9A2A] bg-[#4C9A2A]/5' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
                            {photoPreview ? (
                                <img src={photoPreview} alt={t('postDemandPage.photoPreviewAlt')} className="h-32 rounded-lg object-cover" />
                            ) : (
                                <div className="flex flex-col items-center">
                                    <span className="text-3xl mb-1">📷</span>
                                    <span className="text-sm text-gray-500">{t('postDemandPage.fieldPhotoLabel')}</span>
                                </div>
                            )}
                            <input 
                                id="photo" 
                                type="file" 
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="hidden"
                            />
                        </label>
                        <p className="text-xs text-gray-400">
                            {t('postDemandPage.photoHelpText')}
                        </p>
                    </div>

                    {/* Action Button */}
                    <div className="space-y-3 pt-2">
                        <Button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="w-full py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-[#4C9A2A] to-[#3d8422] hover:from-[#3d8422] hover:to-[#357a1e] shadow-lg shadow-[#4C9A2A]/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-body"
                        >
                            {isSubmitting ? `📤 ${t('postDemandPage.publishing')}` : `📢 ${t('postDemandPage.publishMyDemand')}`}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PostDemand;
