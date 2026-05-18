export type CarCategory = 'Hatchback' | 'Sedan' | 'SUV' | 'Luxury';
export type TransmissionType = 'Manual' | 'Automatic';

export interface CarSelection {
  category: CarCategory;
  transmission: TransmissionType;
  emoji: string;
  description: string;
}

export const CAR_CATEGORIES: Record<CarCategory, { emoji: string; description: string }> = {
  Hatchback: { emoji: '🚗', description: 'Compact cars like Swift, i20, Baleno' },
  Sedan: { emoji: '🚘', description: 'Mid-size cars like City, Verna, Ciaz' },
  SUV: { emoji: '🚙', description: 'Large vehicles like Creta, Fortuner, XUV' },
  Luxury: { emoji: '🏎️', description: 'Premium cars like BMW, Mercedes, Audi' },
};

interface VehicleSelectorProps {
  selectedCategory: CarCategory;
  selectedTransmission: TransmissionType;
  onCategoryChange: (category: CarCategory) => void;
  onTransmissionChange: (transmission: TransmissionType) => void;
}

export function VehicleSelector({
  selectedCategory,
  selectedTransmission,
  onCategoryChange,
  onTransmissionChange,
}: VehicleSelectorProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-gray-700 mb-3">Car Type</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <select
              value={selectedTransmission}
              onChange={(e) => onTransmissionChange(e.target.value as TransmissionType)}
              className="w-full px-4 py-4 pr-10 text-base text-gray-700 bg-white border border-gray-300 rounded-xl appearance-none focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer"
            >
              <option value="Manual">Manual</option>
              <option value="Automatic">Automatic</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value as CarCategory)}
              className="w-full px-4 py-4 pr-10 text-base text-gray-700 bg-white border border-gray-300 rounded-xl appearance-none focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer"
            >
              <option value="Hatchback">Hatchback</option>
              <option value="Sedan">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="Luxury">Luxury</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">ℹ️ Note:</span> We provide only the driver. You use your own vehicle.
        </p>
      </div>
    </div>
  );
}
