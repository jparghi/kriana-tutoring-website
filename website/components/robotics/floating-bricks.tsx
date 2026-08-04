import type { CSSProperties } from "react";

type Brick = {
  color: string;
  top: string;
  left: string;
  size: number;
  rotate: number;
  studs: 1 | 3;
  delay: number;
  path: { x1: number; y1: number; x2: number; y2: number; x3: number; y3: number };
};

function LegoBrick({ color, size, studs }: { color: string; size: number; studs: 1 | 3 }) {
  if (studs === 1) {
    return (
      <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
        <rect x="0" y="14" width="40" height="26" rx="3" fill={color} style={{ filter: "brightness(0.92)" }} />
        <polygon points="6,0 40,0 34,14 0,14" fill={color} style={{ filter: "brightness(1.1)" }} />
        <circle cx="20" cy="6" r="7" fill={color} style={{ filter: "brightness(1.25)" }} />
        <circle cx="20" cy="6" r="7" fill="none" stroke="#000" strokeOpacity="0.12" strokeWidth="1" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 46" width={size * 2.5} height={size * 1.15} aria-hidden="true">
      <rect x="0" y="16" width="100" height="30" rx="3" fill={color} style={{ filter: "brightness(0.92)" }} />
      <polygon points="10,0 100,0 90,16 0,16" fill={color} style={{ filter: "brightness(1.1)" }} />
      {[22, 50, 78].map((cx) => (
        <circle key={cx} cx={cx} cy="7" r="6.5" fill={color} style={{ filter: "brightness(1.25)" }} />
      ))}
    </svg>
  );
}

export function FloatingBricks({ bricks, opacity = 0.16 }: { bricks: Brick[]; opacity?: number }) {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" style={{ opacity }}>
      {bricks.map((brick, i) => (
        <span
          key={i}
          className="absolute animate-brick-drift"
          style={
            {
              top: brick.top,
              left: brick.left,
              transform: `rotate(${brick.rotate}deg)`,
              animationDelay: `${brick.delay}s`,
              "--brick-x1": `${brick.path.x1}px`,
              "--brick-y1": `${brick.path.y1}px`,
              "--brick-x2": `${brick.path.x2}px`,
              "--brick-y2": `${brick.path.y2}px`,
              "--brick-x3": `${brick.path.x3}px`,
              "--brick-y3": `${brick.path.y3}px`,
              "--brick-r0": `${brick.rotate}deg`,
              "--brick-r1": `${brick.rotate + 14}deg`,
              "--brick-r2": `${brick.rotate - 10}deg`,
              "--brick-r3": `${brick.rotate + 6}deg`,
            } as CSSProperties
          }
        >
          <LegoBrick color={brick.color} size={brick.size} studs={brick.studs} />
        </span>
      ))}
    </div>
  );
}

// Young Engineers palette + a couple of extra brick colors for variety.
const BRICK_COLORS = ["#0083CB", "#ED174B", "#F2A100", "#3730A3", "#22A455"];

export function scatterBricks(count: number, seed = 1): Brick[] {
  // Deterministic pseudo-random scatter so server and client render identically.
  let value = seed;
  function next() {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  }
  return Array.from({ length: count }, (_, i) => ({
    color: BRICK_COLORS[i % BRICK_COLORS.length],
    top: `${Math.round(next() * 96)}%`,
    left: `${Math.round(next() * 96)}%`,
    size: 30 + Math.round(next() * 26),
    rotate: Math.round(next() * 360),
    studs: next() > 0.5 ? 3 : 1,
    delay: -Math.round(next() * 22),
    path: {
      x1: Math.round((next() - 0.5) * 220),
      y1: Math.round((next() - 0.5) * 220),
      x2: Math.round((next() - 0.5) * 220),
      y2: Math.round((next() - 0.5) * 220),
      x3: Math.round((next() - 0.5) * 220),
      y3: Math.round((next() - 0.5) * 220),
    },
  }));
}
