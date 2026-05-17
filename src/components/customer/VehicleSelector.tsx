import { inr } from '@/utils/ursSession';

export type CarCategory = 'Hatchback' | 'Sedan' | 'MPV' | 'SUV' | 'Premium';

export interface CarOption {
  name: string;
  seats: number;
  transmission: string;
  emoji: string;
  badge?: string;
  from: number;
}

export const CARS_BY_CATEGORY: Record<CarCategory, CarOption[]> = {
  Hatchback: [
    { name: 'Maruti Swift', seats: 5, transmission: 'Manual', emoji: '🚗', from: 500 },
    { name: 'Hyundai i20', seats: 5, transmission: 'Manual', emoji: '🚗', from: 500 },
  ],
  Sedan: [
    { name: 'Honda City', seats: 5, transmission: 'Automatic', emoji: '🚘', badge: 'Popular', from: 600 },
    { name: 'Maruti Ciaz', seats: 5, transmission: 'Manual', emoji: '🚘', from: 600 },
  ],
  MPV: [
    { name: 'Maruti Ertiga', seats: 7, transmission: 'Manual', emoji: '🚐', badge: 'Popular', from: 500 },
    { name: 'Kia Carens', seats: 7, transmission: 'Automatic', emoji: '🚐', from: 700 },
  ],
  SUV: [
    { name: 'Toyota Fortuner', seats: 7, transmission: 'Automatic', emoji: '🚙', from: 800 },
    { name: 'Hyundai Creta', seats: 5, transmission: 'Automatic', emoji: '🚙', from: 650 },
  ],
  Premium: [
    { name: 'Toyota Innova', seats: 7, transmission: 'Manual', emoji: '🚘', from: 700 },
    { name: 'Mercedes E-Class', seats: 4, transmission: 'Automatic', emoji: '🏎️', from: 2000 },
  ],
};

interface VehicleSelectorProps {
  selectedCategory: CarCategory;
  selectedCar: CarOption;
  onCategoryChange: (category: CarCategory) => void;
  onCarChange: (car: CarOption) => void;
}

export function VehicleSelector({
  selectedCategory,
  selectedCar,
  onCategoryChange,
  onCarChange,
}: VehicleSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">Select Vehicle</label>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {(Object.keys(CARS_BY_CATEGORY) as CarCategory[]).map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => {
              onCategoryChange(category);
              onCarChange(CARS_BY_CATEGORY[category][0]);
            }}
            className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
              selectedCategory === category
                ? 'bg-emerald-700 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
      <div className="mt-3 space-y-2">
        {CARS_BY_CATEGORY[selectedCategory].map((car) => (
          <button
            key={car.name}
            type="button"
            onClick={() => onCarChange(car)}
            className={`w-full bg-white rounded-2xl border-2 p-4 flex items-center gap-4 cursor-pointer transition-all ${
              selectedCar.name === car.name
                ? 'border-emerald-600 bg-emerald-50/40'
                : 'border-gray-100 hover:border-emerald-300'
            }`}
          >
            <span className="text-3xl shrink-0">{car.emoji}</span>
            <div className="flex-1 text-left min-w-0">
              <div className="font-bold text-gray-900">{car.name}</div>
              <p className="text-xs text-gray-500 mt-0.5">
                {car.seats} seats · {car.transmission}
              </p>
              {car.badge && (
                <span className="inline-block bg-amber-100 text-amber-700 text-xs rounded-full px-2 py-0.5 mt-1 font-medium">
                  {car.badge}
                </span>
              )}
              <p className="text-emerald-700 font-semibold text-sm mt-1">
                From {inr.format(car.from)}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
