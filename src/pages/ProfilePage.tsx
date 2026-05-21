import React, { useEffect, useState } from "react";
import {
  User,
  Activity,
  Save,
  Plus,
  X,
  Heart,
  ShieldAlert,
} from "lucide-react";
import { api } from "../lib/api";
import type { UserProfile, UserStats } from "../lib/api";
import GlassCard from "../components/GlassCard";
import { t, getLang } from "../lib/i18n";

export const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Edit states for metabolic stats
  const [editingStats, setEditingStats] = useState(false);
  const [gender, setGender] = useState<"MALE" | "FEMALE">("MALE");
  const [birthDate, setBirthDate] = useState("");
  const [height, setHeight] = useState<number>(170);
  const [weight, setWeight] = useState<number>(70);
  const [activityLevel, setActivityLevel] = useState<
    "SEDENTARY" | "LIGHTLY_ACTIVE" | "MODERATELY_ACTIVE" | "VERY_ACTIVE"
  >("SEDENTARY");
  const [goal, setGoal] = useState<"LOSE_WEIGHT" | "MAINTAIN" | "GAIN_MUSCLE">(
    "MAINTAIN",
  );
  const [updatingStats, setUpdatingStats] = useState(false);

  // Language state
  const [currentLang, setCurrentLang] = useState<string>(getLang());

  const handleLanguageChange = (lang: string) => {
    localStorage.setItem("nutritwins_lang", lang);
    setCurrentLang(lang);
    window.location.reload();
  };

  // Allergy states
  const [allergies, setAllergies] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState("");
  const [updatingAllergies, setUpdatingAllergies] = useState(false);

  const commonAllergies = [
    "Peanuts",
    "Tree Nuts",
    "Dairy",
    "Eggs",
    "Gluten",
    "Soy",
    "Fish",
    "Shellfish",
    "Sesame",
  ];

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getProfile();
      setProfile(data);

      // Initialize edit fields
      setGender(data.gender || "MALE");
      setBirthDate(
        data.birthDate
          ? new Date(data.birthDate).toISOString().split("T")[0]
          : "",
      );
      setHeight(data.height || 170);
      setWeight(data.weight || 70);
      setActivityLevel(data.activityLevel || "SEDENTARY");
      setGoal(data.goal || "MAINTAIN");
      setAllergies(data.allergies || []);
    } catch (err: any) {
      console.error(err);
      setError(
        err.message ||
          "Failed to load profile. Please make sure you are logged in.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveStats = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingStats(true);
    setError(null);
    setSuccessMsg(null);

    const stats: UserStats = {
      gender,
      birthDate,
      height,
      weight,
      activityLevel,
      goal,
    };

    try {
      const res = await api.calculateCalories(stats);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              ...stats,
              bmr: res.bmr,
              tdee: res.tdee,
              targetCal: res.targetCal,
            }
          : null,
      );
      setEditingStats(false);
      showSuccess(
        "Metabolic stats and target calories recalculated successfully!",
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save stats.");
    } finally {
      setUpdatingStats(false);
    }
  };

  const handleToggleAllergy = async (allergyName: string) => {
    const isSelected = allergies.includes(allergyName);
    const updatedAllergies = isSelected
      ? allergies.filter((name) => name !== allergyName)
      : [...allergies, allergyName];

    await saveAllergies(updatedAllergies);
  };

  const handleAddCustomAllergy = async (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = newAllergy.trim();
    if (!formatted) return;

    if (allergies.some((a) => a.toLowerCase() === formatted.toLowerCase())) {
      setNewAllergy("");
      return;
    }

    const updatedAllergies = [...allergies, formatted];
    await saveAllergies(updatedAllergies);
    setNewAllergy("");
  };

  const handleRemoveAllergy = async (allergyName: string) => {
    const updatedAllergies = allergies.filter((name) => name !== allergyName);
    await saveAllergies(updatedAllergies);
  };

  const saveAllergies = async (updatedList: string[]) => {
    setUpdatingAllergies(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.updateAllergies(updatedList);
      setAllergies(res.allergies);
      setProfile((prev) =>
        prev ? { ...prev, allergies: res.allergies } : null,
      );
      showSuccess(
        "Allergies updated. Recipes suggestion AI will reflect these restrictions.",
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update allergies.");
    } finally {
      setUpdatingAllergies(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg(null);
    }, 4000);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading user profile...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center px-4 text-center">
        <GlassCard className="max-w-xs border-red-500/20">
          <p className="text-xs text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchProfile}
            className="text-xs bg-gray-900 text-white hover:bg-gray-850 px-4 py-2 rounded-xl border border-gray-800 font-semibold"
          >
            Retry
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col px-4 py-6 space-y-6 overflow-y-auto pb-24 max-w-md mx-auto w-full">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          {t("prof.title", "Your Profile")}
        </h2>
        <p className="text-xs text-gray-400">
          {t("prof.subtitle", "Manage your metabolic targets and allergies.")}
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-3.5 text-xs text-emerald-300 animate-fade-in">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-3.5 text-xs text-red-300">
          {error}
        </div>
      )}

      {profile && (
        <>
          {/* Identity Card */}
          <GlassCard className="flex items-center gap-4">
            <div className="bg-teal-500/10 border border-teal-500/20 p-3 rounded-2xl text-teal-400 shrink-0">
              <User className="w-8 h-8" />
            </div>
            <div className="overflow-hidden">
              <h3 className="font-bold text-white leading-tight truncate">
                {profile.name}
              </h3>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {profile.email}
              </p>
            </div>
          </GlassCard>

          {/* Stats Display / Edit Panel */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-teal-400" />{" "}
                {t("prof.stats_title", "Metabolic Parameters")}
              </h3>
              <button
                onClick={() => setEditingStats(!editingStats)}
                className="text-xs text-teal-400 hover:text-teal-300 font-semibold transition-colors"
              >
                {editingStats
                  ? "Cancel"
                  : t("prof.edit_btn", "Edit Parameters")}
              </button>
            </div>

            {editingStats ? (
              <GlassCard className="animate-fade-in overflow-hidden">
                <form onSubmit={handleSaveStats} className="space-y-4">
                  {/* Gender & Birth Date */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label
                        htmlFor="edit-gender"
                        className="text-[10px] font-semibold text-gray-500 uppercase"
                      >
                        {t("prof.gender", "Gender")}
                      </label>
                      <select
                        id="edit-gender"
                        value={gender}
                        onChange={(e) => setGender(e.target.value as any)}
                        className="w-full bg-gray-950/40 border border-gray-850 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                      >
                        <option value="MALE">{t("prof.male", "Male")}</option>
                        <option value="FEMALE">
                          {t("prof.female", "Female")}
                        </option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label
                        htmlFor="edit-birthdate"
                        className="text-[10px] font-semibold text-gray-500 uppercase"
                      >
                        {t("prof.birthdate", "Birth Date")}
                      </label>
                      <input
                        id="edit-birthdate"
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full bg-gray-950/40 border border-gray-850 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Proportions Slider inputs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label
                        htmlFor="edit-height"
                        className="text-[10px] font-semibold text-gray-500 uppercase"
                      >
                        {t("prof.height", "Height (cm)")}
                      </label>
                      <input
                        id="edit-height"
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(Number(e.target.value))}
                        className="w-full bg-gray-950/40 border border-gray-850 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label
                        htmlFor="edit-weight"
                        className="text-[10px] font-semibold text-gray-500 uppercase"
                      >
                        {t("prof.weight", "Weight (kg)")}
                      </label>
                      <input
                        id="edit-weight"
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(Number(e.target.value))}
                        className="w-full bg-gray-950/40 border border-gray-850 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Activity Level */}
                  <div className="space-y-1">
                    <label
                      htmlFor="edit-activity"
                      className="text-[10px] font-semibold text-gray-500 uppercase"
                    >
                      {t("prof.activity", "Activity Level")}
                    </label>
                    <select
                      id="edit-activity"
                      value={activityLevel}
                      onChange={(e) => setActivityLevel(e.target.value as any)}
                      className="w-full bg-gray-950/40 border border-gray-850 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                    >
                      <option value="SEDENTARY">
                        {t("prof.sedentary", "Sedentary")}
                      </option>
                      <option value="LIGHTLY_ACTIVE">
                        {t("prof.light", "Lightly Active")}
                      </option>
                      <option value="MODERATELY_ACTIVE">
                        {t("prof.moderate", "Moderately Active")}
                      </option>
                      <option value="VERY_ACTIVE">
                        {t("prof.very", "Very Active")}
                      </option>
                    </select>
                  </div>

                  {/* Fitness Goal */}
                  <div className="space-y-1">
                    <label
                      htmlFor="edit-goal"
                      className="text-[10px] font-semibold text-gray-500 uppercase"
                    >
                      {t("prof.goal", "Goal")}
                    </label>
                    <select
                      id="edit-goal"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value as any)}
                      className="w-full bg-gray-950/40 border border-gray-850 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                    >
                      <option value="LOSE_WEIGHT">
                        {t("prof.lose", "Lose Weight")}
                      </option>
                      <option value="MAINTAIN">
                        {t("prof.maintain", "Maintain")}
                      </option>
                      <option value="GAIN_MUSCLE">
                        {t("prof.gain", "Gain Muscle")}
                      </option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={updatingStats}
                    style={{ color: "#ffffff" }}
                    className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-teal-950/20"
                  >
                    {updatingStats ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4" color="#ffffff" />
                        <span>
                          {t("prof.save_btn", "Save & Recalculate Calories")}
                        </span>
                      </>
                    )}
                  </button>
                </form>
              </GlassCard>
            ) : (
              <GlassCard className="grid grid-cols-3 gap-2 divide-x divide-gray-800/40 text-center py-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-gray-500 uppercase font-semibold">
                    BMR
                  </span>
                  <span className="text-lg font-bold text-white">
                    {profile.bmr || "—"}
                  </span>
                  <span className="text-[8px] text-gray-400">kcal/day</span>
                </div>
                <div className="flex flex-col gap-0.5 pl-2">
                  <span className="text-[9px] text-gray-500 uppercase font-semibold">
                    TDEE
                  </span>
                  <span className="text-lg font-bold text-white">
                    {profile.tdee || "—"}
                  </span>
                  <span className="text-[8px] text-gray-400">kcal/day</span>
                </div>
                <div className="flex flex-col gap-0.5 pl-2">
                  <span className="text-[9px] text-teal-400 uppercase font-semibold">
                    Target
                  </span>
                  <span className="text-lg font-bold text-teal-400">
                    {profile.targetCal || "—"}
                  </span>
                  <span className="text-[8px] text-teal-500/80">kcal/day</span>
                </div>
              </GlassCard>
            )}
          </div>

          {/* Allergy Panel */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
              <ShieldAlert className="w-3.5 h-3.5 text-teal-400" />{" "}
              {t("prof.allergies_title", "Allergies & Intolerances")}
            </h3>

            <GlassCard className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {commonAllergies.map((allergy) => {
                  const isSelected = allergies.includes(allergy);
                  return (
                    <button
                      key={allergy}
                      onClick={() => handleToggleAllergy(allergy)}
                      disabled={updatingAllergies}
                      className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                        isSelected
                          ? "text-red-400 bg-red-500/5 border-red-500/20 shadow-md shadow-red-950/5"
                          : "text-gray-400 bg-gray-950/20 border-gray-850 hover:text-gray-300"
                      }`}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${isSelected ? "fill-red-400/20 text-red-400" : "text-gray-500"}`}
                      />
                      {t("allergy." + allergy, allergy)}
                    </button>
                  );
                })}
              </div>

              {/* Custom Allergy Creator */}
              <form
                onSubmit={handleAddCustomAllergy}
                className="flex gap-2 border-t border-gray-800/40 pt-3"
              >
                <input
                  type="text"
                  placeholder={t(
                    "prof.allergy_placeholder",
                    "Add custom intolerance...",
                  )}
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  disabled={updatingAllergies}
                  className="flex-1 bg-gray-950/40 border border-gray-850 rounded-xl py-2 px-3 text-xs text-white focus:outline-none placeholder-gray-550"
                />
                <button
                  type="submit"
                  disabled={updatingAllergies || !newAllergy.trim()}
                  className="bg-teal-500 hover:bg-teal-400 text-white rounded-xl py-2 px-3.5 text-xs font-semibold flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t("prof.allergy_add_btn", "Add")}</span>
                </button>
              </form>

              {/* User Selected Allergies List */}
              {allergies.length > 0 && (
                <div className="border-t border-gray-800/40 pt-3 space-y-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    {t("prof.allergy_active", "Allergy Filters Active")} (
                    {allergies.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {allergies.map((allergy) => (
                      <span
                        key={allergy}
                        className="inline-flex items-center gap-1 bg-gray-950/60 border border-gray-850 rounded-lg py-1 pl-2.5 pr-1.5 text-xs text-gray-300"
                      >
                        {t("allergy." + allergy, allergy)}
                        <button
                          type="button"
                          onClick={() => handleRemoveAllergy(allergy)}
                          className="p-0.5 text-gray-500 hover:text-red-400 rounded transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          </div>

          {/* Language Settings Panel */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
              <User className="w-3.5 h-3.5 text-teal-400" />{" "}
              {t("prof.lang_title", "Language / Langue")}
            </h3>
            <GlassCard className="p-4 space-y-3">
              <p className="text-xs text-gray-400">
                {t(
                  "prof.lang_sub",
                  "Choose your preferred language for the application interface and AI suggestions (Recipes & Food Analysis).",
                )}
              </p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handleLanguageChange("en")}
                  className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                    currentLang === "en"
                      ? "text-teal-400 bg-teal-500/5 border-teal-500/20 shadow-md"
                      : "text-gray-400 bg-gray-950/20 border-gray-850 hover:text-gray-300"
                  }`}
                >
                  🇬🇧 English
                </button>
                <button
                  onClick={() => handleLanguageChange("fr")}
                  className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                    currentLang === "fr"
                      ? "text-teal-400 bg-teal-500/5 border-teal-500/20 shadow-md"
                      : "text-gray-400 bg-gray-950/20 border-gray-850 hover:text-gray-300"
                  }`}
                >
                  🇫🇷 Français
                </button>
                <button
                  onClick={() => handleLanguageChange("es")}
                  className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                    currentLang === "es"
                      ? "text-teal-400 bg-teal-500/5 border-teal-500/20 shadow-md"
                      : "text-gray-400 bg-gray-950/20 border-gray-850 hover:text-gray-300"
                  }`}
                >
                  🇪🇸 Español
                </button>
              </div>
            </GlassCard>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfilePage;
