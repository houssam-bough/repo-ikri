import { GeoJSONPoint } from '../types';

/**
 * Calculates the distance between two points in kilometers using the Haversine formula.
 * @param point1 - The first GeoJSON point { coordinates: [lon, lat] }.
 * @param point2 - The second GeoJSON point { coordinates: [lon, lat] }.
 * @returns The distance in kilometers.
 */
export function getDistanceInKm(point1: GeoJSONPoint, point2: GeoJSONPoint): number {
    const R = 6371; // Radius of the Earth in km
    const [lon1, lat1] = point1.coordinates;
    const [lon2, lat2] = point2.coordinates;

    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
}

function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
}
