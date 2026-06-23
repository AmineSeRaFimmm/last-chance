import { useState } from "react";
import App from "./App";
import { DietPlanner } from "./components/DietPlanner";
import { ProfilePage } from "./components/ProfilePage";
import { WorkoutPlanner } from "./components/WorkoutPlanner";

type View = "plan" | "diet" | "workout" | "profile";

const copy = {
  en: { plan: "Plan", diet: "Diet", workout: "Workout", profile: "Profile" },
  zh: { plan: "计划", diet: "饮食", workout: "训练", profile: "主页" }
} as const;

export default function Root() {
  const [view, setView] = useState<View>("plan");
  const language = getLanguage();
  const t = copy[language];

  return (
    <>
      {view === "plan" && <App />}
      {view === "diet" && <DietPlanner />}
      {view === "workout" && <WorkoutPlanner />}
      {view === "profile" && <ProfilePage />}

      <nav className="bottom-nav-shell" aria-label="Primary navigation">
        <div className="bottom-nav">
          <button className={view === "plan" ? "active" : ""} onClick={() => setView("plan")} type="button">
            <span>◐</span>{t.plan}
          </button>
          <button className={view === "diet" ? "active" : ""} onClick={() => setView("diet")} type="button">
            <span>◒</span>{t.diet}
          </button>
          <button className={view === "workout" ? "active" : ""} onClick={() => setView("workout")} type="button">
            <span>◇</span>{t.workout}
          </button>
          <button className={view === "profile" ? "active" : ""} onClick={() => setView("profile")} type="button">
            <span>●</span>{t.profile}
          </button>
        </div>
      </nav>
    </>
  );
}

function getLanguage(): "en" | "zh" {
  if (typeof window === "undefined") return "en";
  return window.localStorage.getItem("last_chance_language") === "zh" ? "zh" : "en";
}
