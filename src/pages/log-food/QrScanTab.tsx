import React, { useEffect, useRef, useState } from "react";
import { ScanLine, AlertTriangle } from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import type { FoodAnalysisResponse } from "../../lib/api";
import { t } from "../../lib/i18n";

interface QrScanTabProps {
  onAnalysisComplete: (res: FoodAnalysisResponse) => void;
  onError: (msg: string, isNotFood: boolean) => void;
  onClearError: () => void;
}

/**
 * QR / Barcode scan tab.
 *
 * Uses @zxing/browser for cross-browser barcode + QR detection
 * (works on Chrome, Firefox, Safari, Edge — no native API required).
 */
export const QrScanTab: React.FC<QrScanTabProps> = ({
  onAnalysisComplete,
  onError,
  onClearError,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detected, setDetected] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      controlsRef.current?.stop();
    };
  }, []);

  const stopCamera = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setScanning(false);
  };

  const startCamera = async () => {
    onClearError();
    setCameraError(null);
    setDetected(null);
    // Set scanning first — video is always in the DOM so videoRef.current is valid
    setScanning(true);

    try {
      const reader = new BrowserMultiFormatReader();
      const controls = await reader.decodeFromConstraints(
        { video: { facingMode: "environment" } },
        videoRef.current!,
        (result, err) => {
          if (result) {
            const code = result.getText();
            stopCamera();
            setDetected(code);
            handleBarcodeDetected(code);
          } else if (err && !(err instanceof NotFoundException)) {
            // NotFoundException fires on every empty frame — safe to ignore
            console.error(err);
          }
        },
      );
      controlsRef.current = controls;
    } catch (err: any) {
      setScanning(false);
      setCameraError(
        err.name === "NotAllowedError"
          ? t(
              "log.qr_camera_denied",
              "Camera access denied. Please allow camera permission and try again.",
            )
          : t("log.qr_camera_error", "Could not access camera.") +
              (err.message ? " " + err.message : ""),
      );
    }
  };

  const handleBarcodeDetected = async (barcode: string) => {
    setLoading(true);
    onClearError();

    try {
      // Fetch product nutrition from Open Food Facts (no API key required)
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`,
      );
      const data = await res.json();

      if (data.status !== 1 || !data.product) {
        onError(
          t(
            "log.qr_not_found",
            "No nutrition data found for this barcode. Try the Photo or Text tab instead.",
          ),
          false,
        );
        return;
      }

      const p = data.product;
      const nutriments = p.nutriments ?? {};
      const per100 = (key: string) =>
        parseFloat(nutriments[`${key}_100g`] ?? nutriments[key] ?? "0") || 0;

      // Build a FoodAnalysisResponse-compatible object
      const analysisResult: FoodAnalysisResponse = {
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
      };

      onAnalysisComplete(analysisResult);
    } catch (err: any) {
      onError(
        err.message ||
          t(
            "log.qr_lookup_error",
            "Failed to look up product. Please try again.",
          ),
        false,
      );
    } finally {
      setLoading(false);
    }
  };

  // Browser doesn't support getUserMedia at all
  if (!navigator.mediaDevices?.getUserMedia) {
    return (
      <div className="border-2 border-dashed border-gray-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4">
        <div className="bg-amber-500/10 p-4 rounded-full border border-amber-500/20 text-amber-400">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-white">
            {t("log.qr_unsupported_title", "Scanner not supported")}
          </h4>
          <p className="text-xs text-gray-500 max-w-[240px]">
            {t(
              "log.qr_unsupported_body",
              "Your browser does not support barcode scanning. Use the Photo tab to photograph the product label instead.",
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Viewfinder — video is always in the DOM so videoRef is always valid */}
      <div className="relative rounded-2xl overflow-hidden bg-gray-950 border border-gray-800 h-64 flex items-center justify-center">
        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          className={`h-full w-full object-cover ${scanning ? "block" : "hidden"}`}
        />

        {/* Placeholder shown before scanning starts */}
        {!scanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
            <div className="bg-teal-500/10 p-4 rounded-full border border-teal-500/20 text-teal-400">
              <ScanLine className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-white">
                {t("log.qr_title", "Scan a Barcode")}
              </h4>
              <p className="text-xs text-gray-500 max-w-[200px]">
                {t(
                  "log.qr_sub",
                  "Point your camera at a product barcode or QR code to instantly load nutrition info.",
                )}
              </p>
            </div>
          </div>
        )}

        {/* Scan overlay + stop button when camera is active */}
        {scanning && (
          <>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-teal-400/70 rounded-xl relative">
                <span className="absolute -top-px left-4 right-4 h-0.5 bg-teal-400 animate-[scan_2s_ease-in-out_infinite]" />
              </div>
            </div>
            <button
              onClick={stopCamera}
              className="absolute top-3 right-3 bg-gray-950/80 backdrop-blur-md text-gray-300 hover:text-white p-2 rounded-xl border border-gray-800 transition-all text-xs font-semibold"
            >
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

      {detected && !loading && (
        <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-3 text-xs text-teal-300">
          {t("log.qr_detected", "Detected")}:{" "}
          <span className="font-mono font-bold text-white">{detected}</span>
        </div>
      )}

      {!scanning && (
        <button
          onClick={startCamera}
          disabled={loading}
          className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white rounded-xl py-3.5 text-sm font-bold shadow-lg shadow-teal-950/20 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{t("log.qr_loading", "Looking up product...")}</span>
            </>
          ) : (
            <>
              <ScanLine className="w-4 h-4" />
              <span>{t("log.qr_start", "Start Scanner")}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default QrScanTab;
