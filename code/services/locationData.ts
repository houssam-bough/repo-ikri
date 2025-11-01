import { Country } from '../types';

export const countries: Country[] = [
    {
        name: 'United States',
        cities: [
            { name: 'New York', lat: 40.7128, lon: -74.0060 },
            { name: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
            { name: 'Chicago', lat: 41.8781, lon: -87.6298 },
            { name: 'Houston', lat: 29.7604, lon: -95.3698 },
            { name: 'Phoenix', lat: 33.4484, lon: -112.0740 },
            { name: 'Des Moines', lat: 41.5868, lon: -93.6250 },
        ],
    },
    {
        name: 'Canada',
        cities: [
            { name: 'Toronto', lat: 43.6532, lon: -79.3832 },
            { name: 'Montreal', lat: 45.5017, lon: -73.5673 },
            { name: 'Vancouver', lat: 49.2827, lon: -123.1207 },
            { name: 'Calgary', lat: 51.0447, lon: -114.0719 },
            { name: 'Ottawa', lat: 45.4215, lon: -75.6972 },
        ],
    },
    {
        name: 'France',
        cities: [
            { name: 'Paris', lat: 48.8566, lon: 2.3522 },
            { name: 'Marseille', lat: 43.2965, lon: 5.3698 },
            { name: 'Lyon', lat: 45.7640, lon: 4.8357 },
            { name: 'Toulouse', lat: 43.6047, lon: 1.4442 },
            { name: 'Nice', lat: 43.7102, lon: 7.2620 },
        ],
    },
    {
        name: 'Mexico',
        cities: [
            { name: 'Mexico City', lat: 19.4326, lon: -99.1332 },
            { name: 'Guadalajara', lat: 20.6597, lon: -103.3496 },
            { name: 'Monterrey', lat: 25.6866, lon: -100.3161 },
            { name: 'Puebla', lat: 19.0414, lon: -98.2063 },
            { name: 'Tijuana', lat: 32.5149, lon: -117.0382 },
        ],
    },
];
