// Type definitions based on backend schemas

export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

export interface Ingredient {
  name: string;
  quantity: string;
  unit?: string;
  macros: Macros;
}

export interface FoodAnalysisResponse {
  isFood: boolean;
  dishName?: string;
  isBeverage?: boolean;
  mealType?: MealType;
  error?: string;
  ingredients?: Ingredient[];
  macros?: Macros;
  estimatedWeight?: string;
  confidence?: string;
}

export interface UserStats {
  gender: "MALE" | "FEMALE";
  birthDate: string;
  height: number;
  weight: number;
  activityLevel:
    | "SEDENTARY"
    | "LIGHTLY_ACTIVE"
    | "MODERATELY_ACTIVE"
    | "VERY_ACTIVE";
  goal: "LOSE_WEIGHT" | "MAINTAIN" | "GAIN_MUSCLE";
}

export interface CalculateCaloriesResult {
  bmr: number;
  tdee: number;
  targetCal: number;
}

export interface FoodEntry {
  id: string;
  dailyLogId: string;
  description: string;
  imageUrl?: string;
  mealType: MealType;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  createdAt: string;
}

export interface DailyLog {
  id: string;
  date: string;
  userId: string;
  targetCalories: number;
  consumedCalories: number;
  entries: FoodEntry[];
}

export interface RecipeSuggestion {
  title: string;
  cuisine: string;
  mealType: MealType;
  estimatedCalories: number;
  ingredients: { name: string; quantity: string; unit: string }[];
  instructions: string;
  macros: Macros;
}

export interface RecipesResponse {
  remainingCalories: number;
  consumedCalories: number;
  targetCalories: number;
  belowHealthyFloor: boolean;
  warning: string | null;
  eatenMealTypes: MealType[];
  availableMealTypes: MealType[];
  suggestions: RecipeSuggestion[];
}

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || "";

export const getApiBaseUrl = () => {
  if (API_BASE_URL) {
    console.info("[api] VITE_API_BASE_URL=", API_BASE_URL);
  } else {
    console.warn(
      "[api] VITE_API_BASE_URL is not set, falling back to relative paths",
    );
  }
  return API_BASE_URL;
};

const buildApiUrl = (path: string) => {
  if (/^https?:\/\//.test(path)) {
    return path;
  }
  const base = API_BASE_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${normalizedPath}` : normalizedPath;
};

// API Fetcher Client
async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const defaults: RequestInit = {
    credentials: "same-origin", // Enable cookie forwarding
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      "x-timezone-offset": new Date().getTimezoneOffset().toString(),
      "x-app-language": localStorage.getItem("nutritwins_lang") || "en",
      ...(!(options.body instanceof FormData) &&
      !(options.body instanceof ArrayBuffer) &&
      !(options.body instanceof Blob)
        ? { "Content-Type": "application/json" }
        : {}),
    },
  };

  const config = {
    ...defaults,
    ...options,
    headers: {
      ...defaults.headers,
      ...options.headers,
    },
  };

  const response = await fetch(buildApiUrl(url), config);

  if (!response.ok) {
    let errorMessage = "An error occurred";
    try {
      const errorJson = await response.json();
      errorMessage = errorJson.message || errorJson.error || errorMessage;
    } catch {
      // Fallback if not JSON
    }
    const error: any = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  // Handle empty bodies (like 204 No Content)
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json() as Promise<T>;
  }
  return response.text() as unknown as Promise<T>;
}

export const api = {
  // Runtime check helper
  getBaseUrl: getApiBaseUrl,

  // Calories endpoints
  calculateCalories: (data: UserStats) =>
    apiFetch<CalculateCaloriesResult>("/api/calories/calculate", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Daily Logs endpoints
  getTodayLog: () => apiFetch<DailyLog>("/api/daily-logs/today"),

  getAllLogs: () => apiFetch<DailyLog[]>("/api/daily-logs"),

  getLogById: (id: string) => apiFetch<DailyLog>(`/api/daily-logs/${id}`),

  addFoodEntry: (entry: {
    mealType: MealType;
    dishName: string;
    macros: Macros;
  }) =>
    apiFetch<FoodEntry>("/api/daily-logs/entries", {
      method: "POST",
      body: JSON.stringify(entry),
    }),

  // Food Entry Analysis endpoints
  analyzeImage: (image: File | Blob) => {
    // If it's direct upload, backend accepts image/* directly or multipart
    // Let's send as binary directly or as FormData depending on backend capability
    // Backend code handles content-type startsWith("image/") by parsing request.body as Buffer
    // Let's send as binary with appropriate content-type headers!
    return apiFetch<FoodAnalysisResponse>("/api/food-entry/analyze/image", {
      method: "POST",
      headers: {
        "Content-Type": image.type || "image/jpeg",
      },
      body: image,
    });
  },

  analyzeText: (description: string) =>
    apiFetch<FoodAnalysisResponse>("/api/food-entry/analyze/text", {
      method: "POST",
      body: JSON.stringify({ description }),
    }),

  // Recipe Suggestions endpoints
  getRecipeSuggestions: (mealType?: string) => {
    const url = mealType
      ? `/api/recipes/suggestions?mealType=${mealType}`
      : "/api/recipes/suggestions";
    return apiFetch<RecipesResponse>(url);
  },

  // Profile endpoints
  getProfile: () => apiFetch<UserProfile>("/api/calories/profile"),

  updateAllergies: (allergies: string[]) =>
    apiFetch<{ allergies: string[] }>("/api/calories/allergies", {
      method: "PUT",
      body: JSON.stringify({ allergies }),
    }),
};

export interface UserProfile extends UserStats {
  id: string;
  name: string;
  email: string;
  bmr: number | null;
  tdee: number | null;
  targetCal: number | null;
  allergies: string[];
}
