import React, { useEffect, useRef, useState } from "react";
import {
  ScanLine, AlertTriangle, Trash2, CheckCircle2,
  ChevronRight, ArrowLeft, RotateCcw,
} from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import { api } from "../lib/api";
import type { MealType } from "../lib/api";
import GlassCard from "../components/GlassCard";
import { t } from "../lib/i18n";

interface ScannedItem {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface ScanRecipePageProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const ScanRecipePage: React.FC<ScanRecipePageProps> = ({ onBack, onSuccess }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const nextId = useRef(0);

  const [scanning, setScanning] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [mealType, setMealType] = useState<MealType>("LUNCH");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    return () => { controlsRef.current?.stop(); };
  }, []);

  const stopCamera = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setScanning(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    setScanning(true);
    try {
      const reader = new BrowserMultiFormatReader();
      const controls = await reader.decodeFromConstraints(
        { video: { facingMode: "environment" } },
        videoRef.current!,
        (result, err) => {
          if (result) {
            stopCamera();
            fetchProduct(result.getText());
          } else if (err && !(err instanceof NotFoundException)) {
            console.error(err);
          }
        },
      );
      controlsRef.current = controls;
    } catch (err: any) {
      setScanning(false);
      setCameraError(
        err.name === "NotAllowedError"
          ? t("log.qr_camera_denied", "Camera access denied. Please allow camera permission and try again.")
          : t("log.qr_camera_error", "Could not access camera.") + (err.message ? " " + err.message : ""),
      );
    }
  };

  const fetchProduct = async (barcode: string) => {
    setFetching(true);
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`,
      );
      const data = await res.json();
      if (data.status !== 1 || !data.product) {
        setCameraError(t("log.qr_not_found", "No nutrition data found for this barcode. Try another."));
        return;
      }
      const p = data.product;
      const n = p.nutriments ?? {};
      const per100 = (key: string) => parseFloat(n[`${key}_100g`] ?? n[key] ?? "0") || 0;

      const item: ScannedItem = {
        id: nextId.current++,
        name: p.product_name || p.generic_name || `Product ${barcode}`,
        calories: Math.round(per100("energy-kcal")),
        protein: Math.round(per100("proteins")),
        carbs: Math.round(per100("carbohydrates")),
        fat: Math.round(per100("fat")),
      };

      setItems((prev) => [item, ...prev]);
      setLastAdded(item.name);
      setTimeout(() => setLastAdded(null), 2500);
      navigator.vibrate?.(80);
    } catch (err: any) {
      setCameraError(err.message || t("log.qr_lookup_error", "Failed to look up product. Please try again."));
    } finally {
      setFetching(false);
    }
  };

  const removeItem = (id: number) => setItems((prev) => prev.filter((i) => i.id !== id));

  const totals = items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const handleSave = async () => {
    if (items.length === 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      await api.addFoodEntry({
        mealType,
        dishName: t("recipe.scanned_meal_name", "Scanned Meal") + ` (${items.length} items)`,
        macros: totals,
      });
      onSuccess();
    } catch (err: any) {
      setSaveError(err.message || t("log.error_save", "Failed to log food entry."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col px-4 py-6 space-y-5 overflow-y-auto pb-28 max-w-md mx-auto w-full">
      <div className="flex items-center gap-3">
        <button onClick={onBack}
          className="p-2 rounded-xl bg-gray-900 border border-gray-800 hover:bg-gray-850 text-gray-400 hover:text-white transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {t("recipe.scanner_title", "Recipe Builder")}
          </h2>
          <p className="text-xs text-gray-400">
            {t("recipe.scanner_sub", "Scan each product to add it to your meal.")}
          </p>
        </div>
      </div>

      <div className="relative rounded-2xl overflow-hidden bg-gray-950 border border-gray-800 h-52 flex items-center justify-center">
        <video ref={videoRef} muted playsInline autoPlay
          className={`h-full w-full object-cover ${scanning ? "block" : "hidden"}`}
        />

        {!scanning && !fetching && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6">
            <div className="bg-teal-500/10 p-3 rounded-full border border-teal-500/20 text-teal-400">
              <ScanLine className="w-6 h-6" />
            </div>
            <p className="text-xs text-gray-500">
              {items.length === 0
                ? t("recipe.scanner_hint_first", "Scan your first product")
                : t("recipe.scanner_hint_next", "Scan next product")}
            </p>
          </div>
        )}

        {fetching && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-950/80">
            <div className="w-7 h-7 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
            <span className="text-xs text-teal-300">{t("log.qr_loading", "Looking up product...")}</span>
          </div>
        )}

        {scanning && (
          <>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-40 h-40 border-2 border-teal-400/70 rounded-xl relative">
                <span className="absolute -top-px left-4 right-4 h-0.5 bg-teal-400 animate-[scan_2s_ease-in-out_infinite]" />
              </div>
            </div>
            <button onClick={stopCamera}
              className="absolute top-3 right-3 bg-gray-950/80 backdrop-blur-md text-gray-300 hover:text-white p-2 rounded-xl border border-gray-800 transition-all text-xs font-semibold">
              {t("log.qr_stop", "Stop")}
            </button>
          </>
        )}

        {lastAdded && (
          <div className="absolute bottom-3 left-3 right-3 bg-teal-500/90 rounded-xl px-3 py-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
            <span className="text-xs font-semibold text-white truncate">{lastAdded}</span>
          </div>
        )}
      </div>

      {cameraError && (
        <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-3 text-xs text-red-300 flex gap-2 items-start">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{cameraError}</span>
        </div>
      )}

      {!scanning && !fetching && (
        <button onClick={startCamera}
          className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all">
          <ScanLine className="w-4 h-4" />
          {items.length === 0 ? t("log.qr_start", "Start Scanner") : t("recipe.scanner_scan_more", "Scan Another")}
        </button>
      )}

      {items.length > 0 && (
        <GlassCard className="space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-semibold uppercase tracking-wider">
              {t("recipe.total", "Total")} &middot; {items.length} {t("recipe.items", "items")}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Kcal", value: String(totals.calories), color: "text-white" },
              { label: t("log.protein", "Prot."), value: `${totals.protein}g`, color: "text-amber-400" },
              { label: t("log.carbs", "Carbs"), value: `${totals.carbs}g`, color: "text-emerald-400" },
              { label: t("log.fat", "Fat"), value: `${totals.fat}g`, color: "text-indigo-400" },
            ].map((m) => (
              <div key={m.label} className="flex flex-col items-center bg-gray-800/50 rounded-xl py-2 px-1">
                <span className={`text-sm font-bold ${m.color}`}>{m.value}</span>
                <span className="text-[9px] text-gray-500 uppercase mt-0.5">{m.label}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {items.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
            {t("recipe.scanned_items", "Scanned Items")}
          </h3>
          {items.map((item) => (
            <div key={item.id}
              className="flex items-center gap-3 bg-gray-900/50 border border-gray-800 rounded-xl px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{item.name}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {item.calories} kcal &middot; {item.protein}g {t("log.protein", "prot")} &middot; {item.carbs}g {t("log.carbs", "carbs")} &middot; {item.fat}g {t("log.fat", "fat")}
                </p>
              </div>
              <button onClick={() => removeItem(item.id)}
                className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="space-y-3 pb-4">
          <div className="space-y-1.5">
            <label htmlFor="recipe-mealtype"
              className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {t("log.meal_type", "Meal Type")}
            </label>
            <select id="recipe-mealtype" value={mealType}
              onChange={(e) => setMealType(e.target.value as MealType)}
              className="w-full bg-gray-900/50 border border-gray-800 focus:border-teal-500/50 rounded-xl py-2 px-3 text-xs text-white focus:outline-none">
              <option value="BREAKFAST">{t("log.meal_breakfast", "Breakfast")}</option>
              <option value="LUNCH">{t("log.meal_lunch", "Lunch")}</option>
              <option value="DINNER">{t("log.meal_dinner", "Dinner")}</option>
              <option value="SNACK">{t("log.meal_snack", "Snack")}</option>
            </select>
          </div>

          {saveError && (
            <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-3 text-xs text-red-300">
              {saveError}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => setItems([])}
              className="flex-1 bg-gray-900 hover:bg-gray-850 text-gray-300 rounded-xl py-3 text-xs font-semibold border border-gray-800 flex items-center justify-center gap-1.5 transition-all">
              <RotateCcw className="w-3.5 h-3.5" />
              {t("recipe.clear_all", "Clear All")}
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-[2] bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
              {saving
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><span>{t("log.save_btn", "Save to Journal")}</span><ChevronRight className="w-4 h-4" /></>
              }
            </button>
          </div>
        </div>
      )}

      {items.length === 0 && !scanning && !fetching && (
        <p className="text-center text-xs text-gray-600 py-4">
          {t("recipe.scanner_empty", "No items yet - start scanning to build your meal.")}
        </p>
      )}
    </div>
  );
};

export default ScanRecipePage;