import { motion, AnimatePresence } from 'framer-motion';
import { formatRelative, formatWatts } from '../lib/format.js';

/**
 * Small visual chip for a single device: shows type icon, ON/OFF state,
 * label and last-changed time. Fans rotate, lights glow when ON.
 */
function DeviceChip({ device }) {
  const on = device.status === 'on';
  const isFan = device.type === 'fan';
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="flex items-center gap-3">
        <div
          className={`grid h-8 w-8 place-items-center rounded-lg ${
            on ? 'bg-accent-500/20 text-accent-400' : 'bg-white/5 text-slate-500'
          }`}
        >
          {isFan ? (
            <svg
              viewBox="0 0 24 24"
              className={`h-5 w-5 ${on ? 'fan-spin' : ''}`}
              fill="currentColor"
            >
              <path d="M12 12a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm0-8c3 0 6 2 6 5 0 2-2 3-4 3l-2 1V4Zm-4 6c-3 0-5 3-5 6 0 2 1 3 3 3l1-2 1-3v-4Zm12 6c0-3-2-6-5-6h-4l1 3 1 2h4c2 0 3-1 3-1v2Z" />
            </svg>
          ) : (
            <div
              className={`h-4 w-4 rounded-full ${on ? 'bg-yellow-300 light-glow' : 'bg-slate-600'}`}
            />
          )}
        </div>
        <div>
          <div className="text-sm font-medium text-slate-100">{device.label}</div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500">
            {device.type} · {formatRelative(device.lastChanged)}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className={`text-xs font-semibold ${on ? 'text-good' : 'text-slate-500'}`}>
          {on ? 'ON' : 'OFF'}
        </div>
        <div className="text-[11px] text-slate-400">{formatWatts(on ? device.power : 0)}</div>
      </div>
    </div>
  );
}

/**
 * Full room card with power breakdown bar and per-device chips.
 * @param {{room: any, delay?: number}} props
 */
export default function RoomCard({ room, delay = 0 }) {
  const utilisation = room.totalDevices > 0 ? room.onCount / room.totalDevices : 0;
  const bar = Math.round(utilisation * 100);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className="glass p-5"
    >
      <div className="relative flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{room.name}</h3>
          <p className="text-xs text-slate-400">
            {room.onCount}/{room.totalDevices} on · {formatWatts(room.powerWatts)}
          </p>
        </div>
        {room.allOn && <span className="chip border-warn/40 bg-warn/10 text-warn">All ON</span>}
      </div>

      <div className="relative mt-4 h-2 w-full overflow-hidden rounded-full bg-white/5">
        <motion.div
          className="h-full bg-gradient-to-r from-accent-400 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${bar}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      <div className="relative mt-4 space-y-2">
        <AnimatePresence initial={false}>
          {room.devices.map((d) => (
            <motion.div
              key={d.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
            >
              <DeviceChip device={d} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}
