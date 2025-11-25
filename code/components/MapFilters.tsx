import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface MapFiltersState {
  showOffers: boolean;
  showDemands: boolean;
  machineType: string;
  radiusKm: number;
}

interface MapFiltersProps {
  filters: MapFiltersState;
  onFiltersChange: (filters: MapFiltersState) => void;
  availableMachineTypes: string[];
}

const MapFilters: React.FC<MapFiltersProps> = ({ filters, onFiltersChange, availableMachineTypes }) => {
  const handleToggleOffers = () => {
    onFiltersChange({ ...filters, showOffers: !filters.showOffers });
  };

  const handleToggleDemands = () => {
    onFiltersChange({ ...filters, showDemands: !filters.showDemands });
  };

  const handleMachineTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ ...filters, machineType: e.target.value });
  };

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      onFiltersChange({ ...filters, radiusKm: value });
    }
  };

  const handleResetFilters = () => {
    onFiltersChange({
      showOffers: true,
      showDemands: true,
      machineType: 'all',
      radiusKm: 50
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md space-y-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-slate-700">Map Filters</h3>
        <Button
          onClick={handleResetFilters}
          className="text-xs px-3 py-1 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded"
        >
          Reset
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Type Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-600">Show on Map</Label>
          <div className="flex flex-col space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.showOffers}
                onChange={handleToggleOffers}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">
                Offers <span className="text-blue-600 font-semibold">●</span>
              </span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.showDemands}
                onChange={handleToggleDemands}
                className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
              />
              <span className="text-sm text-slate-700">
                Demands <span className="text-orange-600 font-semibold">●</span>
              </span>
            </label>
          </div>
        </div>

        {/* Machine Type Filter */}
        <div className="space-y-2">
          <Label htmlFor="machineType" className="text-sm font-medium text-slate-600">
            Machine Type
          </Label>
          <select
            id="machineType"
            value={filters.machineType}
            onChange={handleMachineTypeChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
          >
            <option value="all">All Machines</option>
            {availableMachineTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Radius Filter */}
        <div className="space-y-2">
          <Label htmlFor="radius" className="text-sm font-medium text-slate-600">
            Radius (km)
          </Label>
          <Input
            id="radius"
            type="number"
            min="0"
            step="5"
            value={filters.radiusKm}
            onChange={handleRadiusChange}
            className="w-full"
            placeholder="50"
          />
          <p className="text-xs text-slate-500">
            Show items within {filters.radiusKm}km from your location
          </p>
        </div>

        {/* Active Filters Summary */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-600">Active Filters</Label>
          <div className="text-xs text-slate-600 space-y-1">
            <p>
              Type: {filters.showOffers && filters.showDemands ? 'All' : filters.showOffers ? 'Offers only' : filters.showDemands ? 'Demands only' : 'None'}
            </p>
            <p>
              Machine: {filters.machineType === 'all' ? 'All types' : filters.machineType}
            </p>
            <p>
              Radius: {filters.radiusKm} km
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapFilters;
