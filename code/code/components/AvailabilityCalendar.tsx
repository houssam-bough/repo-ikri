"use client";
import React, { useMemo } from 'react';
import { Reservation, ReservationStatus, UserRole } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

interface AvailabilityCalendarProps {
  reservations: Reservation[]; // already filtered (public = approved only, provider = all)
  month: number; // 0-11
  year: number; // full year
  onDayClick: (dateIso: string) => void;
  selectedDateIso?: string;
  isProviderView?: boolean;
  currentUserRole?: UserRole;
  currentUserId?: string;
  offerOwnerId?: string;
}

// Produce an array of weeks, each week array of Date objects (or null for padding)
function buildMonthMatrix(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1);
  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = [];
  // Pad start
  for (let i = 0; i < firstDay.getDay(); i++) currentWeek.push(null);
  let day = firstDay;
  while (day.getMonth() === month) {
    currentWeek.push(new Date(day));
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
  }
  // Pad end
  if (currentWeek.length) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }
  return weeks;
}

// Expand multi-day reservations into day segments for rendering bars spanning days
interface DaySegment {
  dateKey: string; // YYYY-MM-DD
  reservation: Reservation;
  isStart: boolean;
  isEnd: boolean;
}

function splitReservationsIntoDaySegments(reservations: Reservation[]): DaySegment[] {
  const segments: DaySegment[] = [];
  reservations.forEach(r => {
    const start = new Date(r.reservedTimeSlot.start);
    const end = new Date(r.reservedTimeSlot.end);
    // Normalize to midnight boundaries
    const cursor = new Date(start);
    while (cursor <= end) {
      const dateKey = cursor.toISOString().split('T')[0];
      segments.push({
        dateKey,
        reservation: r,
        isStart: dateKey === start.toISOString().split('T')[0],
        isEnd: dateKey === end.toISOString().split('T')[0]
      });
      cursor.setDate(cursor.getDate() + 1);
    }
  });
  return segments;
}

const statusColors: Record<ReservationStatus, string> = {
  [ReservationStatus.Pending]: 'bg-amber-300/70 border-amber-400',
  [ReservationStatus.Approved]: 'bg-emerald-400/80 border-emerald-500',
  [ReservationStatus.Rejected]: 'bg-rose-300/70 border-rose-400',
  [ReservationStatus.Cancelled]: 'bg-slate-300/60 border-slate-400'
};

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  reservations,
  month,
  year,
  onDayClick,
  selectedDateIso,
  isProviderView,
  currentUserRole,
  currentUserId,
  offerOwnerId,
}) => {
  const { t } = useLanguage();
  const weeks = useMemo(() => buildMonthMatrix(year, month), [year, month]);
  const segments = useMemo(() => splitReservationsIntoDaySegments(reservations), [reservations]);

  // Group segments by day
  const segmentsByDay = useMemo(() => {
    return segments.reduce((acc, seg) => {
      if (!acc[seg.dateKey]) acc[seg.dateKey] = [] as DaySegment[];
      acc[seg.dateKey].push(seg);
      return acc;
    }, {} as Record<string, DaySegment[]>);
  }, [segments]);

  // Provider always sees names. VIP sees names only when viewing their own offer
  const showNames = Boolean(
    isProviderView || (currentUserRole === UserRole.VIP && currentUserId && offerOwnerId && currentUserId === offerOwnerId)
  );

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1 text-xs font-medium text-slate-600">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="text-center py-1">{d}</div>)}
      </div>
      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((day, di) => {
              const dateKey = day ? day.toISOString().split('T')[0] : `pad-${wi}-${di}`;
              const daySegments = day ? segmentsByDay[dateKey] || [] : [];
              const isSelected = selectedDateIso === dateKey;
              return (
                <div
                  key={dateKey}
                  className={cn('min-h-20 rounded border p-0.5 flex flex-col relative overflow-hidden',
                    day ? 'bg-white hover:bg-slate-50 cursor-pointer' : 'bg-transparent border-transparent',
                    isSelected && 'ring-2 ring-emerald-500')}
                  onClick={() => day && onDayClick(dateKey)}
                >
                  {day && (
                    <div className="text-[10px] font-semibold text-slate-700 mb-0.5">
                      {day.getDate()}
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5 w-full">
                    {daySegments.slice(0,3).map(seg => {
                      const r = seg.reservation;
                      const color = statusColors[r.status];
                      return (
                        <div
                          key={r._id + seg.dateKey}
                          className={cn('text-[9px] leading-tight px-1 py-0.5 rounded-sm border truncate text-white font-medium', color, !seg.isStart && 'rounded-l-none', !seg.isEnd && 'rounded-r-none')}
                          title={`${r.equipmentType} ${r.reservedTimeSlot.start.toLocaleString()} - ${r.reservedTimeSlot.end.toLocaleString()}`}
                        >
                          {showNames ? r.farmerName : t('availability.booked')}
                        </div>
                      );
                    })}
                    {daySegments.length > 3 && (
                      <div className="text-[9px] text-slate-500">+{daySegments.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvailabilityCalendar;
