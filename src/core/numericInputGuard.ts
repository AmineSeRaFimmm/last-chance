let installed = false;

const OPTIONAL_NUMBER_LABELS = new Set(["Target kg", "目标体重 kg"]);

export function installNumericInputGuard(): void {
  if (installed || typeof document === "undefined") return;
  installed = true;

  document.addEventListener(
    "input",
    (event) => {
      const target = event.target;

      if (!(target instanceof HTMLInputElement) || target.type !== "number") {
        return;
      }

      if (target.value === "") {
        if (isOptionalNumberInput(target)) return;
        event.stopImmediatePropagation();
        return;
      }

      const normalizedValue = normalizeLeadingZeros(target.value);

      if (normalizedValue !== target.value) {
        target.value = normalizedValue;
      }
    },
    true
  );
}

function isOptionalNumberInput(input: HTMLInputElement): boolean {
  const field = input.closest(".field");
  const label = field?.querySelector("label")?.textContent?.trim();
  return label ? OPTIONAL_NUMBER_LABELS.has(label) : false;
}

function normalizeLeadingZeros(value: string): string {
  if (value === "0" || value.startsWith("0.")) return value;
  return value.replace(/^0+(?=\d)/, "");
}
