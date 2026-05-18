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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-1">Your Car Type</h3>
        <p className="text-sm text-gray-500 mb-4">
          We'll assign a driver experienced with your vehicle type
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(CAR_CATEGORIES) as CarCategory[]).map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => onCategoryChange(category)}
              className={`p-5 rounded-3xl border-3 text-left transition-all ${
                selectedCategory === category
                  ? 'border-emerald-500 bg-emerald-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
              style={{
                borderWidth: selectedCategory === category ? '3px' : '2px',
              }}
            >
              <div className="text-4xl mb-3">{CAR_CATEGORIES[category].emoji}</div>
              <div className="font-bold text-gray-900 text-base mb-1">{category}</div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {CAR_CATEGORIES[category].description}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-1">Transmission Type</h3>
        <p className="text-sm text-gray-500 mb-4">
          Driver will be assigned based on your car's transmission
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onTransmissionChange('Manual')}
            className={`px-6 py-6 rounded-3xl border-3 font-bold text-lg transition-all ${
              selectedTransmission === 'Manual'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
            style={{
              borderWidth: selectedTransmission === 'Manual' ? '3px' : '2px',
            }}
          >
            <div className="text-3xl mb-2">⚙️</div>
            Manual
          </button>
          <button
            type="button"
            onClick={() => onTransmissionChange('Automatic')}
            className={`px-6 py-6 rounded-3xl border-3 font-bold text-lg transition-all ${
              selectedTransmission === 'Automatic'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
            style={{
              borderWidth: selectedTransmission === 'Automatic' ? '3px' : '2px',
            }}
          >
            <div className="text-3xl mb-2">🔄</div>
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
