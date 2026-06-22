import { useState } from "react";
import App from "./App";
import { StandaloneProgressTracker } from "./components/StandaloneProgressTracker";

type View = "plan" | "track";

const copy = {
  en: { plan: "Plan", track: "Track" },
  zh: { plan: "计划", track: "跟踪" }
} as const;

export default function Root() {
  const [view, setView] = useState<View>("plan");
  const language = getLanguage();
  const t = copy[language];

  return (
    <>
      <nav className="app-shell top-nav-shell" aria-label="Primary navigation">
        <div className="top-nav segmented two">
          <button
            className={view === "plan" ? "active" : ""}
            onClick={() => setView("plan")}
            type="button"
          >
            {t.plan}
          </button>
          <button
            className={view === "track" ? "active" : ""}
            onClick={() => setView("track")}
            type="button"
          >
            {t.track}
          </button>
        </div>
      </nav>
      {view === "plan" ? <App /> : <StandaloneProgressTracker />}
    </>
  );
}

function getLanguage(): "en" | "zh" {
  if (typeof window === "undefined") return "en";
  return window.localStorage.getItem("last_chance_language") === "zh" ? "zh" : "en";
}
