import { Check, Lock } from "lucide-react";
import type { DesignStyle } from "../lib/api";

interface StyleSelectorProps {
  styles: DesignStyle[];
  selectedStyleId: number | null;
  onSelectStyle: (styleId: number) => void;
  userTier: string;
}

export function StyleSelector({
  styles,
  selectedStyleId,
  onSelectStyle,
  userTier,
}: StyleSelectorProps) {
  const canAccessStyle = (style: DesignStyle): boolean => {
    if (userTier === "professional") return true;
    if (userTier === "basic") return style.tier !== "professional";
    return style.tier === "free";
  };

  const getTierBadgeColor = (tier: string): string => {
    switch (tier) {
      case "free":
        return "bg-green-100 text-green-700";
      case "basic":
        return "bg-blue-100 text-blue-700";
      case "professional":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Choose a Design Style
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {styles.map((style) => {
          const isSelected = selectedStyleId === style.id;
          const hasAccess = canAccessStyle(style);

          return (
            <button
              key={style.id}
              onClick={() => hasAccess && onSelectStyle(style.id)}
              disabled={!hasAccess}
              className={`
                relative p-4 rounded-lg border-2 text-left transition-all
                ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : hasAccess
                    ? "border-gray-200 hover:border-blue-300 hover:shadow-sm"
                    : "border-gray-200 opacity-60 cursor-not-allowed"
                }
              `}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Lock indicator for locked styles */}
              {!hasAccess && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                  <Lock className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Style thumbnail (placeholder for now) */}
              <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-md mb-3 flex items-center justify-center">
                <span className="text-4xl">{getStyleIcon(style.name)}</span>
              </div>

              {/* Style info */}
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{style.name}</h4>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {style.description}
                </p>

                {/* Tier badge */}
                <span
                  className={`
                    inline-block px-2 py-1 text-xs font-medium rounded-full
                    ${getTierBadgeColor(style.tier)}
                  `}
                >
                  {style.tier.charAt(0).toUpperCase() + style.tier.slice(1)}
                </span>

                {/* Upgrade message for locked styles */}
                {!hasAccess && (
                  <p className="text-xs text-gray-500 mt-2">
                    Upgrade to access this style
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedStyleId && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Selected:</strong>{" "}
            {styles.find((s) => s.id === selectedStyleId)?.name}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Get emoji icon for style (placeholder for actual thumbnails)
 */
function getStyleIcon(styleName: string): string {
  const icons: Record<string, string> = {
    "Modern Minimalist": "✨",
    "Scandinavian": "🌲",
    "Industrial": "🏭",
    "Traditional": "🏛️",
    "Bohemian": "🌺",
    "Mid-Century Modern": "🎨",
    "Coastal": "🌊",
    "Farmhouse": "🏡",
    "Contemporary Luxury": "💎",
    "Japanese Zen": "🎋",
  };

  return icons[styleName] || "🎨";
}
