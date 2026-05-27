import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import { api } from "../../lib/api";
import type { FoodAnalysisResponse } from "../../lib/api";
import { t } from "../../lib/i18n";

interface TextTabProps {
  onAnalysisComplete: (res: FoodAnalysisResponse) => void;
  onError: (msg: string, isNotFood: boolean) => void;
  onClearError: () => void;
}

export const TextTab: React.FC<TextTabProps> = ({
  onAnalysisComplete,
  onError,
  onClearError,
}) => {
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");

  const handleAnalyzeText = async () => {
    if (!description.trim()) return;
    setLoading(true);
    onClearError();

    try {
      const res = await api.analyzeText(description);
      if (!res.isFood) {
        onError(
          "The description does not appear to describe food. Details: " +
            (res.error || "No specific details provided."),
          true,
        );
      } else {
        onAnalysisComplete(res);
      }
    } catch (err) {
      console.error(err);
      const e = err as { message?: string; status?: number };
      onError(
        e.message || "Failed to analyze text description. Please try again.",
        e.status === 422,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label
          htmlFor="food-desc"
          className="text-xs font-medium text-gray-400 uppercase tracking-wider"
        >
          {t("log.text_label", "What did you eat?")}
        </label>
        <textarea
          id="food-desc"
          rows={4}
          placeholder={t(
            "log.text_placeholder",
            "Example: I ate a bowl of chicken noodle soup, a side garden salad with olive oil dressing, and a small red apple.",
          )}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-gray-900/40 border border-gray-800 focus:border-teal-500/50 rounded-xl p-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500/20 transition-all resize-none"
        />
      </div>

      <button
        onClick={handleAnalyzeText}
        disabled={loading || !description.trim()}
        style={{ color: "white" }}
        className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white rounded-xl py-3.5 text-sm font-bold shadow-lg shadow-teal-950/20 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>
              {t("log.analyzing", "AI Language Model Analyzing...")}
            </span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 fill-white/10" />
            <span>{t("log.analyze_btn", "Analyze Description")}</span>
          </>
        )}
      </button>
    </div>
  );
};

export default TextTab;
