interface PlanChoiceCardProps {
  title: string;
  subtitle?: string;
  active: boolean;
  onSelect: () => void;
}

export function PlanChoiceCard({ title, subtitle, active, onSelect }: PlanChoiceCardProps) {
  return (
    <button className={`choice-card ${active ? "active" : ""}`} onClick={onSelect} type="button" aria-pressed={active}>
      <strong>{title}</strong>
      {subtitle && <span>{subtitle}</span>}
    </button>
  );
}
