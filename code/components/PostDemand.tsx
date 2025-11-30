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

interface MachineTemplate {
  id: string
  name: string
  description: string | null
  isActive: boolean
}

interface PostDemandProps {
    setView: SetAppView;
}

const PostDemand: React.FC<PostDemandProps> = ({ setView }) => {
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const { toast } = useToast();

    // Machine template state
    const [machineTemplates, setMachineTemplates] = useState<MachineTemplate[]>([]);
    const [selectedMachine, setSelectedMachine] = useState('');
    const [loadingTemplates, setLoadingTemplates] = useState(true);

    // New fields
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [city, setCity] = useState('');
    const [address, setAddress] = useState('');

    // Existing fields
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [latitude, setLatitude] = useState(currentUser?.location.coordinates[1] || 33.5731);
    const [longitude, setLongitude] = useState(currentUser?.location.coordinates[0] || -7.5898);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localOffers, setLocalOffers] = useState<Offer[]>([]);

    // Fetch machine templates
    useEffect(() => {
        const fetchTemplates = async () => {
            setLoadingTemplates(true);
            try {
                const response = await fetch('/api/machine-templates?active=true');
                const data = await response.json();
                setMachineTemplates(data.templates || []);
            } catch (error) {
                console.error('Failed to fetch machine templates:', error);
            } finally {
                setLoadingTemplates(false);
            }
        };
        fetchTemplates();
    }, []);

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
                            <p style="font-size: 12px; margin-bottom: 4px;"><strong>Rate:</strong> $${offer.priceRate}/hr</p>
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
        
        if (!title.trim()) {
            alert('Please enter a title for your request');
            return;
        }

        if (!city.trim()) {
            alert('Please enter a city');
            return;
        }

        if (!address.trim()) {
            alert('Please enter an address');
            return;
        }
        
        if (!selectedMachine) {
            alert('Please select a machine type');
            return;
        }
        
        if (!startDate || !endDate) {
            alert(t('postDemand.dateError'));
            return;
        }
        
        setIsSubmitting(true);
        try {
            let uploadedPhotoUrl = null;
            if (photoFile) {
                uploadedPhotoUrl = await uploadToCloudinary(photoFile);
                if (!uploadedPhotoUrl) {
                    alert('Failed to upload photo. Please try again.');
                    setIsSubmitting(false);
                    return;
                }
            }

            const response = await fetch('/api/demands', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    farmerId: currentUser._id,
                    farmerName: currentUser.name,
                    title: title.trim(),
                    city: city.trim(),
                    address: address.trim(),
                    requiredService: selectedMachine,
                    description: description.trim() || undefined,
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
                // Show success toast
                toast({
                    title: "✅ Request published successfully!",
                    description: `Your request "${title}" has been published in ${city}`,
                    duration: 5000,
                });

                // Refresh local offers after posting demand
                if (currentUser) {
                    const offers = await findLocalOffers(currentUser.location);
                    setLocalOffers(offers);
                }
                
                setTimeout(() => {
                    setView('dashboard');
                }, 1000);
            } else {
                const data = await response.json();
                alert(data.error || t('postDemand.submitError'));
            }
        } catch (error) {
            console.error(error);
            alert(t('postDemand.submitError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLocationChange = (lat: number, lon: number) => {
        setLatitude(lat);
        setLongitude(lon);
    };

    return (
        <div className="container mx-auto max-w-6xl pt-16">
            <h2 className="text-3xl font-bold mb-6 text-slate-800 border-b pb-2">{t('common.publishDemand')}</h2>
            
            <div className="bg-white p-8 rounded-xl shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title */}
                    <div>
                        <Label htmlFor="title" className="text-sm font-medium text-slate-700">
                            Request Title <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Labour de 10 hectares"
                            required
                            className="mt-1"
                        />
                    </div>

                    {/* Machine Type Selection */}
                    <div>
                        <Label htmlFor="machineType" className="text-sm font-medium text-slate-700">
                            {t('common.machineType')} <span className="text-red-500">*</span>
                        </Label>
                        {loadingTemplates ? (
                            <p className="text-sm text-slate-500 mt-2">{t('common.loading')}</p>
                        ) : machineTemplates.length === 0 ? (
                            <p className="text-sm text-red-500 mt-2">No machine types available. Contact admin.</p>
                        ) : (
                            <select 
                                id="machineType" 
                                value={selectedMachine} 
                                onChange={(e) => setSelectedMachine(e.target.value)} 
                                required 
                                className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="">{t('common.selectMachine')}</option>
                                {machineTemplates.map(template => (
                                    <option key={template.id} value={template.name}>
                                        {template.name}
                                        {template.description ? ` - ${template.description}` : ''}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                            Detailed Description <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe your need in detail: terrain type, specific constraints, special conditions..."
                            rows={4}
                            required
                            className="mt-1"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            The more detailed your description, the better your chances of finding the right provider
                        </p>
                    </div>

                    {/* City and Address */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="city" className="text-sm font-medium text-slate-700">
                                {t('common.city')} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="city"
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="Ex: Casablanca"
                                required
                                className="mt-1"
                                list="moroccan-cities"
                            />
                            <datalist id="moroccan-cities">
                                <option value="Casablanca" />
                                <option value="Rabat" />
                                <option value="Fès" />
                                <option value="Marrakech" />
                                <option value="Agadir" />
                                <option value="Tanger" />
                                <option value="Meknès" />
                                <option value="Oujda" />
                                <option value="Kenitra" />
                                <option value="Tétouan" />
                                <option value="Safi" />
                                <option value="Mohammedia" />
                                <option value="Khouribga" />
                                <option value="El Jadida" />
                                <option value="Béni Mellal" />
                                <option value="Nador" />
                            </datalist>
                        </div>
                        <div>
                            <Label htmlFor="address" className="text-sm font-medium text-slate-700">
                                {t('common.address')} <span className="text-red-500">*</span>
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
                    </div>

                    {/* Interactive Location Picker */}
                    <div>
                        <Label className="text-sm font-medium text-slate-700 mb-2 block">
                            Map Location <span className="text-red-500">*</span>
                        </Label>
                        <InteractiveLocationPicker
                            initialLat={latitude}
                            initialLon={longitude}
                            onLocationChange={handleLocationChange}
                            city={city}
                        />
                    </div>

                    {/* Time slots */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="start-date" className="text-sm font-medium text-slate-700">
                                Start Date & Time <span className="text-red-500">*</span>
                            </Label>
                            <input 
                                id="start-date" 
                                type="datetime-local" 
                                value={startDate} 
                                onChange={(e) => setStartDate(e.target.value)} 
                                required 
                                className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500" 
                            />
                        </div>
                        <div>
                            <Label htmlFor="end-date" className="text-sm font-medium text-slate-700">
                                End Date & Time <span className="text-red-500">*</span>
                            </Label>
                            <input 
                                id="end-date" 
                                type="datetime-local" 
                                value={endDate} 
                                onChange={(e) => setEndDate(e.target.value)} 
                                required 
                                className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500" 
                            />
                        </div>
                    </div>

                    {/* Photo */}
                    <div>
                        <Label htmlFor="photo" className="text-sm font-medium text-slate-700">
                            {t('common.photoOptional')}
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
                                <img src={photoPreview} alt="Preview" className="max-h-48 rounded-md border-2 border-slate-300" />
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                        <Button 
                            type="button" 
                            onClick={() => setView('dashboard')} 
                            className="py-2 px-6 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? `📤 ${t('common.submitting')}` : `📢 ${t('common.publishDemand')}`}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PostDemand;
