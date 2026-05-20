import React from "react";
import { LayoutDashboard, PlusCircle, ChefHat, User, LogOut, Flame } from "lucide-react";
import { authClient } from "../lib/auth";
import { t } from "../lib/i18n";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  userName = "User",
}) => {
  const handleSignOut = async () => {
    const confirmMsg = t("nav.sign_out_confirm", "Are you sure you want to log out?");
    if (confirm(confirmMsg)) {
      await authClient.signOut();
      window.location.reload();
    }
  };

  const navItems = [
    { id: "dashboard", label: t("nav.dashboard", "Dashboard"), icon: LayoutDashboard },
    { id: "log", label: t("nav.log", "Log Food"), icon: PlusCircle },
    { id: "recipes", label: t("nav.recipes", "Recipes"), icon: ChefHat },
    { id: "profile", label: t("nav.profile", "Profile"), icon: User },
  ];


  return (
    <>
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-teal-500/10 p-1.5 rounded-xl border border-teal-500/20">
            <Flame className="w-6 h-6 text-teal-400 fill-teal-400/20" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white m-0 leading-none">NutriTwins</h1>
            <span className="text-[10px] text-gray-400">
              {t("nav.welcome_title", "AI Nutrition Companion")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden xs:block">
            <p className="text-xs text-gray-400">{t("nav.welcome", "Welcome,")}</p>
            <p className="text-xs font-semibold text-white">{userName}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 border border-transparent hover:border-red-500/20"
            title={t("nav.logout_title", "Log Out")}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Bottom Tab Bar (Mobile First) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-gray-950/90 backdrop-blur-xl border-t border-gray-900 px-2 safe-pb">
        <div className="max-w-md mx-auto flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all duration-300 relative ${
                  isActive
                    ? "text-teal-400 font-medium scale-105"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {/* Active indicator background */}
                {isActive && (
                  <span className="absolute inset-0 bg-teal-500/5 rounded-2xl border border-teal-500/10 -z-10 animate-fade-in" />
                )}
                
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5px] drop-shadow-[0_0_8px_rgba(20,184,166,0.5)]" : "stroke-[2px]"}`} />
                <span className="text-[10px] tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
