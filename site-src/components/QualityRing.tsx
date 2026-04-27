import { qualityHex } from '@/lib/utils';

type Props = {
  score: number;
  size?: number;
  label?: string;
};

export function QualityRing({ score, size = 56, label }: Props) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - score / 100);
  const color = qualityHex(score);

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          className="text-ink-200 dark:text-ink-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 600ms ease-out' }}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="13"
          fontWeight="600"
          fill="currentColor"
          className="rotate-90 origin-center text-ink-700 dark:text-ink-100"
          style={{ transformBox: 'fill-box' }}
        >
          {score}
        </text>
      </svg>
      {label && (
        <div className="text-[10px] uppercase tracking-[0.16em] text-ink-400">{label}</div>
      )}
    </div>
  );
}
