import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Sparkles, Loader2, ArrowRight, Coins } from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { ImageUploader } from "../components/ImageUploader";
import { StyleSelector } from "../components/StyleSelector";
import { RoomTypeSelector } from "../components/RoomTypeSelector";
import { designsApi, stylesApi, roomTypesApi, usersApi } from "../lib/api";
import type { GenerateDesignRequest } from "../lib/api";

export function Visualizer() {
  const { user } = useAuth();
  const [originalImage, setOriginalImage] = useState<string>("");
  const [selectedStyleId, setSelectedStyleId] = useState<number | null>(null);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<number | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // Fetch styles
  const { data: stylesData, isLoading: stylesLoading } = useQuery({
    queryKey: ["styles"],
    queryFn: () => stylesApi.getAll(),
  });

  // Fetch room types
  const { data: roomTypesData, isLoading: roomTypesLoading } = useQuery({
    queryKey: ["roomTypes"],
    queryFn: () => roomTypesApi.getAll(),
  });

  // Fetch user profile for credits
  const { data: userProfile, refetch: refetchProfile } = useQuery({
    queryKey: ["user", "me"],
    queryFn: () => usersApi.getMe(),
    enabled: !!user,
  });

  // Generate design mutation
  const generateMutation = useMutation({
    mutationFn: (data: GenerateDesignRequest) => designsApi.generate(data),
    onSuccess: (response) => {
      setGeneratedImage(response.design.generatedImage);
      refetchProfile(); // Refresh credits balance
    },
  });

  const handleGenerate = async () => {
    if (!originalImage || !selectedStyleId || !selectedRoomTypeId) {
      alert("Please upload an image and select both a style and room type");
      return;
    }

    const request: GenerateDesignRequest = {
      originalImage,
      styleId: selectedStyleId,
      roomTypeId: selectedRoomTypeId,
      customPrompt: customPrompt || undefined,
      generateAlternatives: false,
    };

    generateMutation.mutate(request);
  };

  const canGenerate =
    originalImage &&
    selectedStyleId &&
    selectedRoomTypeId &&
    !generateMutation.isPending;

  const userTier = userProfile?.user?.tier || "free";
  const creditsBalance = userProfile?.user?.creditsBalance || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                AI Interior Design Studio
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Transform your space with AI-powered design
              </p>
            </div>

            {/* Credits badge */}
            {user && (
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                  <Coins className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-blue-600 font-medium">
                      Credits
                    </p>
                    <p className="text-lg font-bold text-blue-900">
                      {userTier === "free" ? creditsBalance : "Unlimited"}
                    </p>
                  </div>
                </div>

                {userTier === "free" && (
                  <a
                    href="/pricing"
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                  >
                    Upgrade
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column - Input */}
          <div className="space-y-6">
            {/* Step 1: Upload Image */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Upload Room Photo
                </h2>
              </div>
              <ImageUploader
                onImageSelect={setOriginalImage}
                currentImage={originalImage}
              />
            </div>

            {/* Step 2: Select Style */}
            {originalImage && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Choose Style
                  </h2>
                </div>
                {stylesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <StyleSelector
                    styles={stylesData?.styles || []}
                    selectedStyleId={selectedStyleId}
                    onSelectStyle={setSelectedStyleId}
                    userTier={userTier}
                  />
                )}
              </div>
            )}

            {/* Step 3: Select Room Type */}
            {originalImage && selectedStyleId && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Select Room Type
                  </h2>
                </div>
                {roomTypesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <RoomTypeSelector
                    roomTypes={roomTypesData?.roomTypes || []}
                    selectedRoomTypeId={selectedRoomTypeId}
                    onSelectRoomType={setSelectedRoomTypeId}
                  />
                )}
              </div>
            )}

            {/* Step 4: Custom Prompt (Optional) */}
            {originalImage && selectedStyleId && selectedRoomTypeId && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gray-300 text-white rounded-full flex items-center justify-center font-bold">
                    4
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Customize (Optional)
                  </h2>
                </div>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Add specific requirements (e.g., 'add plants', 'warm lighting', 'minimalist furniture')..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-2">
                  {customPrompt.length}/200 characters
                </p>
              </div>
            )}

            {/* Generate Button */}
            {originalImage && selectedStyleId && selectedRoomTypeId && (
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className={`
                  w-full py-4 rounded-xl font-bold text-lg
                  flex items-center justify-center gap-3
                  transition-all shadow-lg
                  ${
                    canGenerate
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }
                `}
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Generating Your Design...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    Generate Design
                    <ArrowRight className="w-6 h-6" />
                  </>
                )}
              </button>
            )}
          </div>

          {/* Right column - Result */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Generated Design
              </h2>

              {!generatedImage && !generateMutation.isPending && (
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center p-8">
                    <Sparkles className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">
                      Your generated design will appear here
                    </p>
                  </div>
                </div>
              )}

              {generateMutation.isPending && (
                <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                  <div className="text-center p-8">
                    <Loader2 className="w-16 h-16 mx-auto text-blue-600 animate-spin mb-4" />
                    <p className="text-lg font-semibold text-blue-900 mb-2">
                      Creating your design...
                    </p>
                    <p className="text-sm text-blue-700">
                      This may take 20-30 seconds
                    </p>
                  </div>
                </div>
              )}

              {generatedImage && (
                <div className="space-y-4">
                  <img
                    src={generatedImage}
                    alt="Generated design"
                    className="w-full rounded-lg shadow-md"
                  />

                  {/* Success message */}
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 font-medium">
                      ✨ Design generated successfully!
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      Credits remaining:{" "}
                      {userTier === "free"
                        ? generateMutation.data?.design.creditsRemaining
                        : "Unlimited"}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <a
                      href={generatedImage}
                      download={`aifyinteriors-design-${Date.now()}.png`}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white text-center font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Download
                    </a>
                    <button
                      onClick={() => {
                        setGeneratedImage(null);
                        setOriginalImage("");
                        setSelectedStyleId(null);
                        setSelectedRoomTypeId(null);
                        setCustomPrompt("");
                      }}
                      className="px-4 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      New Design
                    </button>
                  </div>
                </div>
              )}

              {/* Error message */}
              {generateMutation.isError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-medium">
                    ❌ Generation failed
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    {generateMutation.error?.message ||
                      "An unexpected error occurred"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
