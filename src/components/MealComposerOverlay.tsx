import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { DietMeal, FoodCategory, FoodWithCategory } from "../core/dietPlan";
import {
  getMealFoodOptions,
  getMealFoodRole,
  optimizeMealFromFoodNames,
  replaceFoodByRole
} from "../core/mealOptimizer";

type Language = "en" | "zh";
type DragSource = "available" | "selected";
type FoodRole = ReturnType<typeof getMealFoodRole>;

interface ActiveDrag {
  source: DragSource;
  foodName: string;
  label: string;
  role: FoodRole;
  startX: number;
  startY: number;
  x: number;
  y: number;
  moved: boolean;
}

interface MealComposerOverlayProps {
  language: Language;
  dayLabel: string;
  meal: DietMeal;
  baseMeal: DietMeal;
  onApply: (foodNames: string[]) => void;
  onClose: () => void;
}

const copy = {
  en: {
    selected: "Meal ingredients",
    outside: "Ingredient field",
    apply: "Apply",
    cancel: "Cancel",
    protein: "Protein",
    carbs: "Carbs",
    fats: "Fats",
    plants: "Plants"
  },
  zh: {
    selected: "Meal ingredients",
    outside: "食材选择区",
    apply: "Apply",
    cancel: "Cancel",
    protein: "Protein",
    carbs: "Carbs",
    fats: "Fats",
    plants: "Plants"
  }
} as const;

const orbit = [
  { left: "2%", top: "5%", rotate: "-5deg" },
  { left: "68%", top: "5%", rotate: "3deg" },
  { left: "7%", top: "18%", rotate: "4deg" },
  { left: "76%", top: "20%", rotate: "-6deg" },
  { left: "3%", top: "37%", rotate: "-3deg" },
  { left: "80%", top: "39%", rotate: "5deg" },
  { left: "4%", top: "60%", rotate: "2deg" },
  { left: "74%", top: "62%", rotate: "-4deg" },
  { left: "10%", top: "80%", rotate: "3deg" },
  { left: "62%", top: "81%", rotate: "-2deg" },
  { left: "31%", top: "7%", rotate: "5deg" },
  { left: "35%", top: "86%", rotate: "-6deg" }
];

export function MealComposerOverlay({
  language,
  dayLabel,
  meal,
  baseMeal,
  onApply,
  onClose
}: MealComposerOverlayProps) {
  const t = copy[language];
  const selectedZoneRef = useRef<HTMLDivElement | null>(null);
  const activeDragRef = useRef<ActiveDrag | null>(null);
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
  const [selectedFoodNames, setSelectedFoodNames] = useState(() => meal.items.map((item) => item.name));
  const preview = useMemo(
    () => optimizeMealFromFoodNames(meal.name, baseMeal, selectedFoodNames),
    [baseMeal, meal.name, selectedFoodNames]
  );
  const options = useMemo(
    () => prioritizeFoods(getMealFoodOptions().filter((food) => !selectedFoodNames.includes(food.name)), meal),
    [meal, selectedFoodNames]
  );
  const selectedFoods = selectedFoodNames
    .map((name) => getMealFoodOptions().find((food) => food.name === name))
    .filter((food): food is FoodWithCategory => Boolean(food));
  const applyDisabled = preview.status === "empty" || preview.status === "needs-protein";

  useEffect(() => {
    activeDragRef.current = activeDrag;
  }, [activeDrag]);

  useEffect(() => {
    const bodyOverflow = document.body.style.overflow;
    const bodyTouchAction = document.body.style.touchAction;
    const rootOverscroll = document.documentElement.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    document.documentElement.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = bodyOverflow;
      document.body.style.touchAction = bodyTouchAction;
      document.documentElement.style.overscrollBehavior = rootOverscroll;
    };
  }, []);

  useEffect(() => {
    if (!activeDrag) return;

    function handlePointerMove(event: PointerEvent) {
      event.preventDefault();
      setActiveDrag((current) => {
        if (!current) return null;
        const moved = current.moved || Math.hypot(event.clientX - current.startX, event.clientY - current.startY) > 5;
        return { ...current, x: event.clientX, y: event.clientY, moved };
      });
    }

    function handlePointerUp(event: PointerEvent) {
      event.preventDefault();
      const current = activeDragRef.current;
      if (!current) return;

      const insideSelectedZone = isInsideElement(event.clientX, event.clientY, selectedZoneRef.current);

      if (!current.moved) {
        if (current.source === "available") addFood(current.foodName);
        if (current.source === "selected") removeFood(current.foodName);
      } else {
        if (current.source === "available" && insideSelectedZone) addFood(current.foodName);
        if (current.source === "selected" && !insideSelectedZone) removeFood(current.foodName);
      }

      setActiveDrag(null);
    }

    function handlePointerCancel() {
      setActiveDrag(null);
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp, { passive: false });
    window.addEventListener("pointercancel", handlePointerCancel);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [Boolean(activeDrag)]);

  function addFood(foodName: string) {
    setSelectedFoodNames((current) => replaceFoodByRole(current, foodName));
  }

  function removeFood(foodName: string) {
    setSelectedFoodNames((current) => current.filter((name) => name !== foodName));
  }

  function startDrag(event: ReactPointerEvent<HTMLElement>, source: DragSource, food: FoodWithCategory) {
    event.preventDefault();
    event.stopPropagation();
    setActiveDrag({
      source,
      foodName: food.name,
      label: categoryLabel(food.category, t),
      role: getMealFoodRole(food),
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      moved: false
    });
  }

  return (
    <div className="meal-composer-overlay" role="dialog" aria-modal="true" aria-label={`${dayLabel} ${meal.name} composer`}>
      <button className="meal-composer-backdrop" type="button" aria-label={t.cancel} onClick={onClose} />

      <div className="ingredient-orbit" aria-label={t.outside}>
        {options.slice(0, orbit.length).map((food, index) => (
          <button
            className={`ingredient-chip ${getMealFoodRole(food)}`}
            key={food.name}
            onPointerDown={(event) => startDrag(event, "available", food)}
            style={{ left: orbit[index].left, top: orbit[index].top, transform: `rotate(${orbit[index].rotate})` }}
            type="button"
          >
            <span>{categoryLabel(food.category, t)}</span>
            <strong>{food.name}</strong>
          </button>
        ))}
      </div>

      <section className="meal-composer-card">
        <div className="meal-selected-zone" ref={selectedZoneRef}>
          <div className="meal-selected-head">
            <span>{t.selected}</span>
          </div>
          <div className="meal-selected-list">
            {selectedFoods.map((food) => (
              <button
                className={`selected-food-pill ${getMealFoodRole(food)}`}
                key={food.name}
                onPointerDown={(event) => startDrag(event, "selected", food)}
                type="button"
              >
                <span>{food.name}</span>
                <strong>{preview.meal.items.find((item) => item.name === food.name)?.grams ?? 0}g</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="meal-composer-actions">
          <button className="secondary-button" type="button" onClick={onClose}>{t.cancel}</button>
          <button className="primary-button no-top-margin" disabled={applyDisabled} type="button" onClick={() => onApply(selectedFoodNames)}>{t.apply}</button>
        </div>
      </section>

      {activeDrag && activeDrag.moved && (
        <div className={`meal-floating-chip ${activeDrag.role}`} style={{ transform: `translate3d(${activeDrag.x}px, ${activeDrag.y}px, 0)` }}>
          <span>{activeDrag.label}</span>
          <strong>{activeDrag.foodName}</strong>
        </div>
      )}
    </div>
  );
}

function prioritizeFoods(foods: FoodWithCategory[], meal: DietMeal): FoodWithCategory[] {
  const currentRoles = new Set(meal.items.map((item) => getMealFoodOptions().find((food) => food.name === item.name)).filter(Boolean).map((food) => getMealFoodRole(food as FoodWithCategory)));
  return [...foods].sort((first, second) => {
    const firstPreferred = currentRoles.has(getMealFoodRole(first)) ? 0 : 1;
    const secondPreferred = currentRoles.has(getMealFoodRole(second)) ? 0 : 1;
    return firstPreferred - secondPreferred || first.name.localeCompare(second.name);
  });
}

function categoryLabel(category: FoodCategory, labels: typeof copy.en | typeof copy.zh): string {
  if (category === "proteins" || category === "dairy") return labels.protein;
  if (category === "carbs" || category === "fruits") return labels.carbs;
  if (category === "fats") return labels.fats;
  return labels.plants;
}

function isInsideElement(x: number, y: number, element: HTMLElement | null): boolean {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}
