import { motion } from 'framer-motion';

/**
 * Top-down office layout. Draws three rooms side-by-side with walls,
 * a shared corridor, tables, chairs, ceiling lights and ceiling fans.
 *
 * Fans rotate while ON; lights glow while ON. Each fixture is bound
 * to a real device by id, so the diagram reflects live simulator state.
 *
 * @param {{devices: any[], rooms: any[]}} props
 */
export default function OfficeLayout({ devices, rooms }) {
  // Fast lookup: deviceId → device
  const byId = new Map(devices.map((d) => [d.id, d]));

  // Fixed room slots in viewBox coordinates. Order matches config/devices.js.
  const roomSlots = [
    { id: 'drawing-room', x: 20, y: 60, w: 260, h: 360, label: 'Drawing Room' },
    { id: 'work-room-1', x: 300, y: 60, w: 260, h: 360, label: 'Work Room 1' },
    { id: 'work-room-2', x: 580, y: 60, w: 260, h: 360, label: 'Work Room 2' }
  ];

  // Positions inside a room for its 3 lights and 2 fans (room-local).
  const lightSlots = [
    { x: 60, y: 70 },
    { x: 130, y: 70 },
    { x: 200, y: 70 }
  ];
  const fanSlots = [
    { x: 90, y: 210 },
    { x: 170, y: 210 }
  ];

  const roomByIdMeta = new Map(rooms.map((r) => [r.id, r]));

  return (
    <section className="glass p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
          Office Layout · Top View
        </h3>
        <div className="text-xs text-slate-400">Fans spin & lights glow when ON</div>
      </div>

      <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-ink-900/60">
        <svg
          viewBox="0 0 860 460"
          className="block h-auto w-full"
          role="img"
          aria-label="Top-down office floor plan"
        >
          {/* Floor background */}
          <defs>
            <pattern id="floor-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M20 0H0V20" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            </pattern>
            <radialGradient id="light-on" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(253,224,71,1)" />
              <stop offset="60%" stopColor="rgba(253,224,71,0.35)" />
              <stop offset="100%" stopColor="rgba(253,224,71,0)" />
            </radialGradient>
          </defs>

          <rect x="0" y="0" width="860" height="460" fill="url(#floor-grid)" />

          {/* Outer building wall */}
          <rect
            x="8"
            y="40"
            width="844"
            height="404"
            rx="12"
            fill="none"
            stroke="rgba(148,163,184,0.5)"
            strokeWidth="4"
          />

          <text
            x="20"
            y="30"
            fill="rgba(226,232,240,0.7)"
            fontSize="14"
            fontWeight="600"
            letterSpacing="2"
          >
            OFFICE
          </text>

          {roomSlots.map((slot) => {
            const meta = roomByIdMeta.get(slot.id);
            const isHot = !!meta?.allOn;
            return (
              <g key={slot.id}>
                {/* Room walls */}
                <rect
                  x={slot.x}
                  y={slot.y}
                  width={slot.w}
                  height={slot.h}
                  rx="10"
                  fill="rgba(15,23,42,0.55)"
                  stroke={isHot ? 'rgba(245,158,11,0.7)' : 'rgba(148,163,184,0.35)'}
                  strokeWidth="2"
                />

                {/* Room label */}
                <text
                  x={slot.x + 12}
                  y={slot.y + 22}
                  fill="rgba(226,232,240,0.85)"
                  fontSize="13"
                  fontWeight="600"
                >
                  {slot.label}
                </text>
                {meta && (
                  <text
                    x={slot.x + slot.w - 12}
                    y={slot.y + 22}
                    fill="rgba(148,163,184,0.9)"
                    fontSize="11"
                    textAnchor="end"
                  >
                    {meta.onCount}/{meta.totalDevices} on · {Math.round(meta.powerWatts)}W
                  </text>
                )}

                {/* Table */}
                <rect
                  x={slot.x + slot.w / 2 - 55}
                  y={slot.y + slot.h / 2 - 25}
                  width="110"
                  height="60"
                  rx="6"
                  fill="rgba(56,189,248,0.08)"
                  stroke="rgba(56,189,248,0.35)"
                  strokeWidth="1.5"
                />
                {/* Chairs around the table */}
                {[
                  { cx: -75, cy: 5 },
                  { cx: 75, cy: 5 },
                  { cx: -30, cy: -50 },
                  { cx: 30, cy: -50 },
                  { cx: -30, cy: 60 },
                  { cx: 30, cy: 60 }
                ].map((c, i) => (
                  <circle
                    key={i}
                    cx={slot.x + slot.w / 2 + c.cx}
                    cy={slot.y + slot.h / 2 + c.cy}
                    r="10"
                    fill="rgba(148,163,184,0.15)"
                    stroke="rgba(148,163,184,0.5)"
                    strokeWidth="1.2"
                  />
                ))}

                {/* Lights */}
                {lightSlots.map((pos, idx) => {
                  const id = `${slot.id}-light-${idx + 1}`;
                  const dev = byId.get(id);
                  const on = dev?.status === 'on';
                  const cx = slot.x + pos.x;
                  const cy = slot.y + pos.y;
                  return (
                    <g key={id}>
                      {on && (
                        <motion.circle
                          cx={cx}
                          cy={cy}
                          r={28}
                          fill="url(#light-on)"
                          initial={{ opacity: 0.5 }}
                          animate={{ opacity: [0.5, 0.95, 0.5] }}
                          transition={{ duration: 2.4, repeat: Infinity }}
                        />
                      )}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={7}
                        fill={on ? '#fde047' : '#475569'}
                        stroke="rgba(255,255,255,0.25)"
                        strokeWidth="1.5"
                      />
                      <text
                        x={cx}
                        y={cy + 22}
                        fill="rgba(148,163,184,0.85)"
                        fontSize="9"
                        textAnchor="middle"
                      >
                        L{idx + 1}
                      </text>
                    </g>
                  );
                })}

                {/* Fans */}
                {fanSlots.map((pos, idx) => {
                  const id = `${slot.id}-fan-${idx + 1}`;
                  const dev = byId.get(id);
                  const on = dev?.status === 'on';
                  const cx = slot.x + pos.x;
                  const cy = slot.y + pos.y;
                  return (
                    <g key={id}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r="26"
                        fill="rgba(30,41,59,0.6)"
                        stroke={on ? 'rgba(56,189,248,0.8)' : 'rgba(148,163,184,0.4)'}
                        strokeWidth="1.5"
                      />
                      <motion.g
                        style={{ transformOrigin: `${cx}px ${cy}px` }}
                        animate={on ? { rotate: 360 } : { rotate: 0 }}
                        transition={
                          on
                            ? { repeat: Infinity, duration: 1.1, ease: 'linear' }
                            : { duration: 0.4 }
                        }
                      >
                        {[0, 60, 120, 180, 240, 300].map((angle) => (
                          <ellipse
                            key={angle}
                            cx={cx}
                            cy={cy - 12}
                            rx="4"
                            ry="14"
                            fill={on ? 'rgba(56,189,248,0.9)' : 'rgba(148,163,184,0.6)'}
                            transform={`rotate(${angle} ${cx} ${cy})`}
                          />
                        ))}
                        <circle cx={cx} cy={cy} r="4" fill={on ? '#38bdf8' : '#64748b'} />
                      </motion.g>
                      <text
                        x={cx}
                        y={cy + 40}
                        fill="rgba(148,163,184,0.85)"
                        fontSize="9"
                        textAnchor="middle"
                      >
                        F{idx + 1}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Corridor label */}
          <text
            x="430"
            y="450"
            fill="rgba(148,163,184,0.6)"
            fontSize="10"
            textAnchor="middle"
            letterSpacing="3"
          >
            — ENTRANCE —
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
        <span className="chip">
          <span className="h-2 w-2 rounded-full bg-yellow-300 light-glow" /> Light ON
        </span>
        <span className="chip">
          <span className="h-2 w-2 rounded-full bg-slate-500" /> Light OFF
        </span>
        <span className="chip">
          <span className="h-2 w-2 rounded-full bg-accent-400" /> Fan ON
        </span>
        <span className="chip">
          <span className="h-2 w-2 rounded-full bg-slate-500" /> Fan OFF
        </span>
        <span className="chip border-warn/40 bg-warn/10 text-warn">
          Room outline turns amber when fully ON
        </span>
      </div>
    </section>
  );
}
