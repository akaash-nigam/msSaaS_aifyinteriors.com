import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Grid, List, Heart, Filter } from "lucide-react";
import { DesignCard } from "../components/DesignCard";
import { designsApi } from "../lib/api";
import type { Design } from "../lib/api";

export function MyDesigns() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch designs
  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["designs", "my-designs", page, favoritesOnly],
    queryFn: () =>
      designsApi.getMyDesigns({
        page,
        limit: 12,
        favoritesOnly,
      }),
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ id, isFavorite }: { id: number; isFavorite: boolean }) =>
      designsApi.updateDesign(id, { isFavorite }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designs", "my-designs"] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => designsApi.deleteDesign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designs", "my-designs"] });
    },
  });

  const designs = data?.designs || [];
  const pagination = data?.pagination;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Designs</h1>
              <p className="text-gray-600 mt-1">
                {pagination ? `${pagination.totalCount} design${pagination.totalCount !== 1 ? "s" : ""}` : "View and manage your designs"}
              </p>
            </div>

            {/* View mode toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`
                  p-2 rounded-lg transition-colors
                  ${
                    viewMode === "grid"
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-600 hover:bg-gray-100"
                  }
                `}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`
                  p-2 rounded-lg transition-colors
                  ${
                    viewMode === "list"
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-600 hover:bg-gray-100"
                  }
                `}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <button
              onClick={() => {
                setFavoritesOnly(!favoritesOnly);
                setPage(1);
              }}
              className={`
                px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2
                ${
                  favoritesOnly
                    ? "bg-red-100 text-red-700 border border-red-300"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }
              `}
            >
              <Heart
                className={`w-4 h-4 ${favoritesOnly ? "fill-current" : ""}`}
              />
              {favoritesOnly ? "Showing Favorites" : "Show All"}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
          </div>
        )}

        {error && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">Failed to load designs</p>
            <p className="text-sm text-red-700 mt-1">
              {error instanceof Error ? error.message : "An error occurred"}
            </p>
          </div>
        )}

        {!isLoading && !error && designs.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Grid className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {favoritesOnly ? "No favorite designs yet" : "No designs yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {favoritesOnly
                ? "Mark your favorite designs by clicking the heart icon"
                : "Create your first AI-generated interior design"}
            </p>
            <a
              href="/visualizer"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Design
            </a>
          </div>
        )}

        {!isLoading && !error && designs.length > 0 && (
          <>
            {/* Designs grid */}
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              }
            >
              {designs.map((design) => (
                <DesignCard
                  key={design.id}
                  design={design}
                  onToggleFavorite={(id, isFavorite) =>
                    toggleFavoriteMutation.mutate({ id, isFavorite })
                  }
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      // Show first, last, current, and adjacent pages
                      return (
                        p === 1 ||
                        p === pagination.totalPages ||
                        Math.abs(p - page) <= 1
                      );
                    })
                    .map((p, index, arr) => {
                      // Add ellipsis
                      const showEllipsis =
                        index > 0 && p - arr[index - 1] > 1;

                      return (
                        <div key={p} className="flex items-center">
                          {showEllipsis && (
                            <span className="px-2 text-gray-500">...</span>
                          )}
                          <button
                            onClick={() => setPage(p)}
                            className={`
                              w-10 h-10 rounded-lg font-medium transition-colors
                              ${
                                p === page
                                  ? "bg-blue-600 text-white"
                                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                              }
                            `}
                          >
                            {p}
                          </button>
                        </div>
                      );
                    })}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
