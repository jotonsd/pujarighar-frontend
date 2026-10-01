"use client";

import { useState } from "react";
import bdMap from "@/data/bdDistrictsMap.json";
import { useGetDeliveryChargesQuery } from "@/api/deliveryCharges/deliveryChargesApi";
import { formatAmount } from "@/utils/format";

// One distinct fill per division (like a geopandas choropleth-by-division
// plot) so the map reads as 8 real regions, not a flat gray country —
// Dhaka DISTRICT (not the whole division) still gets its own strong
// highlight on top of this since that's the actual delivery-zone boundary.
const DIVISION_COLORS: Record<string, string> = {
  Dhaka: "#fbbf24",
  Chattogram: "#34d399",
  Rajshahi: "#60a5fa",
  Khulna: "#a78bfa",
  Barishal: "#f472b6",
  Sylhet: "#fb923c",
  Rangpur: "#2dd4bf",
  Mymensingh: "#818cf8",
};
const DHAKA_DISTRICT_COLOR = "#dc2626";

// The official OCHA/BBS boundary dataset only carries English names, and
// its English spellings vary slightly from ours in a few places
// (e.g. "Chapainababganj" vs "Chapainawabganj", "Netrakona" vs
// "Netrokona") — normalize both sides before matching so the Bengali
// label/tooltip still resolves correctly despite the spelling drift.
const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

// One label per division, placed at the average centroid of its districts
// — the same "annotate at geometry.centroid" idea a geopandas choropleth
// uses, just computed from our own pre-projected district centroids.
function divisionLabelPoints(divisionBn: Record<string, string>) {
  const sums: Record<string, { x: number; y: number; n: number }> = {};
  for (const d of bdMap.districts) {
    const key = d.division_name;
    if (!sums[key]) sums[key] = { x: 0, y: 0, n: 0 };
    sums[key].x += d.cx;
    sums[key].y += d.cy;
    sums[key].n += 1;
  }
  return Object.entries(sums).map(([name, s]) => ({
    name,
    bn_name: divisionBn[normalize(name)] ?? name,
    x: s.x / s.n,
    y: s.y / s.n,
  }));
}

// A gentle outward arc (the classic airline-route-map curve) instead of a
// straight line — control point is the midpoint pushed away from the
// straight hub-to-point line along its perpendicular.
function arcPath(hubX: number, hubY: number, x: number, y: number) {
  const mx = (hubX + x) / 2;
  const my = (hubY + y) / 2;
  const dx = x - hubX;
  const dy = y - hubY;
  const len = Math.hypot(dx, dy) || 1;
  const bow = len * 0.12;
  const cx = mx + (-dy / len) * bow;
  const cy = my + (dx / len) * bow;
  return `M ${hubX} ${hubY} Q ${cx} ${cy} ${x} ${y}`;
}

interface Props {
  isBn: boolean;
  districtBn: Record<string, string>;
  divisionBn: Record<string, string>;
}

export default function BangladeshMap({ isBn, districtBn, divisionBn }: Props) {
  const [hovered, setHovered] = useState<{ name: string; bn: string; x: number; y: number; isDhaka: boolean } | null>(null);
  const divisionLabels = divisionLabelPoints(divisionBn);
  // Same cache RTK Query already has from DeliveryChargesPreview — this
  // doesn't trigger a second network request.
  const { data: charges } = useGetDeliveryChargesQuery();
  const hub = bdMap.districts.find(d => d.name === "Dhaka");
  const routes = hub ? divisionLabels.filter(l => l.name !== "Dhaka") : [];

  const show = (d: { name: string; cx: number; cy: number }) =>
    setHovered({
      name: d.name,
      bn: districtBn[normalize(d.name)] ?? d.name,
      x: d.cx,
      y: d.cy,
      isDhaka: d.name === "Dhaka",
    });

  // "+" since this is only the base/starting rate (see DeliveryCharge's
  // weight tiers) — the final charge for a given order can be higher, so
  // this shouldn't read as a fixed, guaranteed price.
  const chargeFor = (isDhaka: boolean) => {
    if (!charges) return null;
    return `${formatAmount(isDhaka ? charges.inside_dhaka : charges.outside_dhaka, isBn ? "bn" : "en", 0)}+`;
  };

  return (
    <div className="flex justify-center">
      <div className="mx-auto mb-3 rounded-3xl bg-surface border border-border overflow-hidden p-4 w-full" style={{ maxWidth: 600 }}>
        <svg viewBox={bdMap.viewBox} className="w-full h-auto overflow-visible">
          <defs>
            <filter id="route-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.4" />
            </filter>
            <style>{`
              .route-highlight {
                stroke-dasharray: 5 7;
                animation: route-flow 1.4s linear infinite;
              }
              @keyframes route-flow {
                to { stroke-dashoffset: -24; }
              }
            `}</style>
          </defs>

          {bdMap.districts.map(d => (
            <path
              key={d.name}
              d={d.path}
              fill={DIVISION_COLORS[d.division_name] ?? "#d1d5db"}
              stroke={d.name === "Dhaka" ? DHAKA_DISTRICT_COLOR : "#ffffff"}
              strokeWidth={d.name === "Dhaka" ? 1.8 : 0.6}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onMouseEnter={() => show(d)}
              onMouseLeave={() => setHovered(null)}
              onTouchStart={() => show(d)}
            />
          ))}


          {/* Flight-route-style hub lines — Dhaka to each division, drawn
              as a 3D "tube" (blurred dark shadow + solid base + a bright
              animated highlight down the middle) instead of a flat dashed
              line, so the arcs read as lifted off the map surface. */}
          {hub && routes.map(r => {
            const d = arcPath(hub.cx, hub.cy, r.x, r.y);
            return (
              <g key={r.name}>
                <path d={d} fill="none" stroke="#000000" strokeOpacity={0.3} strokeWidth={4} strokeLinecap="round" filter="url(#route-shadow)" transform="translate(1.2, 2.2)" />
                <path d={d} fill="none" stroke="#b45309" strokeWidth={3} strokeLinecap="round" />
                <path d={d} fill="none" stroke="#ffffff" strokeWidth={1.1} strokeLinecap="round" className="route-highlight" />
              </g>
            );
          })}

          {hub && (
            <>
              <circle cx={hub.cx} cy={hub.cy} r="7" fill="#000000" opacity="0.2" filter="url(#route-shadow)" transform="translate(1, 1.5)" />
              <circle cx={hub.cx} cy={hub.cy} r="6" fill="#dc2626" stroke="#fff" strokeWidth="1.4" />
            </>
          )}

          {/* A small delivery car sits permanently at the end of each
              route line (right by its division label) — "delivery has
              arrived here" — not just the larger one shown on hover. */}
          {routes.map(r => (
            <image
              key={`car-${r.name}`}
              href="/assets/logo/delivery-car.png"
              x={r.x - 15}
              y={r.y - 26}
              width="30"
              height="30"
              style={{ filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.35))" }}
            />
          ))}

          {/* Per-district name — small, non-bold, sits right at each
              district's own centroid so the map reads like a real atlas
              instead of only naming the 8 divisions. */}
          {bdMap.districts.map(d => (
            <text
              key={`label-${d.name}`}
              x={d.cx}
              y={d.cy}
              textAnchor="middle"
              className="fill-gray-800 pointer-events-none select-none"
              style={{ fontSize: 10, paintOrder: "stroke", stroke: "#fff", strokeWidth: 2.4, strokeLinejoin: "round" }}
            >
              {isBn ? (districtBn[normalize(d.name)] ?? d.name) : d.name}
            </text>
          ))}

          {divisionLabels.map(l => (
            <text
              key={l.name}
              x={l.x}
              y={l.y + 14}
              textAnchor="middle"
              className="fill-gray-900 text-[13px] font-bold pointer-events-none"
              style={{ paintOrder: "stroke", stroke: "#fff", strokeWidth: 3 }}
            >
              {isBn ? l.bn_name : l.name}
            </text>
          ))}

          {/* In-place hover/tap callout — our own delivery car planted
              right on the hovered district with its name on a label above
              it, instead of a generic map pin or a fixed badge elsewhere
              on the page. */}
          {hovered && hub && !hovered.isDhaka && (
            <path
              d={arcPath(hub.cx, hub.cy, hovered.x, hovered.y)}
              fill="none"
              stroke="#6b7280"
              strokeOpacity={0.8}
              strokeWidth={1.4}
              strokeLinecap="round"
              style={{ pointerEvents: "none" }}
            />
          )}

          {hovered && (
            <g style={{ pointerEvents: "none" }}>
              <foreignObject x={hovered.x - 130} y={hovered.y - 50} width="260" height="30" style={{ overflow: "visible" }}>
                <div className="flex justify-center" style={{ overflow: "visible" }}>
                  <span className="inline-flex items-center gap-1 bg-gray-900/90 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-lg whitespace-nowrap">
                    {isBn ? hovered.bn : hovered.name}
                    {chargeFor(hovered.isDhaka) && (
                      <span className="text-amber-300">· {chargeFor(hovered.isDhaka)}</span>
                    )}
                  </span>
                </div>
              </foreignObject>
              <image
                href="/assets/logo/delivery-car.png"
                x={hovered.x - 16}
                y={hovered.y - 22}
                width="32"
                height="32"
                style={{ filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.35))" }}
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
