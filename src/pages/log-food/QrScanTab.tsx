import React, { useEffect, useRef, useState } from "react";
import { ScanLine, AlertTriangle, CheckCircle2, RotateCcw, ChevronRight, ListPlus } from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import type { FoodAnalysisResponse } from "../../lib/api";
import { t } from "../../lib/i18n";

interface QrScanTabProps {
  onAnalysisComplete: (res: FoodAnalysisResponse) => void;
  onError: (msg: string, isNotFood: boolean) => void;
  onClearError: () => void;
  onOpenRecipeScanner: () => void;
}

export const QrScanTab: React.FC<QrScanTabProps> = ({
  onAnalysisComplete,
  onError,
  onClearError,
  onOpenRecipeScanner,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [preview, setPreview] = useState<FoodAnalysisResponse | null>(null);

  useEffect(() => {
    return () => { controlsRef.current?.stop(); };
  }, []);

  const stopCamera = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setScanning(false);
  };

  const resetScan = () => {
    setPreview(null);
    onClearError();
    setCameraError(null);
  };

  const startCamera = async () => {
    onClearError();
    setCameraError(null);
    setPreview(null);
    setScanning(true);
    try {
      const reader = new BrowserMultiFormatReader();
      const controls = await reader.decodeFromConstraints(
        { video: { facingMode: "environment" } },
        videoRef.current!,
        (result, err) => {
          if (result) {
            stopCamera();
            handleBarcodeDetected(result.getText());
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

  const handleBarcodeDetected = async (barcode: string) => {
    setLoading(true);
    onClearError();
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`,
      );
      const data = await res.json();
      if (data.status !== 1 || !data.product) {
        onError(t("log.qr_not_found", "No nutrition data found for this barcode. Try the Photo or Text tab instead."), false);
        return;
      }
      const p = data.product;
      const n = p.nutriments ?? {};
      const per100 = (key: string) => parseFloat(n[`${key}_100g`] ?? n[key] ?? "0") || 0;
      setPreview({
        isFood: true,
        dishName: p.product_name || p.generic_name || `Product ${barcode}`,
        mealType: "SNACK",
        confidence: "high",
        macros: {
          calories: per100("energy-kcal"),
          protein: per100("proteins"),
          carbs: per100("carbohydrates"),
          fat: per100("fat"),
        },
        ingredients: [],
      });
    } catch (err: any) {
      onError(err.message || t("log.qr_lookup_error", "Failed to look up product. Please try again."), false);
    } finally {
      setLoading(false);
    }
  };

  if (!navigator.mediaDevices?.getUserMedia) {
    return (
      <div className="border-2 border-dashed border-gray-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4">
        <div className="bg-amber-500/10 p-4 rounded-full border border-amber-500/20 text-amber-400">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-white">{t("log.qr_unsupported_title", "Scanner not supported")}</h4>
          <p className="text-xs text-gray-500 max-w-[240px]">{t("log.qr_unsupported_body", "Your browser does not support barcode scanning. Use the Photo tab instead.")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative rounded-2xl overflow-hidden bg-gray-950 border border-gray-800 h-56 flex items-center justify-center">
        <video ref={videoRef} muted playsInline autoPlay
          className={`h-full w-full object-cover ${scanning ? "block" : "hidden"}`}
        />

        {!scanning && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
            <div className="bg-teal-500/10 p-4 rounded-full border border-teal-500/20 text-teal-400">
              <ScanLine className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-white">{t("log.qr_title", "Scan a Barcode")}</h4>
              <p className="text-xs text-gray-500 max-w-[200px]">{t("log.qr_sub", "Point your camera at a product barcode or QR code to instantly load nutrition info.")}</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-950/80">
            <div className="w-8 h-8 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
            <span className="text-xs text-teal-300">{t("log.qr_loading", "Looking up product...")}</span>
          </div>
        )}

        {scanning && (
          <>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-44 h-44 border-2 border-teal-400/70 rounded-xl relative">
                <span className="absolute -top-px left-4 right-4 h-0.5 bg-teal-400 animate-[scan_2s_ease-in-out_infinite]" />
              </div>
            </div>
            <button onClick={stopCamera}
              className="absolute top-3 right-3 bg-gray-950/80 backdrop-blur-md text-gray-300 hover:text-white p-2 rounded-xl border border-gray-800 transition-all text-xs font-semibold">
              {t("log.qr_stop", "Stop")}
            </button>
          </>
        )}
      </div>

      {cameraError && (
        <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-3 text-xs text-red-300 flex gap-2 items-start">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{cameraError}</span>
        </div>
      )}

      {preview && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-teal-300">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            <span>{t("log.qr_detected", "Product detected")}</span>
          </div>
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 space-y-3">
            <p className="text-sm font-bold text-white leading-snug">{preview.dishName}</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Kcal", value: String(Math.round(preview.macros?.calories ?? 0)), color: "text-white" },
                { label: t("log.protein", "Prot."), value: `${Math.round(preview.macros?.protein ?? 0)}g`, color: "text-amber-400" },
                { label: t("log.carbs", "Carbs"), value: `${Math.round(preview.macros?.carbs ?? 0)}g`, color: "text-emerald-400" },
                { label: t("log.fat", "Fat"), value: `${Math.round(preview.macros?.fat ?? 0)}g`, color: "text-indigo-400" },
              ].map((m) => (
                <div key={m.label} className="flex flex-col items-center bg-gray-800/50 rounded-xl py-2 px-1">
                  <span className={`text-sm font-bold ${m.color}`}>{m.value}</span>
                  <span className="text-[9px] text-gray-500 uppercase mt-0.5">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={resetScan}
              className="flex-1 bg-gray-900 hover:bg-gray-850 text-gray-300 rounded-xl py-2.5 text-xs font-semibold border border-gray-800 flex items-center justify-center gap-1.5 transition-all">
              <RotateCcw className="w-3.5 h-3.5" />
              {t("log.qr_scan_again", "Scan Again")}
            </button>
            <button onClick={() => onAnalysisComplete(preview)}
              className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all">
              {t("log.qr_add_journal", "Add to Journal")}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {!scanning && !preview && (
        <div className="space-y-2.5">
          <button onClick={startCamera} disabled={loading}
            className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white rounded-xl py-3.5 text-sm font-bold shadow-lg shadow-teal-950/20 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50">
            <ScanLine className="w-4 h-4" />
            <span>{t("log.qr_start", "Start Scanner")}</span>
          </button>
          <button onClick={onOpenRecipeScanner}
            className="w-full bg-gray-900 hover:bg-gray-850 border border-gray-800 hover:border-teal-500/30 text-gray-300 hover:text-teal-300 rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-2 transition-all">
            <ListPlus className="w-4 h-4 text-teal-400" />
            {t("log.qr_open_recipe_scanner", "Scan Multiple Items - Recipe Builder")}
          </button>
        </div>
      )}
    </div>
  );
};

export default QrScanTab;