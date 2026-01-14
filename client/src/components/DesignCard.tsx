import { useState } from "react";
import { Download, Heart, Trash2, Eye } from "lucide-react";
import type { Design } from "../lib/api";

interface DesignCardProps {
  design: Design;
  onToggleFavorite?: (id: number, isFavorite: boolean) => void;
  onDelete?: (id: number) => void;
  onView?: (design: Design) => void;
}

export function DesignCard({
  design,
  onToggleFavorite,
  onDelete,
  onView,
}: DesignCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDownload = () => {
    // Create a download link
    const link = document.createElement("a");
    link.href = design.generatedImage;
    link.download = `aifyinteriors-design-${design.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleFavorite = async () => {
    if (onToggleFavorite) {
      onToggleFavorite(design.id, !design.isFavorite);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this design? This action cannot be undone."
    );

    if (confirmed) {
      setIsDeleting(true);
      try {
        await onDelete(design.id);
      } catch (error) {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div
      className={`
        bg-white rounded-lg shadow-md overflow-hidden border border-gray-200
        transition-all hover:shadow-lg
        ${isDeleting ? "opacity-50 pointer-events-none" : ""}
      `}
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-100">
        <img
          src={design.generatedImage}
          alt={design.title || "Generated design"}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Watermark indicator */}
        {design.hasWatermark && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-gray-900/70 text-white text-xs rounded">
            Free Tier
          </div>
        )}

        {/* Favorite badge */}
        {design.isFavorite && (
          <div className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
            <Heart className="w-4 h-4 text-white fill-current" />
          </div>
        )}

        {/* View overlay */}
        {onView && (
          <button
            onClick={() => onView(design)}
            className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center group"
          >
            <Eye className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        {design.title && (
          <h3 className="font-semibold text-gray-900 mb-2 truncate">
            {design.title}
          </h3>
        )}

        {/* Metadata */}
        <p className="text-sm text-gray-500 mb-3">
          Created {new Date(design.createdAt).toLocaleDateString()}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Download */}
          <button
            onClick={handleDownload}
            className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </button>

          {/* Favorite */}
          {onToggleFavorite && (
            <button
              onClick={handleToggleFavorite}
              className={`
                p-2 rounded-md border transition-colors
                ${
                  design.isFavorite
                    ? "bg-red-50 border-red-300 text-red-600 hover:bg-red-100"
                    : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                }
              `}
              aria-label={design.isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart
                className={`w-5 h-5 ${design.isFavorite ? "fill-current" : ""}`}
              />
            </button>
          )}

          {/* Delete */}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-2 rounded-md border border-gray-300 text-gray-600 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
              aria-label="Delete design"
              disabled={isDeleting}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
