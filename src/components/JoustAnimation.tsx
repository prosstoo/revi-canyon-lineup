/** Компактная SVG-анимация турнирного столкновения рыцарей */
type Size = 'sm' | 'md' | 'lg'

interface Props {
  size?: Size
  className?: string
  /** Короткая вспышка при сшибке (для акцента после расчёта) */
  impact?: boolean
}

export function JoustAnimation({ size = 'md', className = '', impact }: Props) {
  return (
    <div
      className={`joust joust--${size}${impact ? ' joust--impact' : ''} ${className}`.trim()}
      aria-hidden
    >
      <svg viewBox="0 0 200 56" className="joust__svg" fill="none">
        {/* пыль / искра в центре */}
        <g className="joust__spark">
          <circle cx="100" cy="28" r="2.2" className="joust__spark-core" />
          <path d="M100 18v6M100 32v6M92 28h6M102 28h6M94 22l4 4M102 32l4 4M102 22l-4 4M94 32l-4 4" className="joust__spark-rays" />
        </g>

        {/* левый рыцарь (синий) */}
        <g className="joust__rider joust__rider--left">
          {/* конь */}
          <ellipse cx="42" cy="42" rx="18" ry="7" className="joust__horse-body joust__fill-ally" opacity="0.85" />
          <path d="M28 40c-2 0-4 2-3 4M56 40c2 0 4 2 3 4" className="joust__stroke-ally" strokeWidth="1.4" />
          <path d="M55 36c6-1 10-6 9-10-3 1-7 3-10 6" className="joust__fill-ally" />
          <circle cx="62" cy="26" r="3.2" className="joust__fill-ally" />
          {/* всадник */}
          <path d="M40 34c0-8 4-12 8-12s6 3 6 8" className="joust__fill-ally" />
          <circle cx="48" cy="18" r="3.5" className="joust__fill-ally" />
          {/* щит */}
          <path d="M36 24h7v10l-3.5 3L36 34V24z" className="joust__shield-ally" />
          {/* копьё / меч вперёд */}
          <path d="M54 26h36" className="joust__lance joust__stroke-ally" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M90 26l4-2.2v4.4L90 26z" className="joust__fill-ally" />
        </g>

        {/* правый рыцарь (красный), зеркало */}
        <g className="joust__rider joust__rider--right">
          <ellipse cx="158" cy="42" rx="18" ry="7" className="joust__horse-body joust__fill-enemy" opacity="0.85" />
          <path d="M172 40c2 0 4 2 3 4M144 40c-2 0-4 2-3 4" className="joust__stroke-enemy" strokeWidth="1.4" />
          <path d="M145 36c-6-1-10-6-9-10 3 1 7 3 10 6" className="joust__fill-enemy" />
          <circle cx="138" cy="26" r="3.2" className="joust__fill-enemy" />
          <path d="M160 34c0-8-4-12-8-12s-6 3-6 8" className="joust__fill-enemy" />
          <circle cx="152" cy="18" r="3.5" className="joust__fill-enemy" />
          <path d="M164 24h-7v10l3.5 3 3.5-3V24z" className="joust__shield-enemy" />
          <path d="M146 26H110" className="joust__lance joust__stroke-enemy" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M110 26l-4-2.2v4.4L110 26z" className="joust__fill-enemy" />
        </g>

        {/* земля */}
        <path d="M12 48h176" className="joust__ground" strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />
      </svg>
    </div>
  )
}

/** Маленькие скрещённые мечи — пульс у заголовков поединков */
export function CrossedSwords({ className = '' }: { className?: string }) {
  return (
    <span className={`crossed-swords ${className}`.trim()} aria-hidden>
      <svg viewBox="0 0 24 24" width="16" height="16">
        <path
          className="crossed-swords__a"
          d="M4 4l8 8M7 4H4v3M12 12l2 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          className="crossed-swords__b"
          d="M20 4l-8 8M17 4h3v3M12 12l-2 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}
