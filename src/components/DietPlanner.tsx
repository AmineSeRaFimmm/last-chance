import { useLayoutEffect, useRef, useState, type PointerEvent, type UIEvent } from "react";
import { buildDietWeek } from "../core/dietPlan";
import type { DietDay, DietMeal } from "../core/dietPlan";
import { getMealFoodOptions, getMealFoodRole, optimizeMealFromFoodNames, sumDietMeals } from "../core/mealOptimizer";
import { loadInput } from "../storage/localPlan";
import { findMealOverride, loadDietOverrides, saveMealOverride } from "../storage/dietOverrides";
import type { DietMealOverride } from "../storage/dietOverrides";
import { MealComposerOverlay } from "./MealComposerOverlay";

type Language = "en" | "zh";

interface ComposerState {
  dayLabel: string;
  meal: DietMeal;
  baseMeal: DietMeal;
}

const copy = {
  en: {
    title: "Diet",
    subtitle: "A one-week template generated from your saved plan.",
    emptyTitle: "No saved plan yet",
    emptyText: "Go to Plan, complete your data, then tap Save plan locally.",
    target: "Target",
    estimate: "Estimated",
    note: "Food values are practical estimates per 100g. Adjust seasoning, sauces, cooking oil, and brands manually.",
    kcal: "kcal",
    protein: "P",
    carbs: "C",
    fat: "F"
  },
  zh: {
    title: "饮食模板",
    subtitle: "根据你保存的计划自动生成一周饮食模板。",
    emptyTitle: "还没有保存计划",
    emptyText: "先进入 Plan，填完数据后点击保存到本机。",
    target: "目标",
    estimate: "估算",
    note: "食物数据为每 100g 实用估算值。调料、酱料、烹调用油和品牌差异需要自行修正。",
    kcal: "kcal",
    protein: "蛋白",
    carbs: "碳水",
    fat: "脂肪"
  }
} as const;

export function DietPlanner() {
  const language = loadLanguage();
  const t = copy[language];
  const savedInput = loadInput();
  const [overrides, setOverrides] = useState<DietMealOverride[]>(loadDietOverrides);
  const [composer, setComposer] = useState<ComposerState | null>(null);
  const weekTrackRef = useRef<HTMLDivElement | null>(null);
  const isLoopingRef = useRef(false);
  const baseWeek = savedInput ? buildDietWeek(savedInput) : [];
  const week = savedInput ? applyOverridesToWeek(baseWeek, overrides) : [];
  const loopingWeek = buildLoopingWeek(week);
  const loopingBaseWeek = buildLoopingWeek(baseWeek);

  useLayoutEffect(() => {
    if (week.length <= 1) return;
    window.requestAnimationFrame(() => scrollToLoopCard(1));
  }, [week.length]);

  if (!savedInput) {
    return (
      <main className="app-shell diet-shell">
        <section className="hero diet-hero">
          <p className="eyebrow">{t.title}</p>
          <h1 className="hero-title">Diet</h1>
          <p className="hero-subtitle">{t.subtitle}</p>
        </section>
        <section className="card">
          <div className="card-title">{t.emptyTitle}</div>
          <p className="small-note no-margin">{t.emptyText}</p>
        </section>
      </main>
    );
  }

  function scrollToLoopCard(index: number) {
    const track = weekTrackRef.current;
    const card = track?.children.item(index) as HTMLElement | null;
    if (!track || !card) return;

    isLoopingRef.current = true;
    const left = card.offsetLeft - (track.clientWidth - card.clientWidth) / 2;
    track.scrollTo({ left, behavior: "auto" });
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        isLoopingRef.current = false;
      });
    });
  }

  function handleWeekScroll(event: UIEvent<HTMLDivElement>) {
    if (isLoopingRef.current || week.length <= 1) return;

    const track = event.currentTarget;
    const children = Array.from(track.children) as HTMLElement[];
    if (children.length < 3) return;

    const trackCenter = track.scrollLeft + track.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    children.forEach((child, index) => {
      const childCenter = child.offsetLeft + child.clientWidth / 2;
      const distance = Math.abs(childCenter - trackCenter);
      if (distance < closestDistance) {
        closestIndex = index;
        closestDistance = distance;
      }
    });

    if (closestIndex === 0) {
      scrollToLoopCard(week.length);
    } else if (closestIndex === children.length - 1) {
      scrollToLoopCard(1);
    }
  }

  function openComposer(day: DietDay, baseMeal: DietMeal, meal: DietMeal) {
    setComposer({
      dayLabel: day.day,
      meal,
      baseMeal
    });
  }

  function handleApply(foodNames: string[]) {
    if (!composer) return;
    const next = saveMealOverride({ day: composer.dayLabel, mealName: composer.baseMeal.name, foodNames });
    setOverrides(next);
    setComposer(null);
  }

  return (
    <main className="app-shell diet-shell">
      <section className="hero diet-hero">
        <p className="eyebrow">{t.title}</p>
        <h1 className="hero-title">Diet</h1>
        <p className="hero-subtitle">{t.subtitle}</p>
      </section>

      <section className="card diet-note-card">
        <p className="small-note no-margin">{t.note}</p>
      </section>

      <div className="diet-week-stack" onScroll={handleWeekScroll} ref={weekTrackRef}>
        {loopingWeek.map((day, loopIndex) => {
          const baseDay = loopingBaseWeek[loopIndex];
          const loopKey = getLoopCardKey(loopIndex, week.length, day.day);

          return (
            <DietDayCard
              baseDay={baseDay}
              day={day}
              labels={t}
              key={loopKey}
              onMealOpen={(baseMeal, meal) => openComposer(day, baseMeal, meal)}
            />
          );
        })}
      </div>

      {composer && (
        <MealComposerOverlay
          baseMeal={composer.baseMeal}
          dayLabel={composer.dayLabel}
          language={language}
          meal={composer.meal}
          onApply={handleApply}
          onClose={() => setComposer(null)}
        />
      )}
    </main>
  );
}

function DietDayCard({
  day,
  baseDay,
  labels,
  onMealOpen
}: {
  day: DietDay;
  baseDay: DietDay;
  labels: typeof copy.en | typeof copy.zh;
  onMealOpen: (baseMeal: DietMeal, meal: DietMeal) => void;
}) {
  return (
    <section className="card diet-day-card">
      <div className="diet-day-head">
        <div>
          <div className="card-title no-margin">{day.day}</div>
          <strong>{day.type}</strong>
        </div>
        <div className="diet-day-target">
          <span>{labels.target}</span>
          <strong>{day.target.calories} {labels.kcal}</strong>
        </div>
      </div>

      <div className="diet-meal-stack">
        {day.meals.map((meal, mealIndex) => (
          <DietMealTile
            baseMeal={baseDay.meals[mealIndex]}
            labels={labels}
            meal={meal}
            key={meal.name}
            onOpen={() => onMealOpen(baseDay.meals[mealIndex], meal)}
          />
        ))}
      </div>

      <div className="diet-total-line">
        <span>{labels.estimate}</span>
        <strong>{day.totals.calories} {labels.kcal}</strong>
        <span>{labels.protein} {day.totals.proteinG}g</span>
        <span>{labels.carbs} {day.totals.carbsG}g</span>
        <span>{labels.fat} {day.totals.fatG}g</span>
      </div>
    </section>
  );
}

function DietMealTile({
  meal,
  labels,
  onOpen
}: {
  baseMeal: DietMeal;
  meal: DietMeal;
  labels: typeof copy.en | typeof copy.zh;
  onOpen: () => void;
}) {
  const timerRef = useRef<number | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);

  function clearPress() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    startPointRef.current = { x: event.clientX, y: event.clientY };
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      onOpen();
    }, 520);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!startPointRef.current) return;
    const deltaX = Math.abs(event.clientX - startPointRef.current.x);
    const deltaY = Math.abs(event.clientY - startPointRef.current.y);
    if (deltaX > 10 || deltaY > 10) clearPress();
  }

  return (
    <div
      className="diet-meal diet-meal-interactive"
      onContextMenu={(event) => event.preventDefault()}
      onDoubleClick={onOpen}
      onPointerCancel={clearPress}
      onPointerDown={handlePointerDown}
      onPointerLeave={clearPress}
      onPointerMove={handlePointerMove}
      onPointerUp={clearPress}
    >
      <div className="diet-meal-head">
        <strong>{meal.name}</strong>
        <span>{meal.calories} {labels.kcal}</span>
      </div>
      <div className="diet-food-list">
        {meal.items.map((item) => (
          <span className={getFoodRoleClass(item.name)} key={`${meal.name}-${item.name}`}>{item.name} {item.grams}g</span>
        ))}
      </div>
      <div className="diet-macro-line">
        <span>{labels.protein} {meal.proteinG}g</span>
        <span>{labels.carbs} {meal.carbsG}g</span>
        <span>{labels.fat} {meal.fatG}g</span>
      </div>
    </div>
  );
}

function getFoodRoleClass(foodName: string): string {
  const food = getMealFoodOptions().find((item) => item.name === foodName);
  return food ? getMealFoodRole(food) : "";
}

function applyOverridesToWeek(baseWeek: DietDay[], overrides: DietMealOverride[]): DietDay[] {
  return baseWeek.map((day) => {
    const meals = day.meals.map((meal) => {
      const override = findMealOverride(overrides, day.day, meal.name);
      return override ? optimizeMealFromFoodNames(meal.name, meal, override.foodNames).meal : meal;
    });

    return { ...day, meals, totals: sumDietMeals(meals) };
  });
}

function buildLoopingWeek<T>(week: T[]): T[] {
  if (week.length <= 1) return week;
  return [week[week.length - 1], ...week, week[0]];
}

function getLoopCardKey(loopIndex: number, weekLength: number, day: string): string {
  if (weekLength <= 1) return day;
  if (loopIndex === 0) return `loop-start-${day}`;
  if (loopIndex === weekLength + 1) return `loop-end-${day}`;
  return `loop-real-${day}`;
}

function loadLanguage(): Language {
  if (typeof window === "undefined") return "en";
  return window.localStorage.getItem("last_chance_language") === "zh" ? "zh" : "en";
}