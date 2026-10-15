"use client";

import bdMap from "@/data/bdDistrictsMap.json";

// Same official-dataset-vs-our-spelling drift the /delivery-area map
// already has to correct for (see DISTRICT_NAME_ALIASES there) — kept
// minimal here since we only need to resolve ONE district per order, not
// build a full bn/en directory.
const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
const DISTRICT_NAME_ALIASES: Record<string, string> = {
  chapainababganj: "chapainawabganj",
  netrakona: "netrokona",
  jhalokati: "jhalokathi",
};

function findDistrict(name: string) {
  const key = DISTRICT_NAME_ALIASES[normalize(name)] ?? normalize(name);
  return (
    bdMap.districts.find(d => normalize(d.name) === key) ??
    bdMap.districts.find(d => key.includes(normalize(d.name)) || normalize(d.name).includes(key))
  );
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
  destinationLabel: string;
}

export default function DeliveryRouteMap({ isBn, originDistrict, destinationDistrict, destinationLabel }: Props) {
  const origin = findDistrict(originDistrict);
  const destination = findDistrict(destinationDistrict);
  if (!origin || !destination) return null;

  const sameDistrict = origin.name === destination.name;

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

          {bdMap.districts.map(d => (
            <path
              key={d.name}
              d={d.path}
              fill={d.name === origin.name || d.name === destination.name ? "#fde68a" : "#e5e7eb"}
              stroke="#ffffff"
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
                fill="none" stroke="#b45309" strokeWidth={3} strokeLinecap="round"
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
          <circle cx={origin.cx} cy={origin.cy} r="6" fill="#dc2626" stroke="#fff" strokeWidth="1.4" />

          {/* Destination — customer, with the delivery car */}
          <image
            href="/assets/logo/delivery-car.png"
            x={destination.cx - 16} y={destination.cy - 28}
            width="32" height="32"
            style={{ filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.35))" }}
          />

          {bdMap.districts
            .filter(d => d.name === origin.name || d.name === destination.name)
            .map(d => (
              <text
                key={`label-${d.name}`}
                x={d.cx} y={d.cy + (d.name === destination.name ? 16 : 20)}
                textAnchor="middle"
                className="fill-gray-900 font-bold pointer-events-none select-none"
                style={{ fontSize: 11, paintOrder: "stroke", stroke: "#fff", strokeWidth: 3 }}
              >
                {d.name}
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
