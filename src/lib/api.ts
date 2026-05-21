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

export interface UserProfile extends UserStats {
  id: string;
  name: string;
  email: string;
  bmr: number | null;
  tdee: number | null;
  targetCal: number | null;
  allergies: string[];
}

// All requests are relative — Vercel proxy forwards /api/* to Render.
// Never use an absolute base URL here; that bypasses the proxy and breaks cookies.
const buildApiUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return normalizedPath;
};

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const config: RequestInit = {
    credentials: "include",
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
      ...options.headers,
    },
    ...options,
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

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json() as Promise<T>;
  }
  return response.text() as unknown as Promise<T>;
}

export const api = {
  calculateCalories: (data: UserStats) =>
    apiFetch<CalculateCaloriesResult>("/api/calories/calculate", {
      method: "POST",
      body: JSON.stringify(data),
    }),

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

  analyzeImage: (image: File | Blob) =>
    apiFetch<FoodAnalysisResponse>("/api/food-entry/analyze/image", {
      method: "POST",
      headers: {
        "Content-Type": image.type || "image/jpeg",
      },
      body: image,
    }),

  analyzeText: (description: string) =>
    apiFetch<FoodAnalysisResponse>("/api/food-entry/analyze/text", {
      method: "POST",
      body: JSON.stringify({ description }),
    }),

  getRecipeSuggestions: (mealType?: string) => {
    const url = mealType
      ? `/api/recipes/suggestions?mealType=${mealType}`
      : "/api/recipes/suggestions";
    return apiFetch<RecipesResponse>(url);
  },

  getProfile: () => apiFetch<UserProfile>("/api/calories/profile"),

  updateAllergies: (allergies: string[]) =>
    apiFetch<{ allergies: string[] }>("/api/calories/allergies", {
      method: "PUT",
      body: JSON.stringify({ allergies }),
    }),
};
