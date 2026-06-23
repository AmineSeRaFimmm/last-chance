import { useMemo, useState, type DragEvent } from "react";
import type { DietMeal, FoodCategory, FoodWithCategory } from "../core/dietPlan";
import {
  getMealFoodOptions,
  getMealFoodRole,
  optimizeMealFromFoodNames,
  replaceFoodByRole,
  type OptimizedMealResult
} from "../core/mealOptimizer";

type Language = "en" | "zh";
type DragSource = "available" | "selected";

interface DragPayload {
  source: DragSource;
  foodName: string;
}

interface MealComposerOverlayProps {
  language: Language;
  dayLabel: string;
  meal: DietMeal;
  baseMeal: DietMeal;
  hasOverride: boolean;
  onApply: (foodNames: string[]) => void;
  onReset: () => void;
  onClose: () => void;
}

const copy = {
  en: {
    eyebrow: "Advanced composer",
    selected: "Meal ingredients",
    outside: "Ingredient field",
    target: "Target",
    preview: "Preview",
    apply: "Apply",
    cancel: "Cancel",
    reset: "Reset",
    balanced: "Balanced",
    adjusted: "Adjusted grams",
    needsProtein: "Needs protein source",
    empty: "Add at least one ingredient",
    hint: "Drag ingredients into the meal. Drag selected ingredients back outside to remove them.",
    protein: "Protein",
    carbs: "Carbs",
    fats: "Fats",
    plants: "Plants"
  },
  zh: {
    eyebrow: "高级配餐器",
    selected: "当餐食材区域",
    outside: "食材选择区",
    target: "目标",
    preview: "预览",
    apply: "应用",
    cancel: "取消",
    reset: "重置",
    balanced: "已平衡",
    adjusted: "已重算克数",
    needsProtein: "需要蛋白质来源",
    empty: "至少添加一个食材",
    hint: "把外部食材拖入餐卡片；把已选食材拖到外面即可移除。",
    protein: "蛋白质",
    carbs: "碳水",
    fats: "脂肪",
    plants: "蔬果"
  }
} as const;

const orbit = [
  { left: "5%", top: "10%", rotate: "-5deg" },
  { left: "33%", top: "6%", rotate: "3deg" },
  { left: "68%", top: "9%", rotate: "-2deg" },
  { left: "9%", top: "27%", rotate: "4deg" },
  { left: "77%", top: "28%", rotate: "-6deg" },
  { left: "3%", top: "48%", rotate: "-3deg" },
  { left: "80%", top: "50%", rotate: "5deg" },
  { left: "13%", top: "71%", rotate: "2deg" },
  { left: "62%", top: "75%", rotate: "-4deg" },
  { left: "38%", top: "85%", rotate: "3deg" },
  { left: "55%", top: "18%", rotate: "5deg" },
  { left: "22%", top: "57%", rotate: "-6deg" },
  { left: "71%", top: "66%", rotate: "2deg" },
  { left: "18%", top: "16%", rotate: "-2deg" },
  { left: "49%", top: "67%", rotate: "-1deg" },
  { left: "84%", top: "14%", rotate: "4deg" }
];

export function MealComposerOverlay({
  language,
  dayLabel,
  meal,
  baseMeal,
  hasOverride,
  onApply,
  onReset,
  onClose
}: MealComposerOverlayProps) {
  const t = copy[language];
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

  function addFood(foodName: string) {
    setSelectedFoodNames((current) => replaceFoodByRole(current, foodName));
  }

  function removeFood(foodName: string) {
    setSelectedFoodNames((current) => current.filter((name) => name !== foodName));
  }

  function handleSelectedDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    const payload = readDragPayload(event);
    if (payload?.source === "available") addFood(payload.foodName);
  }

  function handleOutsideDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const payload = readDragPayload(event);
    if (payload?.source === "selected") removeFood(payload.foodName);
  }

  return (
    <div className="meal-composer-overlay" role="dialog" aria-modal="true" aria-label={`${meal.name} composer`} onDragOver={(event) => event.preventDefault()} onDrop={handleOutsideDrop}>
      <button className="meal-composer-backdrop" type="button" aria-label={t.cancel} onClick={onClose} />

      <div className="ingredient-orbit" aria-label={t.outside}>
        {options.slice(0, orbit.length).map((food, index) => (
          <button
            className={`ingredient-chip ${getMealFoodRole(food)}`}
            draggable
            key={food.name}
            onClick={() => addFood(food.name)}
            onDragStart={(event) => writeDragPayload(event, { source: "available", foodName: food.name })}
            style={{ left: orbit[index].left, top: orbit[index].top, transform: `rotate(${orbit[index].rotate})` }}
            type="button"
          >
            <span>{categoryLabel(food.category, t)}</span>
            <strong>{food.name}</strong>
            <em>{food.kcal} kcal · P{food.protein} C{food.carbs} F{food.fat}</em>
          </button>
        ))}
      </div>

      <section className="meal-composer-card" onDragOver={(event) => event.preventDefault()} onDrop={handleSelectedDrop}>
        <div className="meal-composer-topline">
          <span>{t.eyebrow}</span>
          <strong>{dayLabel}</strong>
        </div>

        <div className="meal-composer-title-row">
          <div>
            <h2>{meal.name}</h2>
            <p>{t.hint}</p>
          </div>
          <div className={`meal-composer-status ${preview.status}`}>{statusText(preview, t)}</div>
        </div>

        <div className="meal-composer-targets">
          <MacroBadge label={t.target} meal={baseMeal} />
          <MacroBadge label={t.preview} meal={preview.meal} />
        </div>

        <div className="meal-selected-zone">
          <div className="meal-selected-head">
            <span>{t.selected}</span>
            <strong>{preview.meal.calories} kcal</strong>
          </div>
          <div className="meal-selected-list">
            {selectedFoods.map((food) => (
              <button
                className={`selected-food-pill ${getMealFoodRole(food)}`}
                draggable
                key={food.name}
                onClick={() => removeFood(food.name)}
                onDragStart={(event) => writeDragPayload(event, { source: "selected", foodName: food.name })}
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
          <button className="secondary-button" disabled={!hasOverride && selectedFoodNames.join("|") === baseMeal.items.map((item) => item.name).join("|")} type="button" onClick={onReset}>{t.reset}</button>
          <button className="primary-button no-top-margin" disabled={applyDisabled} type="button" onClick={() => onApply(selectedFoodNames)}>{t.apply}</button>
        </div>
      </section>
    </div>
  );
}

function MacroBadge({ label, meal }: { label: string; meal: Pick<DietMeal, "calories" | "proteinG" | "carbsG" | "fatG"> }) {
  return (
    <div className="meal-macro-badge">
      <span>{label}</span>
      <strong>{meal.calories} kcal</strong>
      <em>P{meal.proteinG} · C{meal.carbsG} · F{meal.fatG}</em>
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

function statusText(preview: OptimizedMealResult, labels: typeof copy.en | typeof copy.zh): string {
  if (preview.status === "balanced") return labels.balanced;
  if (preview.status === "needs-protein") return labels.needsProtein;
  if (preview.status === "empty") return labels.empty;
  return labels.adjusted;
}

function categoryLabel(category: FoodCategory, labels: typeof copy.en | typeof copy.zh): string {
  if (category === "proteins" || category === "dairy") return labels.protein;
  if (category === "carbs" || category === "fruits") return labels.carbs;
  if (category === "fats") return labels.fats;
  return labels.plants;
}

function writeDragPayload(event: DragEvent<HTMLElement>, payload: DragPayload) {
  event.dataTransfer.setData("application/json", JSON.stringify(payload));
  event.dataTransfer.effectAllowed = payload.source === "available" ? "copy" : "move";
}

function readDragPayload(event: DragEvent<HTMLElement>): DragPayload | null {
  try {
    const raw = event.dataTransfer.getData("application/json");
    if (!raw) return null;
    return JSON.parse(raw) as DragPayload;
  } catch {
    return null;
  }
}
