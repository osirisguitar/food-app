import { useState, useRef, useEffect, useMemo } from "react";
import { categoryColors } from "../data/dishes";

const SIZE = 500;
const CX = SIZE / 2;
const CY = SIZE / 2;
const RADIUS = 215;
const INNER_RADIUS = 52;
const TEXT_START_R = RADIUS - 10; // text anchor at outer rim

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function sectorPath(startAngle, endAngle) {
  const s = polarToCartesian(CX, CY, RADIUS, startAngle);
  const e = polarToCartesian(CX, CY, RADIUS, endAngle);
  const si = polarToCartesian(CX, CY, INNER_RADIUS, startAngle);
  const ei = polarToCartesian(CX, CY, INNER_RADIUS, endAngle);
  const la = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${s.x} ${s.y}`,
    `A ${RADIUS} ${RADIUS} 0 ${la} 1 ${e.x} ${e.y}`,
    `L ${ei.x} ${ei.y}`,
    `A ${INNER_RADIUS} ${INNER_RADIUS} 0 ${la} 0 ${si.x} ${si.y}`,
    "Z",
  ].join(" ");
}

// Radial text: anchored at outer rim, reads inward toward hub.
// rotate(midAngle + 90) aligns the local x-axis with the inward radial direction
// for every sector, giving uniform orientation around the wheel.
function radialTextTransform(midAngle) {
  const pos = polarToCartesian(CX, CY, TEXT_START_R, midAngle);
  return `translate(${pos.x}, ${pos.y}) rotate(${midAngle + 90})`;
}

export default function SpinWheel({ dishes, onResult, isSpinning, setIsSpinning, effortFilter }) {
  const categories = useMemo(() => {
    const seen = new Set();
    const result = [];
    for (const d of dishes) {
      if (d.category && !seen.has(d.category)) {
        seen.add(d.category);
        result.push(d.category);
      }
    }
    return result;
  }, [dishes]);

  const SECTOR_ANGLE = categories.length > 0 ? 360 / categories.length : 360;

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const usedDishNames = useRef(new Set());

  // Reset history when the effort filter changes
  useEffect(() => {
    usedDishNames.current.clear();
  }, [effortFilter]);

  function spin() {
    if (spinning || dishes.length === 0) return;

    // Build eligible pool based on effort filter
    const eligible = effortFilter
      ? dishes.filter(d => d.effort === effortFilter)
      : dishes;

    // Exclude already-suggested dishes; reset if all have been shown
    let unseen = eligible.filter(d => !usedDishNames.current.has(d.name));
    if (unseen.length === 0) {
      eligible.forEach(d => usedDishNames.current.delete(d.name));
      unseen = eligible;
    }

    // Pick the dish first, then spin the wheel to its category
    const dish = unseen[Math.floor(Math.random() * unseen.length)];
    usedDishNames.current.add(dish.name);

    const idx = categories.indexOf(dish.category);

    // Calculate how much to rotate so sector idx lands at the top pointer
    const center = (idx + 0.5) * SECTOR_ANGLE;
    const needed = (360 - (center % 360)) % 360;
    const currentMod = ((rotation % 360) + 360) % 360;
    let delta = needed - currentMod;
    if (delta < 0) delta += 360;
    const extraSpins = (6 + Math.floor(Math.random() * 4)) * 360;
    const newRotation = rotation + extraSpins + delta;

    setRotation(newRotation);
    setSpinning(true);
    setIsSpinning(true);

    setTimeout(() => {
      setSpinning(false);
      setIsSpinning(false);
      onResult({ dish, category: dish.category });
    }, 4200);
  }

  const transition = spinning
    ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)"
    : "none";

  return (
    <div className="wheel-wrapper">
      <div className="wheel-frame">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className={`wheel-svg${!spinning && dishes.length > 0 ? " wheel-svg--clickable" : ""}`}
          aria-label="Snurrhjul för middagsförslag"
          onClick={spin}
          role="button"
          tabIndex={spinning || dishes.length === 0 ? -1 : 0}
          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") spin(); }}
        >
          {/* Decorative outer rings */}
          <circle cx={CX} cy={CY} r={RADIUS + 16} fill="#F0E8DC" stroke="#C4956A" strokeWidth="1.5" />
          <circle cx={CX} cy={CY} r={RADIUS + 8} fill="none" stroke="#8B5E3C" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx={CX} cy={CY} r={RADIUS + 2} fill="none" stroke="#8B5E3C" strokeWidth="1.5" />

          {/* ── Rotating group ── */}
          <g
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: `${CX}px ${CY}px`,
              transition,
            }}
          >
            {categories.map((cat, i) => {
              const start = i * SECTOR_ANGLE;
              const end = (i + 1) * SECTOR_ANGLE;
              const mid = start + SECTOR_ANGLE / 2;
              const fill = categoryColors[cat] || "#888";
              return (
                <g key={cat}>
                  <path
                    d={sectorPath(start, end)}
                    fill={fill}
                    stroke="#F0E8DC"
                    strokeWidth="1.5"
                  />
                  <path
                    d={sectorPath(start, end)}
                    fill="none"
                    stroke="rgba(255,255,255,0.18)"
                    strokeWidth="4"
                  />
                  <text
                    transform={radialTextTransform(mid)}
                    textAnchor="start"
                    dominantBaseline="middle"
                    fontSize="12"
                    fontFamily="Lato, sans-serif"
                    fontWeight="700"
                    letterSpacing="0.8"
                    fill="#fff"
                    stroke="rgba(0,0,0,0.35)"
                    strokeWidth="3"
                    paintOrder="stroke fill"
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {cat.toUpperCase()}
                  </text>
                </g>
              );
            })}

            {/* Center hub */}
            <circle cx={CX} cy={CY} r={INNER_RADIUS} fill="#2C1A0E" stroke="#C4956A" strokeWidth="2.5" />
            <circle cx={CX} cy={CY} r={INNER_RADIUS - 7} fill="none" stroke="#C4956A" strokeWidth="1" />
            <text
              x={CX} y={CY + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="26"
              style={{ userSelect: "none" }}
            >
              🍴
            </text>
          </g>

          {/* ── Static pointer ── */}
          <g>
            <rect x={CX - 7} y={0} width={14} height={16} rx={4} fill="#8B3A3A" />
            <polygon points={`${CX - 13},14 ${CX + 13},14 ${CX},42`} fill="#8B3A3A" />
            <polygon points={`${CX - 5},14 ${CX + 2},14 ${CX - 4},28`} fill="rgba(255,255,255,0.25)" />
          </g>
        </svg>
      </div>

      <button
        className={`spin-btn${spinning ? " spinning" : ""}`}
        onClick={spin}
        disabled={spinning || dishes.length === 0}
      >
        {spinning ? "Snurrar…" : dishes.length === 0 ? "Laddar…" : "Snurra hjulet"}
      </button>
    </div>
  );
}
