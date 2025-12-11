import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/hooks/useLanguage';

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
  const { t } = useLanguage();

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
        <h3 className="text-lg font-semibold text-slate-700">{t('common.mapFilters')}</h3>
        <Button
          onClick={handleResetFilters}
          className="text-xs px-3 py-1 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded"
        >
          {t('common.reset')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Type Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-600">{t('common.showOnMap')}</Label>
          <div className="flex flex-col space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.showOffers}
                onChange={handleToggleOffers}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">
                {t('common.offers')} <span className="text-blue-600 font-semibold">●</span>
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
                {t('common.demands')} <span className="text-orange-600 font-semibold">●</span>
              </span>
            </label>
          </div>
        </div>

        {/* Machine Type Filter */}
        <div className="space-y-2">
          <Label htmlFor="machineType" className="text-sm font-medium text-slate-600">
            {t('common.machineType')}
          </Label>
          <select
            id="machineType"
            value={filters.machineType}
            onChange={handleMachineTypeChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
          >
            <option value="all">{t('common.allMachines')}</option>
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
            {t('common.radiusKm')}
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
            {t('common.showItemsWithin').replace('{{radius}}', filters.radiusKm.toString())}
          </p>
        </div>

        {/* Active Filters Summary */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-600">{t('common.activeFilters')}</Label>
          <div className="text-xs text-slate-600 space-y-1">
            <p>
              {t('common.type')}: {filters.showOffers && filters.showDemands ? t('common.allTypes') : filters.showOffers ? t('common.offersOnly') : filters.showDemands ? t('common.demandsOnly') : t('common.none')}
            </p>
            <p>
              {t('common.machine')}: {filters.machineType === 'all' ? t('common.allTypesMachines') : filters.machineType}
            </p>
            <p>
              {t('common.radius')}: {filters.radiusKm} km
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapFilters;
