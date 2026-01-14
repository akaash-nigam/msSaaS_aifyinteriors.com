import { Check } from "lucide-react";
import type { RoomType } from "../lib/api";

interface RoomTypeSelectorProps {
  roomTypes: RoomType[];
  selectedRoomTypeId: number | null;
  onSelectRoomType: (roomTypeId: number) => void;
}

export function RoomTypeSelector({
  roomTypes,
  selectedRoomTypeId,
  onSelectRoomType,
}: RoomTypeSelectorProps) {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Select Room Type
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {roomTypes.map((roomType) => {
          const isSelected = selectedRoomTypeId === roomType.id;

          return (
            <button
              key={roomType.id}
              onClick={() => onSelectRoomType(roomType.id)}
              className={`
                relative p-4 rounded-lg border-2 text-center transition-all
                ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                }
              `}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}

              {/* Icon */}
              <div className="text-3xl mb-2">{getRoomIcon(roomType.name)}</div>

              {/* Name */}
              <p className="text-sm font-medium text-gray-900">
                {roomType.name}
              </p>
            </button>
          );
        })}
      </div>

      {selectedRoomTypeId && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            <strong>Selected:</strong>{" "}
            {roomTypes.find((r) => r.id === selectedRoomTypeId)?.name}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Get emoji icon for room type
 */
function getRoomIcon(roomName: string): string {
  const icons: Record<string, string> = {
    "Living Room": "🛋️",
    "Bedroom": "🛏️",
    "Kitchen": "🍳",
    "Bathroom": "🛁",
    "Dining Room": "🍽️",
    "Home Office": "💼",
    "Kids Room": "🧸",
    "Outdoor Patio": "🌿",
  };

  return icons[roomName] || "🏠";
}
