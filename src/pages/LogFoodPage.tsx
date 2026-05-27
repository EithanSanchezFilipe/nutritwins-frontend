import React, { useState } from "react";
import {
  Camera,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Edit2,
  RotateCcw,
} from "lucide-react";
import type { FoodAnalysisResponse, MealType } from "../lib/api";
import { api } from "../lib/api";
import GlassCard from "../components/GlassCard";
import { t } from "../lib/i18n";
import { ImageTab } from "./log-food/ImageTab";
import { TextTab } from "./log-food/TextTab";
type TabId = "image" | "text";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

interface LogFoodPageProps {
  onSuccess: () => void;
}

export const LogFoodPage: React.FC<LogFoodPageProps> = ({ onSuccess }) => {
  const [activeTab, setActiveTab] = useState<TabId>("image");

  const TABS: Tab[] = [
    {
      id: "image",
      label: t("log.tab_image", "Photo"),
      icon: <Camera className="w-4 h-4" />,
    },
    {
      id: "text",
      label: t("log.tab_text", "Text"),
      icon: <FileText className="w-4 h-4" />,
    },
  ];
  const [error, setError] = useState<string | null>(null);
  const [isNotFoodError, setIsNotFoodError] = useState<boolean>(false);

  // Review states
  const [analysisResult, setAnalysisResult] =
    useState<FoodAnalysisResponse | null>(null);
  const [dishName, setDishName] = useState("");
  const [mealType, setMealType] = useState<MealType>("BREAKFAST");
  const [calories, setCalories] = useState<number>(0);
  const [protein, setProtein] = useState<number>(0);
  const [carbs, setCarbs] = useState<number>(0);
  const [fat, setFat] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const resetState = () => {
    setError(null);
    setIsNotFoodError(false);
    setAnalysisResult(null);
    setDishName("");
  };

  const setupReviewForm = (res: FoodAnalysisResponse) => {
    setAnalysisResult(res);
    setDishName(res.dishName || t("log.custom_dish", "Custom Dish"));
    setMealType(res.mealType || "BREAKFAST");
    setCalories(Math.round(res.macros?.calories ?? 0));
    setProtein(Math.round(res.macros?.protein ?? 0));
    setCarbs(Math.round(res.macros?.carbs ?? 0));
    setFat(Math.round(res.macros?.fat ?? 0));
  };

  const handleSaveToJournal = async () => {
    setSaving(true);
    setError(null);

    const data = {
      mealType,
      dishName,
      macros: {
        calories,
        protein,
        carbs,
        fat,
      },
    };

    try {
      await api.addFoodEntry(data);
      onSuccess();
    } catch (err) {
      console.error(err);
      const e = err as { message?: string };
      setError(e.message || t("log.error_save", "Failed to log food entry."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col px-4 py-6 space-y-6 overflow-y-auto pb-24 max-w-md mx-auto w-full">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          {t("log.title", "Log a Meal")}
        </h2>
        <p className="text-xs text-gray-400">
          {t(
            "log.subtitle",
            "Upload a photo of your plate or describe it using text.",
          )}
        </p>
      </div>

      {/* If we don't have results yet, show input options */}
      {!analysisResult ? (
        <div className="space-y-4">
          {/* Tab bar — add new tabs to TABS array in the TabId union above */}
          <div className="flex border-b border-gray-800 pb-2 mb-2 gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setError(null);
                  setIsNotFoodError(false);
                }}
                className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                  activeTab === tab.id
                    ? "text-teal-400 bg-teal-500/5 border border-teal-500/20"
                    : "text-gray-400 hover:text-gray-250 border border-transparent"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {error && (
            <div
              className={`border rounded-xl p-3.5 text-xs flex gap-2.5 items-start ${
                isNotFoodError
                  ? "bg-amber-500/10 border-amber-500/25 text-amber-300"
                  : "bg-red-500/10 border-red-500/25 text-red-300"
              }`}
            >
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">
                  {isNotFoodError
                    ? t("log.not_food_detected", "Not Food Detected")
                    : t("log.error_occurred", "Error Occurred")}
                </span>
                <p className="leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {activeTab === "image" && (
            <ImageTab
              onAnalysisComplete={setupReviewForm}
              onError={(msg, isNotFood) => {
                setError(msg);
                setIsNotFoodError(isNotFood);
              }}
              onClearError={() => {
                setError(null);
                setIsNotFoodError(false);
              }}
            />
          )}

          {activeTab === "text" && (
            <TextTab
              onAnalysisComplete={setupReviewForm}
              onError={(msg, isNotFood) => {
                setError(msg);
                setIsNotFoodError(isNotFood);
              }}
              onClearError={() => {
                setError(null);
                setIsNotFoodError(false);
              }}
            />
          )}
        </div>
      ) : (
        /* IF ANALYSIS IS DONE, SHOW REVIEW FORM */
        <div className="space-y-5 animate-fade-in">
          <div className="flex items-center justify-between bg-teal-500/10 border border-teal-500/20 rounded-xl p-3 text-xs text-teal-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span style={{ color: "black" }}>
                {t("log.analysis_complete", "AI analysis complete")}
              </span>
            </div>
            {analysisResult.confidence && (
              <span className="font-semibold text-white">
                {t("log.confidence", "Confidence:")} {analysisResult.confidence}
              </span>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-3 text-xs text-red-300">
              {error}
            </div>
          )}

          <GlassCard className="space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-gray-800 pb-2 mb-1 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-teal-400" />
              {t("log.review_title", "Review Food Entry")}
            </h3>

            {/* Dish Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="dish-input"
                className="text-xs font-semibold text-gray-400 uppercase tracking-wider"
              >
                {t("log.dish_name", "Dish Description")}
              </label>
              <input
                id="dish-input"
                type="text"
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-teal-500/50 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
              />
            </div>

            {/* Meal Type */}
            <div className="space-y-1.5">
              <label
                htmlFor="mealtype-select"
                className="text-xs font-semibold text-gray-400 uppercase tracking-wider"
              >
                {t("log.meal_type", "Meal Type")}
              </label>
              <select
                id="mealtype-select"
                value={mealType}
                onChange={(e) => setMealType(e.target.value as MealType)}
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-teal-500/50 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
              >
                <option value="BREAKFAST">
                  {t("log.meal_breakfast", "Breakfast")}
                </option>
                <option value="LUNCH">{t("log.meal_lunch", "Lunch")}</option>
                <option value="DINNER">{t("log.meal_dinner", "Dinner")}</option>
                <option value="SNACK">{t("log.meal_snack", "Snack")}</option>
              </select>
            </div>

            {/* Macros Editor Grid */}
            <div className="grid grid-cols-2 gap-3 border-t border-gray-800/50 pt-3">
              <div className="space-y-1">
                <label
                  htmlFor="cal-input"
                  className="text-[10px] font-semibold text-gray-500 uppercase"
                >
                  {t("log.calories", "Calories (kcal)")}
                </label>
                <input
                  id="cal-input"
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(Number(e.target.value))}
                  className="w-full bg-gray-900/50 border border-gray-850 rounded-xl py-1.5 px-3 text-xs font-bold text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="protein-input"
                  className="text-[10px] font-semibold text-gray-500 uppercase"
                >
                  {t("log.protein", "Protein (g)")}
                </label>
                <input
                  id="protein-input"
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(Number(e.target.value))}
                  className="w-full bg-gray-900/50 border border-gray-850 rounded-xl py-1.5 px-3 text-xs font-bold text-amber-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="carbs-input"
                  className="text-[10px] font-semibold text-gray-500 uppercase"
                >
                  {t("log.carbs", "Carbohydrates (g)")}
                </label>
                <input
                  id="carbs-input"
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(Number(e.target.value))}
                  className="w-full bg-gray-900/50 border border-gray-850 rounded-xl py-1.5 px-3 text-xs font-bold text-emerald-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="fat-input"
                  className="text-[10px] font-semibold text-gray-500 uppercase"
                >
                  {t("log.fat", "Fat (g)")}
                </label>
                <input
                  id="fat-input"
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(Number(e.target.value))}
                  className="w-full bg-gray-900/50 border border-gray-850 rounded-xl py-1.5 px-3 text-xs font-bold text-indigo-400 focus:outline-none"
                />
              </div>
            </div>
          </GlassCard>

          {/* AI Ingredients List display */}
          {analysisResult.ingredients &&
            analysisResult.ingredients.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
                  AI Detected Ingredients
                </h4>
                <GlassCard className="py-2.5 px-3.5 space-y-1.5 max-h-40 overflow-y-auto">
                  {analysisResult.ingredients.map((ing, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-xs border-b border-gray-800/40 last:border-0 pb-1.5 last:pb-0"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-200">
                          {ing.name}
                        </span>
                        <span className="text-[9px] text-gray-550">
                          {ing.quantity} {ing.unit || ""}
                        </span>
                      </div>
                      <span className="text-[10px] text-teal-400 font-medium">
                        {ing.macros.calories} kcal
                      </span>
                    </div>
                  ))}
                </GlassCard>
              </div>
            )}

          {/* Save Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={resetState}
              disabled={saving}
              className="flex-1 bg-gray-900 hover:bg-gray-850 text-gray-300 rounded-xl py-3 text-sm font-semibold border border-gray-850 flex items-center justify-center gap-1.5 transition-all duration-200"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
            <button
              onClick={handleSaveToJournal}
              disabled={saving}
              style={{ color: "white" }}
              className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white rounded-xl py-3 text-sm font-bold shadow-lg shadow-teal-950/20 flex items-center justify-center gap-2 transition-all duration-200"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{t("log.save_btn", "Save Entry")}</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogFoodPage;
