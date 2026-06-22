import { buildSafeCarbCyclingPlan } from "./carbCyclingSafePlan";
import { buildStandardPlan } from "./standardPlan";
import type { MacroResult, PlanResult, UserInput } from "./types";

export interface FoodItem {
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DietMealItem {
  name: string;
  grams: number;
}

export interface DietMeal {
  name: string;
  items: DietMealItem[];
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface DietDay {
  day: string;
  type: "Standard" | "High" | "Medium" | "Low";
  target: MacroResult;
  meals: DietMeal[];
  totals: MacroResult;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const proteins: FoodItem[] = [
  { name: "Chicken breast", kcal: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: "Lean beef", kcal: 176, protein: 26, carbs: 0, fat: 8 },
  { name: "Shrimp", kcal: 99, protein: 24, carbs: 0.2, fat: 0.3 },
  { name: "Tuna", kcal: 132, protein: 29, carbs: 0, fat: 1 },
  { name: "Egg whites", kcal: 52, protein: 11, carbs: 0.7, fat: 0.2 },
  { name: "Whole eggs", kcal: 143, protein: 13, carbs: 0.7, fat: 9.5 }
];

const carbs: FoodItem[] = [
  { name: "Cooked rice", kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { name: "Cooked brown rice", kcal: 123, protein: 2.7, carbs: 25.6, fat: 1 },
  { name: "Cooked pasta", kcal: 158, protein: 5.8, carbs: 31, fat: 0.9 },
  { name: "Potato", kcal: 87, protein: 1.9, carbs: 20, fat: 0.1 },
  { name: "Sweet potato", kcal: 86, protein: 1.6, carbs: 20, fat: 0.1 },
  { name: "Oats", kcal: 389, protein: 16.9, carbs: 66, fat: 6.9 },
  { name: "Whole wheat bread", kcal: 247, protein: 13, carbs: 41, fat: 4.2 },
  { name: "Corn", kcal: 96, protein: 3.4, carbs: 21, fat: 1.5 }
];

const vegetables: FoodItem[] = [
  { name: "Broccoli", kcal: 35, protein: 2.4, carbs: 7, fat: 0.4 },
  { name: "Spinach", kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  { name: "Zucchini", kcal: 17, protein: 1.2, carbs: 3.1, fat: 0.3 },
  { name: "Mushrooms", kcal: 22, protein: 3.1, carbs: 3.3, fat: 0.3 },
  { name: "Cauliflower", kcal: 25, protein: 1.9, carbs: 5, fat: 0.3 },
  { name: "Carrots", kcal: 41, protein: 0.9, carbs: 10, fat: 0.2 },
  { name: "Cucumber", kcal: 15, protein: 0.7, carbs: 3.6, fat: 0.1 },
  { name: "Tomato", kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2 }
];

const fruits: FoodItem[] = [
  { name: "Banana", kcal: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  { name: "Apple", kcal: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  { name: "Blueberries", kcal: 57, protein: 0.7, carbs: 14, fat: 0.3 },
  { name: "Orange", kcal: 47, protein: 0.9, carbs: 12, fat: 0.1 },
  { name: "Strawberries", kcal: 32, protein: 0.7, carbs: 7.7, fat: 0.3 },
  { name: "Kiwi", kcal: 61, protein: 1.1, carbs: 15, fat: 0.5 }
];

const fats: FoodItem[] = [
  { name: "Olive oil", kcal: 884, protein: 0, carbs: 0, fat: 100 },
  { name: "Avocado", kcal: 160, protein: 2, carbs: 8.5, fat: 14.7 },
  { name: "Almonds", kcal: 579, protein: 21, carbs: 22, fat: 50 },
  { name: "Peanut butter", kcal: 588, protein: 25, carbs: 20, fat: 50 },
  { name: "Walnuts", kcal: 654, protein: 15, carbs: 14, fat: 65 }
];

const dairy: FoodItem[] = [
  { name: "Greek yogurt", kcal: 73, protein: 10, carbs: 3.9, fat: 1.9 },
  { name: "Skim milk", kcal: 34, protein: 3.4, carbs: 5, fat: 0.1 },
  { name: "Soy milk", kcal: 54, protein: 3.3, carbs: 6, fat: 1.8 }
];

export function buildDietWeek(input: UserInput): DietDay[] {
  const result = buildResult(input);

  if (result.kind === "carbCycling") {
    return result.weeklySchedule.map((schedule, index) =>
      buildDietDay(schedule.day, schedule.type, getCarbTarget(result, schedule.type), index)
    );
  }

  return DAYS.map((day, index) => buildDietDay(day, "Standard", result.daily, index));
}

function buildResult(input: UserInput): PlanResult {
  if (input.sex === "male" && input.planType === "carbCycling") {
    return buildSafeCarbCyclingPlan(input);
  }

  return buildStandardPlan(input);
}

function getCarbTarget(result: Extract<PlanResult, { kind: "carbCycling" }>, type: "High" | "Medium" | "Low"): MacroResult {
  if (type === "High") return result.highDay;
  if (type === "Medium") return result.mediumDay;
  return result.lowDay;
}

function buildDietDay(day: string, type: DietDay["type"], target: MacroResult, index: number): DietDay {
  const breakfast = buildMeal("Breakfast", target, index, 0.25, 0.27, 0.22);
  const lunch = buildMeal("Lunch", target, index + 2, 0.35, 0.34, 0.32);
  const dinner = buildMeal("Dinner", target, index + 4, 0.30, 0.29, 0.34);
  const snack = buildSnack(target, index, 0.10, 0.10, 0.12);
  const meals = [breakfast, lunch, dinner, snack];
  const totals = sumMeals(meals);

  return { day, type, target, meals, totals };
}

function buildMeal(
  name: string,
  target: MacroResult,
  seed: number,
  proteinShare: number,
  carbShare: number,
  fatShare: number
): DietMeal {
  const proteinFood = pick(proteins, seed);
  const carbFood = pick(carbs, seed + 1);
  const vegetableFood = pick(vegetables, seed + 2);
  const fatFood = pick(fats, seed + 3);
  const proteinTarget = target.proteinG * proteinShare;
  const carbTarget = target.carbsG * carbShare;
  const fatTarget = target.fatG * fatShare;

  return makeMeal(name, [
    { food: proteinFood, grams: gramsFor(proteinFood.protein, proteinTarget, 80, 260) },
    { food: carbFood, grams: gramsFor(carbFood.carbs, carbTarget, 70, 320) },
    { food: vegetableFood, grams: 180 },
    { food: fatFood, grams: gramsFor(fatFood.fat, fatTarget, 5, 35) }
  ]);
}

function buildSnack(
  target: MacroResult,
  seed: number,
  proteinShare: number,
  carbShare: number,
  fatShare: number
): DietMeal {
  const proteinFood = pick(dairy, seed);
  const fruitFood = pick(fruits, seed + 1);
  const fatFood = pick(fats, seed + 2);
  const proteinTarget = target.proteinG * proteinShare;
  const carbTarget = target.carbsG * carbShare;
  const fatTarget = target.fatG * fatShare;

  return makeMeal("Snack", [
    { food: proteinFood, grams: gramsFor(proteinFood.protein, proteinTarget, 100, 280) },
    { food: fruitFood, grams: gramsFor(fruitFood.carbs, carbTarget, 80, 220) },
    { food: fatFood, grams: gramsFor(fatFood.fat, fatTarget, 5, 25) }
  ]);
}

function makeMeal(name: string, entries: Array<{ food: FoodItem; grams: number }>): DietMeal {
  const items = entries.map((entry) => ({ name: entry.food.name, grams: roundToFive(entry.grams) }));
  const totals = entries.reduce(
    (sum, entry) => {
      const factor = roundToFive(entry.grams) / 100;
      return {
        calories: sum.calories + entry.food.kcal * factor,
        proteinG: sum.proteinG + entry.food.protein * factor,
        carbsG: sum.carbsG + entry.food.carbs * factor,
        fatG: sum.fatG + entry.food.fat * factor
      };
    },
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );

  return { name, items, ...roundMacro(totals) };
}

function sumMeals(meals: DietMeal[]): MacroResult {
  return roundMacro(
    meals.reduce(
      (sum, meal) => ({
        calories: sum.calories + meal.calories,
        proteinG: sum.proteinG + meal.proteinG,
        carbsG: sum.carbsG + meal.carbsG,
        fatG: sum.fatG + meal.fatG
      }),
      { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
    )
  );
}

function gramsFor(macroPer100g: number, targetMacro: number, min: number, max: number): number {
  if (macroPer100g <= 0 || targetMacro <= 0) return min;
  return Math.min(max, Math.max(min, (targetMacro / macroPer100g) * 100));
}

function pick<T>(items: T[], seed: number): T {
  return items[seed % items.length];
}

function roundToFive(value: number): number {
  return Math.round(value / 5) * 5;
}

function roundMacro(value: MacroResult): MacroResult {
  return {
    calories: Math.round(value.calories),
    proteinG: Math.round(value.proteinG),
    carbsG: Math.round(value.carbsG),
    fatG: Math.round(value.fatG)
  };
}
