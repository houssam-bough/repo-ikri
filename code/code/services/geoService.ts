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

/**
 * Adds a random offset of approximately 50 meters to coordinates.
 * This prevents markers from overlapping when multiple items are at the same location.
 * @param lat - Original latitude
 * @param lon - Original longitude
 * @returns New coordinates [lat, lon] with random offset
 */
export function addRandomOffset50m(lat: number, lon: number): [number, number] {
    // 1 degree latitude ≈ 111 km
    // 50 meters ≈ 0.00045 degrees
    const offsetLat = (Math.random() - 0.5) * 0.0009; // Random between -50m and +50m
    
    // Longitude degrees vary by latitude, compensate for that
    const offsetLon = (Math.random() - 0.5) * 0.0009 / Math.cos(deg2rad(lat));
    
    return [lat + offsetLat, lon + offsetLon];
}

/**
 * Checks if two positions are at the same location (within 10 meters)
 * @param pos1 - First position [lat, lon]
 * @param pos2 - Second position [lat, lon]
 * @returns true if positions are essentially the same
 */
export function isSameLocation(pos1: [number, number], pos2: [number, number]): boolean {
    const point1: GeoJSONPoint = { type: 'Point', coordinates: [pos1[1], pos1[0]] };
    const point2: GeoJSONPoint = { type: 'Point', coordinates: [pos2[1], pos2[0]] };
    return getDistanceInKm(point1, point2) < 0.01; // Less than 10 meters
}
