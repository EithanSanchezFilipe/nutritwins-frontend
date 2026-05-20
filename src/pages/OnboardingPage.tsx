import React, { useState } from "react";
import { User, Calendar, Ruler, Scale, Flame, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { api } from "../lib/api";
import type { UserStats } from "../lib/api";
import GlassCard from "../components/GlassCard";

interface OnboardingPageProps {
  onComplete: () => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [gender, setGender] = useState<"MALE" | "FEMALE">("MALE");
  const [birthDate, setBirthDate] = useState("");
  const [height, setHeight] = useState<number>(175);
  const [weight, setWeight] = useState<number>(70);
  const [activityLevel, setActivityLevel] = useState<
    "SEDENTARY" | "LIGHTLY_ACTIVE" | "MODERATELY_ACTIVE" | "VERY_ACTIVE"
  >("SEDENTARY");
  const [goal, setGoal] = useState<"LOSE_WEIGHT" | "MAINTAIN" | "GAIN_MUSCLE">("MAINTAIN");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{ bmr: number; tdee: number; targetCal: number } | null>(null);

  const handleNext = () => {
    if (step === 1 && !birthDate) {
      setError("Please select your birth date");
      return;
    }
    setError(null);
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

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
      setResults(res);
      setStep(4); // Results step
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to calculate statistics. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  const totalSteps = 3;

  return (
    <div className="flex-1 flex flex-col justify-center px-4 py-8 max-w-md mx-auto w-full mb-16">
      {/* Progress header */}
      {step <= totalSteps && (
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wider">
            <span>Metabolic Profile Setup</span>
            <span>Step {step} of {totalSteps}</span>
          </div>
          <div className="w-full bg-gray-900 rounded-full h-1.5 border border-gray-800/50">
            <div
              className="bg-teal-500 h-1.5 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(20,184,166,0.5)]"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-3 mb-5 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Step 1: Gender & Birth Date */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-white tracking-tight">Tell us about yourself</h3>
            <p className="text-sm text-gray-400">We use these details to estimate your metabolism.</p>
          </div>

          <GlassCard className="space-y-5">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Gender
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGender("MALE")}
                  className={`py-3 px-4 rounded-xl text-sm font-semibold border transition-all ${
                    gender === "MALE"
                      ? "text-teal-400 border-teal-500/30 bg-teal-500/5"
                      : "text-gray-400 border-gray-800 bg-gray-900/35 hover:text-gray-300"
                  }`}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => setGender("FEMALE")}
                  className={`py-3 px-4 rounded-xl text-sm font-semibold border transition-all ${
                    gender === "FEMALE"
                      ? "text-teal-400 border-teal-500/30 bg-teal-500/5"
                      : "text-gray-400 border-gray-800 bg-gray-900/35 hover:text-gray-300"
                  }`}
                >
                  Female
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="birthdate-input" className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Birth Date
              </label>
              <input
                id="birthdate-input"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-teal-500/50 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500/20"
              />
            </div>
          </GlassCard>

          <button
            onClick={handleNext}
            className="w-full bg-gray-900 hover:bg-gray-850 text-white rounded-xl py-3 text-sm font-semibold border border-gray-800 hover:border-gray-700 flex items-center justify-center gap-2 transition-all duration-200"
          >
            <span>Next Step</span>
            <ArrowRight className="w-4 h-4 text-teal-400" />
          </button>
        </div>
      )}

      {/* Step 2: Height & Weight */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-white tracking-tight">Your proportions</h3>
            <p className="text-sm text-gray-400">Used to compute Body Mass Index and energy rates.</p>
          </div>

          <GlassCard className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5" /> Height
                </span>
                <span className="text-teal-400 font-bold normal-case text-sm">{height} cm</span>
              </div>
              <input
                type="range"
                min="100"
                max="250"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5" /> Weight
                </span>
                <span className="text-teal-400 font-bold normal-case text-sm">{weight} kg</span>
              </div>
              <input
                type="range"
                min="30"
                max="200"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
            </div>
          </GlassCard>

          <div className="flex gap-3">
            <button
              onClick={handleBack}
              className="flex-1 bg-gray-900 hover:bg-gray-850 text-gray-300 rounded-xl py-3 text-sm font-semibold border border-gray-800 flex items-center justify-center gap-2 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleNext}
              className="flex-1 bg-teal-500 hover:bg-teal-400 text-white rounded-xl py-3 text-sm font-semibold shadow-lg shadow-teal-950/20 flex items-center justify-center gap-2 transition-all duration-200"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Activity & Goal */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-white tracking-tight">Your energy targets</h3>
            <p className="text-sm text-gray-400">Activity and goal adjustments dictate your target calories.</p>
          </div>

          <GlassCard className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="activity-select" className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" /> Daily Activity Level
              </label>
              <select
                id="activity-select"
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value as any)}
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-teal-500/50 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500/20"
              >
                <option value="SEDENTARY">Sedentary (Little to no exercise)</option>
                <option value="LIGHTLY_ACTIVE">Lightly Active (Light exercise 1-3 days/week)</option>
                <option value="MODERATELY_ACTIVE">Moderately Active (Moderate exercise 3-5 days/week)</option>
                <option value="VERY_ACTIVE">Very Active (Heavy exercise 6-7 days/week)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="goal-select" className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-teal-400" /> Fitness Goal
              </label>
              <select
                id="goal-select"
                value={goal}
                onChange={(e) => setGoal(e.target.value as any)}
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-teal-500/50 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500/20"
              >
                <option value="LOSE_WEIGHT">Lose Weight (-400 kcal deficit)</option>
                <option value="MAINTAIN">Maintain Weight (TDEE balance)</option>
                <option value="GAIN_MUSCLE">Gain Muscle (+300 kcal surplus)</option>
              </select>
            </div>
          </GlassCard>

          <div className="flex gap-3">
            <button
              onClick={handleBack}
              disabled={loading}
              className="flex-1 bg-gray-900 hover:bg-gray-850 text-gray-300 rounded-xl py-3 text-sm font-semibold border border-gray-800 flex items-center justify-center gap-2 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white rounded-xl py-3 text-sm font-semibold shadow-lg shadow-teal-950/20 flex items-center justify-center gap-2 transition-all duration-200"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Calculate Targets</span>
                  <Check className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Results Presentation */}
      {step === 4 && results && (
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-1 text-center">
            <div className="inline-flex bg-teal-500/10 p-3 rounded-full border border-teal-500/30 mb-2">
              <Check className="w-6 h-6 text-teal-400" />
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">Your targets are ready!</h3>
            <p className="text-sm text-gray-400">Based on your metabolic profile computations.</p>
          </div>

          <GlassCard className="grid grid-cols-3 gap-2 divide-x divide-gray-800/50 text-center">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-gray-500 uppercase font-semibold">BMR</span>
              <span className="text-xl font-bold text-white">{results.bmr}</span>
              <span className="text-[9px] text-gray-400">kcal/day</span>
            </div>
            <div className="flex flex-col gap-0.5 pl-2">
              <span className="text-[10px] text-gray-500 uppercase font-semibold">TDEE</span>
              <span className="text-xl font-bold text-white">{results.tdee}</span>
              <span className="text-[9px] text-gray-400">kcal/day</span>
            </div>
            <div className="flex flex-col gap-0.5 pl-2">
              <span className="text-[10px] text-teal-400 uppercase font-semibold">Target</span>
              <span className="text-xl font-bold text-teal-400">{results.targetCal}</span>
              <span className="text-[9px] text-teal-500/80">kcal/day</span>
            </div>
          </GlassCard>

          <GlassCard className="text-xs text-gray-400 leading-relaxed space-y-2">
            <p>
              Your <strong>Basal Metabolic Rate (BMR)</strong> is the energy required to keep your body functioning at rest.
            </p>
            <p>
              Your <strong>Total Daily Energy Expenditure (TDEE)</strong> factors in your activity.
            </p>
            <p>
              To satisfy your goal, we established a daily target of{" "}
              <strong className="text-teal-400">{results.targetCal} kcal</strong>.
            </p>
          </GlassCard>

          <button
            onClick={onComplete}
            className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white rounded-xl py-3 text-sm font-semibold tracking-wide shadow-lg shadow-teal-950/20 flex items-center justify-center gap-2 transition-all duration-200"
          >
            <span>Start Tracking Food</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default OnboardingPage;
