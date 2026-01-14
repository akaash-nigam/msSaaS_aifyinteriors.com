import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { fileToBase64 } from "../lib/api";

interface ImageUploaderProps {
  onImageSelect: (base64: string) => void;
  currentImage?: string;
  maxSize?: number; // in MB
}

export function ImageUploader({
  onImageSelect,
  currentImage,
  maxSize = 10,
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setError(null);

      if (acceptedFiles.length === 0) {
        setError("Please select a valid image file");
        return;
      }

      const file = acceptedFiles[0];

      // Validate file size
      const maxSizeBytes = maxSize * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        setError(`File size must be less than ${maxSize}MB`);
        return;
      }

      try {
        // Convert to base64
        const base64 = await fileToBase64(file);
        setPreview(base64);
        onImageSelect(base64);
      } catch (err) {
        setError("Failed to process image");
        console.error("Image processing error:", err);
      }
    },
    [maxSize, onImageSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    maxFiles: 1,
    multiple: false,
  });

  const clearImage = () => {
    setPreview(null);
    setError(null);
  };

  return (
    <div className="w-full">
      {!preview ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8
            transition-all cursor-pointer
            ${
              isDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center text-center">
            <Upload
              className={`w-12 h-12 mb-4 ${
                isDragActive ? "text-blue-500" : "text-gray-400"
              }`}
            />
            <p className="text-lg font-medium text-gray-700 mb-2">
              {isDragActive ? "Drop your image here" : "Upload a room photo"}
            </p>
            <p className="text-sm text-gray-500">
              Drag & drop or click to select
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Supports: PNG, JPG, JPEG, WebP (max {maxSize}MB)
            </p>
          </div>
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden border border-gray-200">
          <img
            src={preview}
            alt="Uploaded room"
            className="w-full h-auto object-contain max-h-96"
          />
          <button
            onClick={clearImage}
            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
            aria-label="Remove image"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <div className="flex items-center text-white text-sm">
              <ImageIcon className="w-4 h-4 mr-2" />
              <span>Original room photo</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
