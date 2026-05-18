import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { inr } from '@/utils/ursSession';
import type { CarOption } from './VehicleSelector';

export type TripTab = 'hourly' | 'multiday' | 'outstation';

export interface BookingSummaryData {
  tab: TripTab;
  pickup: string;
  destination?: string;
  date: string;
  time?: string;
  duration?: string;
  days?: number;
  car: CarOption;
  baseFare?: number;
  nightCharge?: number;
  total?: number;
  cancellationCharge?: number;
}

interface BookingSummaryModalProps {
  open: boolean;
  data: BookingSummaryData;
  onEdit: () => void;
  onConfirm: () => void;
}

const tabLabels: Record<TripTab, string> = {
  hourly: 'Hourly',
  multiday: 'Multi-Day',
  outstation: 'Outstation',
};

export function BookingSummaryModal({
  open,
  data,
  onEdit,
  onConfirm,
}: BookingSummaryModalProps) {
  const [termsOpen, setTermsOpen] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={onEdit}
      />
      <div className="relative w-full sm:max-w-lg bg-gray-50 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Booking Summary</h3>

        <div className="bg-white rounded-2xl shadow p-5 mb-4 space-y-2 text-sm">
          <p><span className="text-gray-500">📍 Pickup:</span> <span className="font-medium">{data.pickup}</span></p>
          {data.destination && (
            <p><span className="text-gray-500">📍 Destination:</span> <span className="font-medium">{data.destination}</span></p>
          )}
          <p><span className="text-gray-500">📅 Date:</span> <span className="font-medium">{data.date}</span></p>
          {data.time && (
            <p><span className="text-gray-500">🕐 Time:</span> <span className="font-medium">{data.time}</span></p>
          )}
          {data.duration && (
            <p><span className="text-gray-500">⏱️ Duration:</span> <span className="font-medium">{data.duration}</span></p>
          )}
          {data.days != null && data.tab === 'multiday' && (
            <p><span className="text-gray-500">📆 Days:</span> <span className="font-medium">{data.days}</span></p>
          )}
          <p><span className="text-gray-500">🚗 Car:</span> <span className="font-medium">{data.car.emoji} {data.car.name}</span></p>
          <p><span className="text-gray-500">🚙 Trip Type:</span> <span className="font-medium">{tabLabels[data.tab]}</span></p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-4">
          <h4 className="font-bold text-emerald-800 mb-3">Fare Breakdown</h4>
          {data.tab === 'hourly' && data.baseFare != null && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Base Fare</span>
                <span className="font-semibold">{inr.format(data.baseFare)}</span>
              </div>
              {(data.nightCharge ?? 0) > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Night Charge (after 9 PM)</span>
                  <span className="font-semibold">{inr.format(data.nightCharge!)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-emerald-800 pt-2 border-t border-emerald-200">
                <span>Total</span>
                <span>{inr.format(data.total ?? data.baseFare + (data.nightCharge ?? 0))}</span>
              </div>
              {data.cancellationCharge && (
                <div className="flex justify-between text-xs text-gray-600 pt-2 border-t border-emerald-100">
                  <span>Cancellation Charge</span>
                  <span className="font-semibold">{inr.format(data.cancellationCharge)}</span>
                </div>
              )}
            </div>
          )}
          {data.tab === 'multiday' && data.total != null && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{data.days} {data.days === 1 ? 'day' : 'days'}</span>
                <span className="font-bold text-emerald-800">{inr.format(data.total)}</span>
              </div>
              {data.cancellationCharge && (
                <div className="flex justify-between text-xs text-gray-600 pt-2 border-t border-emerald-100">
                  <span>Cancellation Charge</span>
                  <span className="font-semibold">{inr.format(data.cancellationCharge)}</span>
                </div>
              )}
            </div>
          )}
          {data.tab === 'outstation' && data.baseFare != null && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Base Fare</span>
                <span className="font-semibold">{inr.format(data.baseFare)}</span>
              </div>
              {(data.nightCharge ?? 0) > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Night Charge (after 9 PM)</span>
                  <span className="font-semibold">{inr.format(data.nightCharge!)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-emerald-800 pt-2 border-t border-emerald-200">
                <span>Total</span>
                <span>{inr.format(data.total ?? data.baseFare + (data.nightCharge ?? 0))}</span>
              </div>
              {data.cancellationCharge && (
                <div className="flex justify-between text-xs text-gray-600 pt-2 border-t border-emerald-100">
                  <span>Cancellation Charge</span>
                  <span className="font-semibold">{inr.format(data.cancellationCharge)}</span>
                </div>
              )}
              <p className="text-xs text-gray-600 mt-2 pt-2 border-t border-emerald-100">
                * Fooding & Lodging from customer side
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setTermsOpen(!termsOpen)}
          className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 mb-2"
        >
          Terms & Conditions
          {termsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {termsOpen && (
          <ul className="text-xs text-gray-600 space-y-1 mb-4 pl-2">
            <li>• Min booking: 4 hours</li>
            <li>• Cancellation: ₹500</li>
            <li>• Night charge after 9PM: ₹200</li>
            <li>• Fooding & lodging: customer&apos;s side</li>
            <li>• Outstation price: depends on destination</li>
          </ul>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onEdit}
            className="flex-1 border-2 border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-100 transition-colors"
          >
            ← Edit Booking
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Confirm & Book →
          </button>
        </div>
        <p className="text-xs text-gray-500 text-center mt-4">
          🔒 Car + Driver Included · Online/Offline Payment
        </p>
      </div>
    </div>
  );
}
