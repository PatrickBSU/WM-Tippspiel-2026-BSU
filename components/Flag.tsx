import { flagCode } from "@/lib/data/teams";

interface Props {
  team: string;
  className?: string;
}

// Bild-Flaggen via flagcdn.com – rendern auf allen Plattformen identisch (auch Windows).
export default function Flag({ team, className = "" }: Props) {
  const code = flagCode(team);
  if (!code) return <span className={className}>🏳️</span>;
  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      alt={team}
      loading="lazy"
      className={`inline-block h-4 w-auto rounded-sm align-[-2px] ${className}`}
    />
  );
}
