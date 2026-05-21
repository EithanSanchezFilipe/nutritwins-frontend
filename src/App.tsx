import { useState, useEffect } from "react";
import { authClient } from "./lib/auth";
import { api } from "./lib/api";
import type { UserProfile } from "./lib/api";
import Navbar from "./components/Navbar";
import AuthPage from "./pages/AuthPage";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import LogFoodPage from "./pages/LogFoodPage";
import RecipesPage from "./pages/RecipesPage";
import ProfilePage from "./pages/ProfilePage";

export function App() {
  // Check localStorage for token first (production/token-based auth)
  const [session, setSession] = useState<any>(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      console.log("[App] Token found in localStorage");
      return { user: { id: "token-based-user" } };
    }
    return null;
  });
  const [sessionPending, setSessionPending] = useState(!session ? true : false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profilePending, setProfilePending] = useState(false);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [showOnboarding, setShowOnboarding] = useState(false);

  const fetchProfileData = async () => {
    setProfilePending(true);
    try {
      const data = await api.getProfile();
      setProfile(data);
      // If target calories are not set, force user into Onboarding
      if (!data.targetCal || data.targetCal <= 0) {
        setShowOnboarding(true);
      } else {
        setShowOnboarding(false);
      }
    } catch (err) {
      console.error("Profile Fetch Error in App:", err);
      // If profile is not found or fails because calories not set, default onboarding
      setShowOnboarding(true);
    } finally {
      setProfilePending(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchProfileData();
    } else {
      setProfile(null);
      setShowOnboarding(false);
    }
  }, [session]);

  const handleAuthSuccess = () => {
    // No forced reload — rely on auth client/session updates.
  };

  const handleOnboardingComplete = async () => {
    // Re-fetch profile to fetch calculated targetCal
    await fetchProfileData();
    setActiveTab("dashboard");
  };

  const handleLogFoodSuccess = () => {
    // Reset active view to dashboard when meal is logged
    setActiveTab("dashboard");
  };

  // Render loading state
  if (sessionPending || (session && profilePending && !profile)) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-center p-4">
        <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin mb-4" />
        <h3 className="text-sm font-bold text-white">
          Initializing NutriTwins
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Establishing secure connection and retrieving profile...
        </p>
      </div>
    );
  }

  // Render Auth page if not logged in
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col justify-between">
        <div className="flex-1 flex items-center justify-center">
          <AuthPage onSuccess={handleAuthSuccess} />
        </div>
      </div>
    );
  }

  // Render Onboarding flow if target calories not set
  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col">
        <header className="sticky top-0 z-40 w-full glass-panel border-b border-gray-800 px-4 py-3 flex items-center justify-between max-w-md mx-auto">
          <h1 className="text-lg font-bold tracking-tight text-white leading-none">
            NutriTwins
          </h1>
          <button
            onClick={async () => {
              await authClient.signOut();
              window.location.reload();
            }}
            className="text-xs bg-gray-900 border border-gray-850 hover:bg-gray-850 text-gray-300 font-semibold px-3 py-1.5 rounded-xl transition-all"
          >
            Sign Out
          </button>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <OnboardingPage onComplete={handleOnboardingComplete} />
        </div>
      </div>
    );
  }

  // Active Tab content router
  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardPage
            onAddLogRedirect={() => setActiveTab("log")}
            onOnboardingRedirect={() => setShowOnboarding(true)}
          />
        );
      case "log":
        return <LogFoodPage onSuccess={handleLogFoodSuccess} />;
      case "recipes":
        return <RecipesPage onLogSuccess={handleLogFoodSuccess} />;
      case "profile":
        return <ProfilePage />;
      default:
        return (
          <div className="flex-1 flex items-center justify-center p-4 text-center">
            <p className="text-xs text-gray-400">View not found.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-gray-100 pb-20">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userName={profile?.name || session.user.name || "User"}
      />
      <main className="flex-1 flex flex-col w-full">{renderTabContent()}</main>
    </div>
  );
}

export default App;
