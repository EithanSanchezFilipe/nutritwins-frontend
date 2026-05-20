import React, { useState, useRef } from "react";
import { Camera, FileText, Upload, Sparkles, AlertTriangle, CheckCircle2, ChevronRight, Edit2, RotateCcw } from "lucide-react";
import { api } from "../lib/api";
import type { FoodAnalysisResponse, MealType } from "../lib/api";
import GlassCard from "../components/GlassCard";
import { t } from "../lib/i18n";

interface LogFoodPageProps {
  onSuccess: () => void;
}

export const LogFoodPage: React.FC<LogFoodPageProps> = ({ onSuccess }) => {
  const [activeTab, setActiveTab] = useState<"image" | "text">("image");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNotFoodError, setIsNotFoodError] = useState<boolean>(false);
  
  // Text state
  const [description, setDescription] = useState("");

  // Image state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Review states
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisResponse | null>(null);
  const [dishName, setDishName] = useState("");
  const [mealType, setMealType] = useState<MealType>("BREAKFAST");
  const [calories, setCalories] = useState<number>(0);
  const [protein, setProtein] = useState<number>(0);
  const [carbs, setCarbs] = useState<number>(0);
  const [fat, setFat] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  // Drag and Drop State
  const [dragActive, setDragActive] = useState(false);

  const resetState = () => {
    setLoading(false);
    setError(null);
    setIsNotFoodError(false);
    setSelectedFile(null);
    setImagePreview(null);
    setDescription("");
    setAnalysisResult(null);
    setDishName("");
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleImageSelection(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageSelection(e.target.files[0]);
    }
  };

  const handleImageSelection = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    setError(null);
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const triggerCameraSelect = () => {
    cameraInputRef.current?.click();
  };

  const handleAnalyzeImage = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    setIsNotFoodError(false);

    try {
      const res = await api.analyzeImage(selectedFile);
      
      if (!res.isFood) {
        setIsNotFoodError(true);
        setError("The uploaded image does not appear to contain recognizable food. Details: " + (res.error || "No specific details provided."));
      } else {
        setupReviewForm(res);
      }
    } catch (err: any) {
      console.error(err);
      if (err.status === 422) {
        setIsNotFoodError(true);
      }
      setError(err.message || "Failed to analyze image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeText = async () => {
    if (!description.trim()) return;
    setLoading(true);
    setError(null);
    setIsNotFoodError(false);

    try {
      const res = await api.analyzeText(description);
      
      if (!res.isFood) {
        setIsNotFoodError(true);
        setError("The description does not appear to describe food. Details: " + (res.error || "No specific details provided."));
      } else {
        setupReviewForm(res);
      }
    } catch (err: any) {
      console.error(err);
      if (err.status === 422) {
        setIsNotFoodError(true);
      }
      setError(err.message || "Failed to analyze text description. Please try again.");
    } finally {
      setLoading(false);
    }
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
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to log food entry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col px-4 py-6 space-y-6 overflow-y-auto pb-24 max-w-md mx-auto w-full">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-white tracking-tight">{t("log.title", "Log a Meal")}</h2>
        <p className="text-xs text-gray-400">
          {t("log.subtitle", "Upload a photo of your plate or describe it using text.")}
        </p>
      </div>

      {/* If we don't have results yet, show input options */}
      {!analysisResult ? (
        <div className="space-y-4">
          <div className="flex border-b border-gray-800 pb-2 mb-2">
            <button
              onClick={() => {
                setActiveTab("image");
                setError(null);
              }}
              className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === "image"
                  ? "text-teal-400 bg-teal-500/5 border border-teal-500/20"
                  : "text-gray-400 hover:text-gray-250 border border-transparent"
              }`}
            >
              <Camera className="w-4 h-4" />
              {t("log.tab_image", "Photo Analysis")}
            </button>
            <button
              onClick={() => {
                setActiveTab("text");
                setError(null);
              }}
              className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === "text"
                  ? "text-teal-400 bg-teal-500/5 border border-teal-500/20"
                  : "text-gray-400 hover:text-gray-250 border border-transparent"
              }`}
            >
              <FileText className="w-4 h-4" />
              {t("log.tab_text", "Text Input")}
            </button>
          </div>

          {error && (
            <div className={`border rounded-xl p-3.5 text-xs flex gap-2.5 items-start ${
              isNotFoodError 
                ? "bg-amber-500/10 border-amber-500/25 text-amber-300"
                : "bg-red-500/10 border-red-500/25 text-red-300"
            }`}>
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">
                  {isNotFoodError ? t("log.not_food_detected", "Not Food Detected") : t("log.error_occurred", "Error Occurred")}
                </span>
                <p className="leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* TAB 1: IMAGE ANALYZER */}
          {activeTab === "image" && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="food-image-upload"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
                id="food-camera-capture"
              />

              {!imagePreview ? (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 ${
                    dragActive
                      ? "border-teal-500 bg-teal-500/5"
                      : "border-gray-800 bg-gray-900/10 hover:border-gray-700/60"
                  }`}
                >
                  <div className="bg-teal-500/10 p-4 rounded-full border border-teal-500/20 mb-4 text-teal-400">
                    <Camera className="w-6 h-6 animate-pulse" />
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">
                    {t("log.scan_title", "Capture or Upload Food")}
                  </h4>
                  <p className="text-xs text-gray-500 max-w-[200px] mb-5">
                    {t("log.scan_sub", "Take a picture in the instant or select from your gallery.")}
                  </p>
                  
                  <div className="flex flex-col gap-2.5 w-full max-w-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerCameraSelect();
                      }}
                      className="w-full text-xs bg-teal-500 hover:bg-teal-400 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                    >
                      <Camera className="w-4 h-4" />
                      {t("log.take_photo", "Take Photo")}
                    </button>
                    
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerFileSelect();
                      }}
                      className="w-full text-xs bg-gray-900 hover:bg-gray-850 border border-gray-800 hover:border-gray-700 text-gray-300 font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                    >
                      <Upload className="w-4 h-4" />
                      {t("log.open_gallery", "Open Gallery")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden border border-gray-850 h-56 bg-gray-900 flex items-center justify-center">
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                    <button
                      onClick={() => {
                        setImagePreview(null);
                        setSelectedFile(null);
                      }}
                      className="absolute top-3 right-3 bg-gray-950/80 backdrop-blur-md text-gray-300 hover:text-white p-2 rounded-xl border border-gray-800 transition-all text-xs font-semibold"
                    >
                      Change Photo
                    </button>
                  </div>

                  <button
                    onClick={handleAnalyzeImage}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white rounded-xl py-3.5 text-sm font-bold shadow-lg shadow-teal-950/20 flex items-center justify-center gap-2 transition-all duration-200"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{t("log.analyzing", "AI Food Recognition Analyzing...")}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 fill-white/10" />
                        <span>{t("log.analyze_btn", "Analyze Dish Photo")}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TEXT ANALYZER */}
          {activeTab === "text" && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="food-desc" className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t("log.text_label", "What did you eat?")}
                </label>
                <textarea
                  id="food-desc"
                  rows={4}
                  placeholder={t("log.text_placeholder", "Example: I ate a bowl of chicken noodle soup, a side garden salad with olive oil dressing, and a small red apple.")}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-900/40 border border-gray-800 focus:border-teal-500/50 rounded-xl p-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500/20 transition-all resize-none"
                />
              </div>

              <button
                onClick={handleAnalyzeText}
                disabled={loading || !description.trim()}
                className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white rounded-xl py-3.5 text-sm font-bold shadow-lg shadow-teal-950/20 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t("log.analyzing", "AI Language Model Analyzing...")}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-white/10" />
                    <span>{t("log.analyze_btn", "Analyze Description")}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* IF ANALYSIS IS DONE, SHOW REVIEW FORM */
        <div className="space-y-5 animate-fade-in">
          <div className="flex items-center justify-between bg-teal-500/10 border border-teal-500/20 rounded-xl p-3 text-xs text-teal-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>{t("log.analysis_complete", "AI analysis complete")}</span>
            </div>
            {analysisResult.confidence && (
              <span className="font-semibold">{t("log.confidence", "Confidence:")} {analysisResult.confidence}</span>
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
              <label htmlFor="dish-input" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
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
              <label htmlFor="mealtype-select" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {t("log.meal_type", "Meal Type")}
              </label>
              <select
                id="mealtype-select"
                value={mealType}
                onChange={(e) => setMealType(e.target.value as MealType)}
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-teal-500/50 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
              >
                <option value="BREAKFAST">{t("log.meal_breakfast", "Breakfast")}</option>
                <option value="LUNCH">{t("log.meal_lunch", "Lunch")}</option>
                <option value="DINNER">{t("log.meal_dinner", "Dinner")}</option>
                <option value="SNACK">{t("log.meal_snack", "Snack")}</option>
              </select>
            </div>

            {/* Macros Editor Grid */}
            <div className="grid grid-cols-2 gap-3 border-t border-gray-800/50 pt-3">
              <div className="space-y-1">
                <label htmlFor="cal-input" className="text-[10px] font-semibold text-gray-500 uppercase">
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
                <label htmlFor="protein-input" className="text-[10px] font-semibold text-gray-500 uppercase">
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
                <label htmlFor="carbs-input" className="text-[10px] font-semibold text-gray-500 uppercase">
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
                <label htmlFor="fat-input" className="text-[10px] font-semibold text-gray-500 uppercase">
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
          {analysisResult.ingredients && analysisResult.ingredients.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
                AI Detected Ingredients
              </h4>
              <GlassCard className="py-2.5 px-3.5 space-y-1.5 max-h-40 overflow-y-auto">
                {analysisResult.ingredients.map((ing, i) => (
                  <div key={i} className="flex justify-between items-center text-xs border-b border-gray-800/40 last:border-0 pb-1.5 last:pb-0">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-200">{ing.name}</span>
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
