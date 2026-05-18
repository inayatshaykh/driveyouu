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
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Your Car Type
        </label>
        <p className="text-xs text-gray-500 mb-3">
          We'll assign a driver experienced with your vehicle type
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(CAR_CATEGORIES) as CarCategory[]).map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => onCategoryChange(category)}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                selectedCategory === category
                  ? 'border-emerald-600 bg-emerald-50/40'
                  : 'border-gray-200 hover:border-emerald-300 bg-white'
              }`}
            >
              <div className="text-3xl mb-2">{CAR_CATEGORIES[category].emoji}</div>
              <div className="font-bold text-gray-900 text-sm">{category}</div>
              <p className="text-xs text-gray-500 mt-1">
                {CAR_CATEGORIES[category].description}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Transmission Type
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Driver will be assigned based on your car's transmission
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onTransmissionChange('Manual')}
            className={`flex-1 px-6 py-4 rounded-2xl border-2 font-semibold transition-all ${
              selectedTransmission === 'Manual'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-300'
            }`}
          >
            <div className="text-2xl mb-1">⚙️</div>
            Manual
          </button>
          <button
            type="button"
            onClick={() => onTransmissionChange('Automatic')}
            className={`flex-1 px-6 py-4 rounded-2xl border-2 font-semibold transition-all ${
              selectedTransmission === 'Automatic'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-300'
            }`}
          >
            <div className="text-2xl mb-1">🔄</div>
            Automatic
          </button>
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
