import React, { useEffect, useState } from "react";
import {
  ChefHat,
  Flame,
  AlertTriangle,
  X,
  Check,
  Utensils,
  BookOpen,
  Clock,
} from "lucide-react";
import { api } from "../lib/api";
import { t } from "../lib/i18n";
import type { RecipesResponse, RecipeSuggestion } from "../lib/api";
import GlassCard from "../components/GlassCard";

interface RecipesPageProps {
  onLogSuccess: () => void;
}

export const RecipesPage: React.FC<RecipesPageProps> = ({ onLogSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recipesData, setRecipesData] = useState<RecipesResponse | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<string>(""); // Empty represents "auto" based on progression
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeSuggestion | null>(
    null,
  );

  const [loggingRecipe, setLoggingRecipe] = useState(false);
  const [logSuccess, setLogSuccess] = useState(false);

  const fetchRecipes = async (mealType?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getRecipeSuggestions(mealType);
      setRecipesData(data);
    } catch (err: any) {
      console.error(err);
      setError(
        err.message || "Failed to load recipe suggestions. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes(selectedMealType || undefined);
  }, [selectedMealType]);

  const handleMealTypeFilter = (type: string) => {
    setSelectedMealType(type);
    setSelectedRecipe(null);
  };

  const handleLogRecipe = async (recipe: RecipeSuggestion) => {
    setLoggingRecipe(true);
    setLogSuccess(false);

    const logData = {
      mealType: recipe.mealType,
      dishName: recipe.title,
      macros: {
        calories: recipe.macros.calories,
        protein: recipe.macros.protein,
        carbs: recipe.macros.carbs,
        fat: recipe.macros.fat,
      },
    };

    try {
      await api.addFoodEntry(logData);
      setLogSuccess(true);
      onLogSuccess();
      setTimeout(() => {
        setLogSuccess(false);
        setSelectedRecipe(null);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      alert(
        t("recipes.log_recipe_fail", "Failed to log recipe to daily journal."),
      );
    } finally {
      setLoggingRecipe(false);
    }
  };

  const mealTypes = [
    { value: "", label: t("recipes.ai_auto", "AI Auto") },
    { value: "BREAKFAST", label: t("dash.breakfast", "Breakfast") },
    { value: "LUNCH", label: t("dash.lunch", "Lunch") },
    { value: "DINNER", label: t("dash.dinner", "Dinner") },
    { value: "SNACK", label: t("dash.snack", "Snack") },
  ];

  return (
    <div className="flex-1 flex flex-col px-4 py-6 space-y-6 overflow-y-auto pb-24 max-w-md mx-auto w-full">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <ChefHat className="w-6 h-6 text-teal-400" />
          {t("recipes.title", "AI Recipes")}
        </h2>
        <p className="text-xs text-gray-400">
          {t(
            "recipes.subtitle",
            "Chef-crafted recipes fitted to your leftover calories & allergies.",
          )}
        </p>
      </div>

      {/* Filter Horizontal Tab Bar */}
      <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
        {mealTypes.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleMealTypeFilter(tab.value)}
            className={`py-1.5 px-3.5 rounded-xl text-xs font-semibold shrink-0 transition-all border ${
              selectedMealType === tab.value
                ? "text-teal-400 bg-teal-500/5 border-teal-500/20"
                : "text-gray-400 bg-gray-900/20 border-gray-800/50 hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
            <p className="text-sm text-gray-400">
              {t("recipes.consulting", "Consulting AI nutritionist...")}
            </p>
          </div>
        </div>
      ) : error ? (
        <GlassCard className="border-red-500/20 text-center py-6">
          <p className="text-xs text-red-400 mb-4">{error}</p>
          <button
            onClick={() => fetchRecipes(selectedMealType || undefined)}
            className="text-xs bg-gray-900 hover:bg-gray-850 px-4 py-2 rounded-xl border border-gray-800 text-white font-semibold"
          >
            {t("recipes.reload_suggestions", "Reload Suggestions")}
          </button>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {/* Below Healthy Floor Warning */}
          {recipesData?.warning && (
            <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 flex gap-3 items-start text-xs text-amber-300">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">
                  {t("recipes.calorie_cap_met", "Calorie Cap Met")}
                </span>
                <p className="leading-relaxed">{recipesData.warning}</p>
              </div>
            </div>
          )}

          {/* Calorie Stats Card */}
          {recipesData && (
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-gray-900/30 border border-gray-850 rounded-xl p-2.5">
                <p className="text-[10px] text-gray-500 uppercase font-semibold">
                  {t("recipes.remaining_today", "Remaining Today")}
                </p>
                <p
                  className={`text-sm font-bold ${recipesData.remainingCalories < 0 ? "text-red-400" : "text-teal-400"}`}
                >
                  {recipesData.remainingCalories} kcal
                </p>
              </div>
              <div className="bg-gray-900/30 border border-gray-850 rounded-xl p-2.5">
                <p className="text-[10px] text-gray-500 uppercase font-semibold">
                  {t("recipes.target_budget", "Target Budget")}
                </p>
                <p className="text-sm font-bold text-white">
                  {recipesData.targetCalories} kcal
                </p>
              </div>
            </div>
          )}

          {/* Suggestions List */}
          <div className="space-y-3">
            {recipesData?.suggestions && recipesData.suggestions.length > 0 ? (
              recipesData.suggestions.map((recipe, index) => (
                <GlassCard
                  key={index}
                  onClick={() => setSelectedRecipe(recipe)}
                  className="flex flex-col gap-2.5 cursor-pointer relative overflow-hidden group border hover:border-teal-500/30 transition-all duration-300 active:scale-[0.99]"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded-full font-semibold">
                      {recipe.cuisine} • {recipe.mealType}
                    </span>
                    <span className="text-xs font-bold text-teal-400 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 fill-teal-500/10" />
                      {recipe.estimatedCalories} kcal
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white tracking-wide group-hover:text-teal-400 transition-colors pr-4">
                    {recipe.title}
                  </h3>

                  {/* Macros snippet */}
                  <div className="flex gap-4 text-[10px] text-gray-400 border-t border-gray-850 pt-2">
                    <span>
                      P:{" "}
                      <strong className="text-amber-400">
                        {Math.round(recipe.macros.protein)}g
                      </strong>
                    </span>
                    <span>
                      C:{" "}
                      <strong className="text-emerald-400">
                        {Math.round(recipe.macros.carbs)}g
                      </strong>
                    </span>
                    <span>
                      F:{" "}
                      <strong className="text-indigo-400">
                        {Math.round(recipe.macros.fat)}g
                      </strong>
                    </span>
                    <span className="ml-auto text-[9px] text-gray-500 flex items-center gap-1">
                      {t("recipes.view_recipe", "View Recipe")}{" "}
                      <BookOpen className="w-3 h-3 text-teal-500" />
                    </span>
                  </div>
                </GlassCard>
              ))
            ) : (
              <p className="text-xs text-gray-500 text-center py-8">
                {t(
                  "recipes.no_recipes",
                  "No recipes matching criteria. Change filters or log values.",
                )}
              </p>
            )}
          </div>
        </div>
      )}

      {/* DETAILED RECIPE MODAL SHEET (SLIDE UP FOR MOBILE) */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-gray-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-gray-900 border-t border-gray-800 rounded-t-[32px] max-h-[85vh] flex flex-col p-6 space-y-5 animate-slide-up overflow-y-auto max-w-md mx-auto w-full">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2.5 py-0.5 rounded-full font-bold">
                  {selectedRecipe.cuisine} • {selectedRecipe.mealType}
                </span>
                <h3 className="text-lg font-bold text-white pr-2 mt-1">
                  {selectedRecipe.title}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedRecipe(null);
                  setLogSuccess(false);
                }}
                className="bg-gray-850 text-gray-400 hover:text-white p-2 rounded-full border border-gray-800 transition-all shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Macros info */}
            <div className="grid grid-cols-4 gap-2 text-center bg-gray-950/40 border border-gray-850/60 rounded-2xl p-3">
              <div className="flex flex-col">
                <span className="text-[9px] text-gray-500 uppercase font-semibold">
                  Calories
                </span>
                <span className="text-xs font-bold text-white">
                  {selectedRecipe.macros.calories}
                </span>
              </div>
              <div className="flex flex-col border-l border-gray-800/60">
                <span className="text-[9px] text-gray-500 uppercase font-semibold">
                  Protein
                </span>
                <span className="text-xs font-bold text-amber-400">
                  {Math.round(selectedRecipe.macros.protein)}g
                </span>
              </div>
              <div className="flex flex-col border-l border-gray-800/60">
                <span className="text-[9px] text-gray-500 uppercase font-semibold">
                  Carbs
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  {Math.round(selectedRecipe.macros.carbs)}g
                </span>
              </div>
              <div className="flex flex-col border-l border-gray-800/60">
                <span className="text-[9px] text-gray-500 uppercase font-semibold">
                  Fats
                </span>
                <span className="text-xs font-bold text-indigo-400">
                  {Math.round(selectedRecipe.macros.fat)}g
                </span>
              </div>
            </div>

            {/* Ingredients Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-450 uppercase tracking-wider flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-teal-400" />
                Ingredients List
              </h4>
              <div className="bg-gray-950/20 border border-gray-850 rounded-2xl p-3.5 space-y-1.5 max-h-40 overflow-y-auto">
                {selectedRecipe.ingredients.map((ing, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center text-xs border-b border-gray-800/30 last:border-0 pb-1 last:pb-0"
                  >
                    <span className="text-gray-200">{ing.name}</span>
                    <span className="text-gray-400 font-medium">
                      {ing.quantity} {ing.unit || ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions Section */}
            <div className="space-y-2 flex-1 min-h-[150px] flex flex-col">
              <h4 className="text-xs font-bold text-gray-455 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                Cooking Instructions
              </h4>
              <div className="bg-gray-950/20 border border-gray-850 rounded-2xl p-4 text-xs text-gray-300 leading-relaxed overflow-y-auto whitespace-pre-line max-h-56">
                {selectedRecipe.instructions}
              </div>
            </div>

            {/* Quick Log Recipe Action */}
            <div className="pt-2">
              {logSuccess ? (
                <div className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl py-3 text-xs font-bold flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 stroke-[2.5px]" />
                  <span>Logged successfully!</span>
                </div>
              ) : (
                <button
                  onClick={() => handleLogRecipe(selectedRecipe)}
                  disabled={loggingRecipe}
                  style={{ color: "#ffffff" }}
                  className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white rounded-xl py-3 text-sm font-bold shadow-lg shadow-teal-950/20 flex items-center justify-center gap-2 transition-all duration-200"
                >
                  {loggingRecipe ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-white" color="#ffffff" />
                      <span className="text-white" style={{ color: "#ffffff" }}>
                        Log this recipe as{" "}
                        {selectedRecipe.mealType.toLowerCase()}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipesPage;
