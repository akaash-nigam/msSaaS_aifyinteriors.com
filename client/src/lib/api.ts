import { auth } from "../auth/firebase-config";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Get Firebase ID token for authentication
 */
async function getAuthToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken();
}

/**
 * Generic API request wrapper
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "Request Failed",
      message: response.statusText,
    }));
    throw new Error(error.message || error.error || "Request failed");
  }

  return response.json();
}

/**
 * Design Types
 */
export interface Design {
  id: number;
  userId: number;
  originalImage: string;
  generatedImage: string;
  styleId: number;
  roomTypeId: number;
  customPrompt?: string;
  hasWatermark: boolean;
  title?: string;
  isFavorite: boolean;
  isPublic: boolean;
  metadata?: any;
  generationCost?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DesignStyle {
  id: number;
  name: string;
  description: string;
  tier: "free" | "basic" | "professional";
  thumbnailUrl?: string;
  promptModifiers?: string[];
  isActive: boolean;
}

export interface RoomType {
  id: number;
  name: string;
  description: string;
  iconName: string;
  promptContext?: string;
  isActive: boolean;
}

export interface GenerateDesignRequest {
  originalImage: string;
  styleId: number;
  roomTypeId: number;
  customPrompt?: string;
  generateAlternatives?: boolean;
}

export interface GenerateDesignResponse {
  success: boolean;
  design: {
    id: number;
    generatedImage: string;
    alternativeViews?: string[];
    hasWatermark: boolean;
    style: string;
    roomType: string;
    creditsRemaining: number;
    metadata: any;
  };
}

export interface PaginatedDesigns {
  designs: Design[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface UserProfile {
  user: {
    id: number;
    email: string;
    displayName?: string;
    photoURL?: string;
    tier: string;
    subscriptionStatus: string;
    creditsBalance: number;
    creditsUsedThisMonth: number;
    lastCreditReset?: string;
    currentPeriodEnd?: string;
    createdAt: string;
  };
}

export interface UserStats {
  stats: {
    totalDesigns: number;
    favoriteDesigns: number;
    totalCreditsUsed: number;
    totalCreditsPurchased: number;
  };
}

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: "month" | "year";
  stripePriceId: string;
  features: string[];
  designLimit: number | "unlimited";
  watermark: boolean;
  tier: "free" | "basic" | "professional";
}

export interface SubscriptionInfo {
  tier: string;
  subscriptionStatus: string;
  creditsBalance: number;
  currentPeriodEnd?: string;
  subscription: any;
}

/**
 * Design API
 */
export const designsApi = {
  generate: (data: GenerateDesignRequest) =>
    apiRequest<GenerateDesignResponse>("/designs/generate", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMyDesigns: (params?: {
    page?: number;
    limit?: number;
    styleId?: number;
    roomTypeId?: number;
    favoritesOnly?: boolean;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.styleId) query.append("styleId", params.styleId.toString());
    if (params?.roomTypeId) query.append("roomTypeId", params.roomTypeId.toString());
    if (params?.favoritesOnly) query.append("favoritesOnly", "true");

    return apiRequest<PaginatedDesigns>(`/designs/my-designs?${query.toString()}`);
  },

  getDesign: (id: number) => apiRequest<{ design: Design }>(`/designs/${id}`),

  updateDesign: (id: number, data: { title?: string; isFavorite?: boolean; isPublic?: boolean }) =>
    apiRequest<{ success: boolean; design: Design }>(`/designs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteDesign: (id: number) =>
    apiRequest<{ success: boolean; message: string }>(`/designs/${id}`, {
      method: "DELETE",
    }),
};

/**
 * Styles API
 */
export const stylesApi = {
  getAll: () => apiRequest<{ styles: DesignStyle[] }>("/styles"),
  getById: (id: number) => apiRequest<{ style: DesignStyle }>(`/styles/${id}`),
};

/**
 * Room Types API
 */
export const roomTypesApi = {
  getAll: () => apiRequest<{ roomTypes: RoomType[] }>("/room-types"),
  getById: (id: number) => apiRequest<{ roomType: RoomType }>(`/room-types/${id}`),
};

/**
 * Subscriptions API
 */
export const subscriptionsApi = {
  getPricing: () => apiRequest<{ tiers: PricingTier[] }>("/subscriptions/pricing"),

  getMySubscription: () => apiRequest<SubscriptionInfo>("/subscriptions/my-subscription"),

  createCheckout: (data: { tierId: string; successUrl: string; cancelUrl: string }) =>
    apiRequest<{ success: boolean; sessionId: string; sessionUrl: string }>(
      "/subscriptions/create-checkout",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),

  cancelSubscription: () =>
    apiRequest<{ success: boolean; message: string; cancelAt: string }>(
      "/subscriptions/cancel",
      {
        method: "POST",
      }
    ),

  reactivateSubscription: () =>
    apiRequest<{ success: boolean; message: string }>("/subscriptions/reactivate", {
      method: "POST",
    }),

  createBillingPortal: (returnUrl: string) =>
    apiRequest<{ success: boolean; portalUrl: string }>("/subscriptions/billing-portal", {
      method: "POST",
      body: JSON.stringify({ returnUrl }),
    }),
};

/**
 * Users API
 */
export const usersApi = {
  getMe: () => apiRequest<UserProfile>("/users/me"),

  updateMe: (data: { displayName?: string; photoURL?: string }) =>
    apiRequest<{ success: boolean; user: any }>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  getStats: () => apiRequest<UserStats>("/users/stats"),
};

/**
 * Utility: Convert image file to base64
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Utility: Convert image URL to base64 (for images already loaded in browser)
 */
export async function imageUrlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
