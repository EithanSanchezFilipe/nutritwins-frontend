import React, { useEffect, useState } from "react";
import {
  Plus,
  Coffee,
  Utensils,
  Moon,
  HelpCircle,
  ChevronRight,
  Activity,
  Calendar,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { api } from "../lib/api";
import type { DailyLog, FoodEntry, MealType } from "../lib/api";
import GlassCard from "../components/GlassCard";
import MacroRing from "../components/MacroRing";
import { t, getLang } from "../lib/i18n";

interface DashboardPageProps {
  onAddLogRedirect: () => void;
  onOnboardingRedirect: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onAddLogRedirect,
  onOnboardingRedirect,
}) => {
  const [loading, setLoading] = useState(true);
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [historyLogs, setHistoryLogs] = useState<DailyLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch today's log
        const log = await api.getTodayLog();
        setTodayLog(log);

        // Fetch all logs for the history chart
        const history = await api.getAllLogs();
        setHistoryLogs(history);
      } catch (err: any) {
        console.error("Dashboard Fetch Error:", err);
        if (
          err.status === 400 &&
          err.message === "User target calories not set"
        ) {
          onOnboardingRedirect();
        } else {
          setError(
            err.message ||
              t(
                "dash.dashboard_fetch_failed",
                "Failed to load dashboard data.",
              ),
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [onOnboardingRedirect]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">
            {t("dash.loading_journal", "Loading daily journal...")}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center px-4 text-center">
        <GlassCard className="max-w-xs border-red-500/20">
          <h3 className="text-red-400 font-bold mb-2">
            {t("dash.error_loading_dashboard", "Error Loading Dashboard")}
          </h3>
          <p className="text-xs text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs bg-red-500/10 text-red-300 hover:bg-red-500/20 px-3 py-1.5 rounded-lg border border-red-500/20"
          >
            {t("dash.retry", "Retry")}
          </button>
        </GlassCard>
      </div>
    );
  }

  const targetCal = todayLog?.targetCalories ?? 2000;
  const consumedCal = todayLog?.consumedCalories ?? 0;

  // Calculate sum of macros logged today
  let protein = 0;
  let carbs = 0;
  let fat = 0;

  if (todayLog?.entries) {
    todayLog.entries.forEach((e) => {
      protein += e.protein ?? 0;
      carbs += e.carbs ?? 0;
      fat += e.fat ?? 0;
    });
  }

  // Calculate dynamic target macros based on typical 30-40-30 distribution
  const targetProtein = Math.round((targetCal * 0.23 ) / 4);
  const targetCarbs = Math.round((targetCal * 0.4) / 4);
  const targetFat = Math.round((targetCal * 0.3) / 9);

  // Group entries by Meal Type
  const entriesByMeal: Record<MealType, FoodEntry[]> = {
    BREAKFAST: [],
    LUNCH: [],
    DINNER: [],
    SNACK: [],
  };

  if (todayLog?.entries) {
    todayLog.entries.forEach((entry) => {
      if (entriesByMeal[entry.mealType]) {
        entriesByMeal[entry.mealType].push(entry);
      }
    });
  }

  // Format history data for the Recharts Bar Chart (Last 7 entries)
  const lang = getLang();
  const locale = lang === "fr" ? "fr-FR" : lang === "es" ? "es-ES" : "en-US";

  const chartData = historyLogs.slice(-7).map((log) => {
    const dateObj = new Date(log.date);
    const dayLabel = dateObj.toLocaleDateString(locale, { weekday: "short" });
    return {
      name: dayLabel,
      Consumed: log.consumedCalories,
      Target: log.targetCalories,
    };
  });

  // Dynamic greetings
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 5) return t("dash.greeting_night", "Good night");
    if (hours < 12) return t("dash.greeting_morning", "Good morning");
    if (hours < 17) return t("dash.greeting_afternoon", "Good afternoon");
    return t("dash.greeting_evening", "Good evening");
  };

  const getMealIcon = (meal: MealType) => {
    switch (meal) {
      case "BREAKFAST":
        return <Coffee className="w-4 h-4 text-amber-400" />;
      case "LUNCH":
        return <Utensils className="w-4 h-4 text-emerald-400" />;
      case "DINNER":
        return <Moon className="w-4 h-4 text-indigo-400" />;
      default:
        return <HelpCircle className="w-4 h-4 text-pink-400" />;
    }
  };

  const getMealLabel = (meal: MealType) => {
    switch (meal) {
      case "BREAKFAST":
        return t("dash.breakfast", "Breakfast");
      case "LUNCH":
        return t("dash.lunch", "Lunch");
      case "DINNER":
        return t("dash.dinner", "Dinner");
      case "SNACK":
        return t("dash.snack", "Snack");
      default:
        return String(meal).toLowerCase();
    }
  };

  return (
    <div className="flex-1 flex flex-col px-4 py-6 space-y-6 overflow-y-auto pb-24 max-w-md mx-auto w-full">
      {/* Dynamic greeting header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {getGreeting()}!
          </h2>
          <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
            <Activity className="w-3.5 h-3.5 text-teal-400" />
            {t("dash.status", "Here is your metabolic status for today.")}
          </p>
        </div>
      </div>

      {/* Main Calorie Ring */}
      <GlassCard className="flex flex-col items-center py-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3">
          <span className="text-[9px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded-full font-semibold">
            {t("dash.today", "Today")}
          </span>
        </div>
        <MacroRing consumed={consumedCal} target={targetCal} />

        {/* Macro Progress Details */}
        <div className="w-full grid grid-cols-3 md:grid-cols-3 gap-3 mt-6 pt-5 border-t border-gray-800/60">
          <div className="flex flex-col">
            <div className="flex flex-col text-[10px] text-gray-500 font-semibold mb-1">
              <span>{t("dash.protein", "Protein").toUpperCase()}</span>
              <span className="text-gray-300 font-bold mt-0.5">
                {Math.round(protein)}/{targetProtein}g
              </span>
            </div>
            <div className="w-full bg-gray-900 rounded-full h-1">
              <div
                className="bg-amber-400 h-1 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (protein / (targetProtein || 1)) * 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex flex-col text-[10px] text-gray-500 font-semibold mb-1">
              <span>{t("dash.carbs", "Carbs").toUpperCase()}</span>
              <span className="text-gray-300 font-bold mt-0.5">
                {Math.round(carbs)}/{targetCarbs}g
              </span>
            </div>
            <div className="w-full bg-gray-900 rounded-full h-1">
              <div
                className="bg-emerald-400 h-1 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (carbs / (targetCarbs || 1)) * 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex flex-col text-[10px] text-gray-500 font-semibold mb-1">
              <span>{t("dash.fat", "Fat").toUpperCase()}</span>
              <span className="text-gray-300 font-bold mt-0.5">
                {Math.round(fat)}/{targetFat}g
              </span>
            </div>
            <div className="w-full bg-gray-900 rounded-full h-1">
              <div
                className="bg-indigo-400 h-1 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (fat / (targetFat || 1)) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Quick Add Log Food Card */}
      <button
        onClick={onAddLogRedirect}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-teal-500/10 to-teal-600/5 hover:from-teal-500/15 hover:to-teal-650/10 border border-teal-500/20 hover:border-teal-500/35 rounded-2xl transition-all duration-300 group shadow-md shadow-teal-950/5 active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="bg-teal-500 p-2 rounded-xl text-white shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform duration-300">
            <Plus className="w-5 h-5 stroke-[2.5px]" />
          </div>
          <div className="text-left">
            <h4 className="text-sm font-bold text-white leading-tight">
              {t("dash.log_meal_card_title", "Log what you ate")}
            </h4>
            <p className="text-[10px] text-teal-400/80">
              {t(
                "dash.log_meal_card_sub",
                "Analyze food with AI photos or descriptions",
              )}
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-teal-500 group-hover:translate-x-0.5 transition-transform duration-300" />
      </button>

      {/* Log Feed */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
          <Calendar className="w-3.5 h-3.5" />
          {t("dash.meal_timeline", "Today's Meal Timeline")}
        </h3>

        <div className="space-y-2">
          {(Object.keys(entriesByMeal) as MealType[]).map((meal) => {
            const meals = entriesByMeal[meal];
            const hasMeals = meals.length > 0;
            const mealCalories = meals.reduce(
              (sum, item) => sum + item.calories,
              0,
            );

            return (
              <GlassCard key={meal} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-gray-900/60 p-1.5 rounded-lg border border-gray-800">
                      {getMealIcon(meal)}
                    </div>
                    <span className="text-xs font-bold text-white tracking-wide uppercase">
                      {getMealLabel(meal).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-gray-400">
                    {hasMeals
                      ? `${mealCalories} kcal`
                      : t("dash.zero_kcal", "0 kcal")}
                  </span>
                </div>

                {hasMeals ? (
                  <div className="mt-2.5 space-y-2 border-t border-gray-800/40 pt-2">
                    {meals.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center text-xs pl-1"
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-200">
                            {item.description}
                          </span>
                          <span className="text-[9px] text-gray-500">
                            {item.protein
                              ? `${Math.round(item.protein)}g P`
                              : ""}
                            {item.carbs
                              ? ` • ${Math.round(item.carbs)}g C`
                              : ""}
                            {item.fat ? ` • ${Math.round(item.fat)}g F` : ""}
                          </span>
                        </div>
                        <span className="font-medium text-teal-400">
                          {item.calories} kcal
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-500 mt-1 pl-1">
                    {t("dash.empty_entries", "No food entries logged.")}
                  </p>
                )}
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* History Bar Chart */}
      {chartData.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
            <Activity className="w-3.5 h-3.5 text-teal-400" />
            {t("dash.history_title", "Intake History (7 days)")}
          </h3>
          <GlassCard className="h-44 py-2 px-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
              >
                <XAxis
                  dataKey="name"
                  stroke="#9ca3af"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0, 0, 0, 0.03)", radius: 4 }}
                  formatter={(value, name) => {
                    const label =
                      name === "Consumed"
                        ? t("dash.consumed", "Consumed")
                        : name === "Target"
                          ? t("dash.target", "Target")
                          : String(name);
                    return [value, label];
                  }}
                  contentStyle={{
                    background: "#ffffff",
                    borderColor: "#e5e7eb",
                    borderRadius: "8px",
                    color: "#111827",
                    fontSize: "11px",
                  }}
                />
                <Bar
                  dataKey="Consumed"
                  fill="#111827"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
