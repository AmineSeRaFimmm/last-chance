import { buildCarbCyclingPlan } from "./carbCyclingPlan";
import type { CarbCyclingPlanResult, UserInput } from "./types";
import { sanitizeUserInput } from "./validators";

export function buildSafeCarbCyclingPlan(input: UserInput): CarbCyclingPlanResult {
  return buildCarbCyclingPlan(
    sanitizeUserInput({
      ...input,
      sex: "male",
      planType: "carbCycling"
    })
  );
}
