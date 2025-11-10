"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Reservation, ReservationStatus, UserRole } from '@/types';
import { getApprovedReservationsForOffer, getReservationsForOffer } from '@/services/apiService';
import AvailabilityCalendar from './AvailabilityCalendar';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';

interface AvailabilityDialogProps {
  offerId: string;
  offerTitle?: string;
  isProviderView?: boolean; // provider sees all (with farmer name), public sees anonymized
  offerOwnerId?: string;
  onClose: () => void;
}

interface DayReservationInfo {
  id: string;
  start: Date;
  end: Date;
  farmerName?: string;
  status: ReservationStatus;
}

const formatHM = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const AvailabilityDialog: React.FC<AvailabilityDialogProps> = ({ offerId, offerTitle, isProviderView = false, offerOwnerId, onClose }) => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>(() => 'calendar');
  const today = new Date();
  const [month, setMonth] = useState<number>(today.getMonth());
  const [year, setYear] = useState<number>(today.getFullYear());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const reservations = isProviderView
          ? await getReservationsForOffer(offerId) // provider sees all statuses
          : await getApprovedReservationsForOffer(offerId); // public sees only approved
        setAllReservations(reservations);
      } catch (e) {
        console.error('Failed to load reservations for availability', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [offerId, isProviderView]);

  const reservationsForSelectedDay: DayReservationInfo[] = allReservations
    .filter(r => new Date(r.reservedTimeSlot.start).toISOString().split('T')[0] === selectedDate ||
                 new Date(r.reservedTimeSlot.end).toISOString().split('T')[0] === selectedDate)
    .map(r => ({
      id: r._id,
      start: new Date(r.reservedTimeSlot.start),
      end: new Date(r.reservedTimeSlot.end),
      farmerName: r.farmerName,
      status: r.status
    }))
    .sort((a,b) => a.start.getTime() - b.start.getTime());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl p-4 relative max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-2xl font-bold text-slate-800 mb-1">{offerTitle || t('availability.title') || 'Availability'}</h3>
        <p className="text-sm text-slate-500 mb-4">
          {isProviderView ? 'You see all reservations including pending and rejected.' : 'Showing approved reserved slots only.'}
        </p>

        <div className="flex flex-col md:flex-row gap-3 mb-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('availability.selectDate') || 'Select a date'}</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={() => { const d = new Date(year, month - 1, 1); setMonth(d.getMonth()); setYear(d.getFullYear()); }} className="px-3 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg">◀</Button>
            <div className="min-w-[140px] text-center text-sm font-medium text-slate-700 self-end pb-1">{new Date(year, month, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
            <Button onClick={() => { const d = new Date(year, month + 1, 1); setMonth(d.getMonth()); setYear(d.getFullYear()); }} className="px-3 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg">▶</Button>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex gap-2 mb-2">
            <Button onClick={() => setViewMode('calendar')} className={`px-3 py-1.5 rounded-lg text-sm ${viewMode==='calendar' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>Calendar</Button>
            <Button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded-lg text-sm ${viewMode==='list' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>List</Button>
          </div>
          {viewMode === 'calendar' ? (
            <AvailabilityCalendar
              reservations={allReservations}
              month={month}
              year={year}
              onDayClick={(iso) => setSelectedDate(iso)}
              selectedDateIso={selectedDate}
              isProviderView={isProviderView}
              currentUserRole={currentUser?.role as UserRole}
              currentUserId={currentUser?._id}
              offerOwnerId={offerOwnerId}
            />
          ) : null}
        </div>

        <div className="mb-2">
          <h4 className="text-lg font-semibold text-slate-700 mb-2">{t('availability.reservedSlots') || 'Reserved Slots'}</h4>
          {loading ? (
            <p className="text-sm text-slate-500">{t('availability.loading') || 'Loading...'}</p>
          ) : reservationsForSelectedDay.length === 0 ? (
            <p className="text-sm text-slate-500">{t('availability.noReservations') || 'No reservations for this day.'}</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {reservationsForSelectedDay.map(res => (
                <li key={res.id} className="p-3 border rounded-lg bg-slate-50 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {formatHM(res.start)} – {formatHM(res.end)}
                    </p>
                    {isProviderView || currentUser?.role === UserRole.VIP ? (
                      <p className="text-xs text-slate-500 mt-0.5">Farmer: {res.farmerName}</p>
                    ) : (
                      <p className="text-xs text-slate-500 mt-0.5">{t('availability.booked') || 'Booked'}</p>
                    )}
                  </div>
                  {(isProviderView || currentUser?.role === UserRole.VIP) && (
                    <span className={`text-[10px] uppercase tracking-wide font-semibold px-2 py-1 rounded-full ${
                      res.status === ReservationStatus.Approved ? 'bg-emerald-100 text-emerald-700' :
                      res.status === ReservationStatus.Pending ? 'bg-amber-100 text-amber-700' :
                      res.status === ReservationStatus.Rejected ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {res.status}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg">
            {t('availability.close') || 'Close'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityDialog;
