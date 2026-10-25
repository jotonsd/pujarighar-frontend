"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import bdMap from "@/data/bdDistrictsMap.json";
import { DISTRICT_BN, DISTRICT_EN_BY_BN, DISTRICT_NAME_ALIASES, normalize } from "@/data/bdDistrictNames";

function findDistrict(rawName: string) {
  // A shipping_district typed in Bengali (very common — "ঝিনাইদহ") has no
  // a-z characters at all, so normalize() alone reduces it to "". Resolve
  // the Bengali name to its English spelling first in that case.
  const name = DISTRICT_EN_BY_BN[rawName.trim()] ?? rawName;
  const key = DISTRICT_NAME_ALIASES[normalize(name)] ?? normalize(name);
  // An empty key (unresolved Bengali text, or just garbage input) must
  // never be treated as a match — `"".includes(x)` / `x.includes("")` are
  // both true for every district, which previously made this silently
  // "match" the first district in the whole list instead of finding
  // nothing. No district name normalizes to "", so this is a safe guard.
  if (!key) return undefined;
  return (
    bdMap.districts.find(d => normalize(d.name) === key) ??
    bdMap.districts.find(d => key.includes(normalize(d.name)) || normalize(d.name).includes(key))
  );
}

function districtLabel(name: string, isBn: boolean): string {
  if (!isBn) return name;
  return DISTRICT_BN[normalize(name)] ?? name;
}

// Outward arc — same curve BangladeshMap's hub routes use, just drawn for
// a single origin -> destination pair instead of hub -> every division.
function arcPath(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const bow = len * 0.15;
  const cx = mx + (-dy / len) * bow;
  const cy = my + (dx / len) * bow;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

interface Props {
  isBn: boolean;
  originDistrict: string;
  destinationDistrict: string;
  destinationThana?: string;
}

export default function DeliveryRouteMap({ isBn, originDistrict, destinationDistrict, destinationThana }: Props) {
  const origin = findDistrict(originDistrict);
  const destination = findDistrict(destinationDistrict);

  // next-themes' `resolvedTheme` is undefined until mounted on the client
  // (it reads localStorage) — same mounted-guard ThemeToggle uses, so this
  // doesn't render light-mode colors for a split second on an actual
  // dark-mode visit before flipping.
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  if (!origin || !destination) return null;

  const destinationLabel = [districtLabel(destination.name, isBn), destinationThana]
    .filter(Boolean)
    .join(", ");

  const sameDistrict = origin.name === destination.name;
  // Green-50 ties unselected districts into the same green family as the
  // borders and the selected-district green, instead of a neutral gray
  // that clashed with it. Dark mode keeps its own darker panel fill.
  const unselectedFill = isDark ? "#374151" : "#f0fdf4";
  const borderStroke = "#4ade80";
  const borderWidth = isDark ? 0.8 : 0.6;

  return (
    <div className="border-t border-border pt-4">
      <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
        {isBn ? "ডেলিভারি রুট" : "Delivery Route"}
      </p>
      <div className="rounded-2xl bg-surface border border-border overflow-hidden p-3">
        <svg viewBox={bdMap.viewBox} className="w-full h-auto overflow-visible">
          <defs>
            <filter id="dr-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.4" />
            </filter>
            <style>{`
              .dr-route-highlight { stroke-dasharray: 5 7; animation: dr-route-flow 1.4s linear infinite; }
              @keyframes dr-route-flow { to { stroke-dashoffset: -24; } }
            `}</style>
          </defs>

          {/* Two passes: a later district in the array (e.g. Gazipur)
              whose simplified polygon slightly overlaps an earlier one
              (Dhaka) paints over it in plain array order — invisible
              between two gray districts, but a visible notch once one of
              them is the highlighted green. Drawing origin/destination
              in a second pass, on top of every other district, guarantees
              their full shape always wins that overlap. */}
          {bdMap.districts.map(d => (
            <path
              key={d.name}
              d={d.path}
              fill={d.name === origin.name || d.name === destination.name ? "#15803d" : unselectedFill}
              stroke={borderStroke}
              strokeWidth={borderWidth}
            />
          ))}
          {bdMap.districts
            .filter(d => d.name === origin.name || d.name === destination.name)
            .map(d => (
              <path
                key={`top-${d.name}`}
                d={d.path}
                fill="#15803d"
                stroke="#15803d"
                strokeWidth={0.6}
              />
            ))}

          {!sameDistrict && (
            <g>
              <path
                d={arcPath(origin.cx, origin.cy, destination.cx, destination.cy)}
                fill="none" stroke="#000000" strokeOpacity={0.3} strokeWidth={4}
                strokeLinecap="round" filter="url(#dr-shadow)" transform="translate(1.2, 2.2)"
              />
              <path
                d={arcPath(origin.cx, origin.cy, destination.cx, destination.cy)}
                fill="none" stroke="#15803d" strokeWidth={3} strokeLinecap="round"
              />
              <path
                d={arcPath(origin.cx, origin.cy, destination.cx, destination.cy)}
                fill="none" stroke="#ffffff" strokeWidth={1.1} strokeLinecap="round"
                className="dr-route-highlight"
              />
            </g>
          )}

          {/* Origin — our warehouse */}
          <circle cx={origin.cx} cy={origin.cy} r="7" fill="#000000" opacity="0.2" filter="url(#dr-shadow)" transform="translate(1, 1.5)" />
          <circle cx={origin.cx} cy={origin.cy} r="6" fill="#15803d" stroke="#fff" strokeWidth="1.4" />

          {/* Destination — customer, with the delivery car */}
          <image
            href="/assets/logo/delivery-car.png"
            x={destination.cx - 16} y={destination.cy - 28}
            width="32" height="32"
            style={{ filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.35))" }}
          />

          {/* Every other district's name, in the theme's secondary/muted
              text color — same hex pair globals.css defines for
              `text-muted` (there's no Tailwind class for SVG `fill`, so it's
              inlined here) — so the map reads as a real map instead of two
              labelled blobs floating in unlabelled gray shapes. */}
          {bdMap.districts
            .filter(d => d.name !== origin.name && d.name !== destination.name)
            .map(d => (
              <text
                key={`label-${d.name}`}
                x={d.cx} y={d.cy}
                textAnchor="middle"
                className="pointer-events-none select-none"
                style={{ fontSize: 7, fill: isDark ? "#a1a1aa" : "#6b7280" }}
              >
                {districtLabel(d.name, isBn)}
              </text>
            ))}

          {bdMap.districts
            .filter(d => d.name === origin.name || d.name === destination.name)
            .map(d => (
              <text
                key={`label-${d.name}`}
                x={d.cx} y={d.cy + (d.name === destination.name ? 16 : 20)}
                textAnchor="middle"
                className="fill-white font-bold pointer-events-none select-none"
                style={{ fontSize: 11, paintOrder: "stroke", stroke: "#14532d", strokeWidth: 3 }}
              >
                {districtLabel(d.name, isBn)}
              </text>
            ))}
        </svg>
      </div>
      <p className="text-xs text-muted mt-2 text-center">
        {isBn ? "আমাদের গুদাম থেকে " : "From our warehouse to "}
        <span className="font-semibold text-body">{destinationLabel}</span>
      </p>
    </div>
  );
}
