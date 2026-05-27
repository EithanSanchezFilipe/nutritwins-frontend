import React, { useState, useRef } from "react";
import { Camera, Upload, Sparkles } from "lucide-react";
import { api } from "../../lib/api";
import type { FoodAnalysisResponse } from "../../lib/api";
import { t } from "../../lib/i18n";

interface ImageTabProps {
  onAnalysisComplete: (res: FoodAnalysisResponse) => void;
  onError: (msg: string, isNotFood: boolean) => void;
  onClearError: () => void;
}

export const ImageTab: React.FC<ImageTabProps> = ({
  onAnalysisComplete,
  onError,
  onClearError,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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
      handleImageSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageSelection(e.target.files[0]);
    }
  };

  const handleImageSelection = (file: File) => {
    if (!file.type.startsWith("image/")) {
      onError(
        t("log.error_invalid_file", "Please select an image file."),
        false,
      );
      return;
    }
    onClearError();
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeImage = async () => {
    if (!selectedFile) return;
    setLoading(true);
    onClearError();

    try {
      const res = await api.analyzeImage(selectedFile);
      if (!res.isFood) {
        onError(
          t(
            "log.error_not_food_image",
            "The uploaded image does not appear to contain recognizable food.",
          ) +
            " " +
            t("log.error_no_details", "No specific details provided.") +
            (res.error ? " " + res.error : ""),
          true,
        );
      } else {
        onAnalysisComplete(res);
      }
    } catch (err: any) {
      console.error(err);
      onError(
        err.message ||
          t(
            "log.error_analyze_image",
            "Failed to analyze image. Please try again.",
          ),
        err.status === 422,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
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
            {t(
              "log.scan_sub",
              "Take a picture in the instant or select from your gallery.",
            )}
          </p>

          <div className="flex flex-col gap-2.5 w-full max-w-xs">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                cameraInputRef.current?.click();
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
                fileInputRef.current?.click();
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
            <img
              src={imagePreview}
              alt="Preview"
              className="h-full w-full object-cover"
            />
            <button
              onClick={() => {
                setImagePreview(null);
                setSelectedFile(null);
              }}
              className="absolute top-3 right-3 bg-gray-950/80 backdrop-blur-md text-gray-300 hover:text-white p-2 rounded-xl border border-gray-800 transition-all text-xs font-semibold"
            >
              {t("log.change_photo", "Change Photo")}
            </button>
          </div>

          <button
            onClick={handleAnalyzeImage}
            disabled={loading}
            style={{ color: "#ffffff" }}
            className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white rounded-xl py-3.5 text-sm font-bold shadow-lg shadow-teal-950/20 flex items-center justify-center gap-2 transition-all duration-200"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>
                  {t("log.analyzing", "AI Food Recognition Analyzing...")}
                </span>
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
  );
};

export default ImageTab;
