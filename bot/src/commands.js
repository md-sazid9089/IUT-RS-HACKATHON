'use strict';

const apiClient = require('./apiClient');
const formatters = require('./formatters');
const { polish, askQuestion } = require('./llm');

/**
 * @typedef {Object} CommandContext
 * @property {string[]} args
 */

/**
 * @typedef {Object} Command
 * @property {string} name
 * @property {string} description
 * @property {string} usage
 * @property {(ctx: CommandContext) => Promise<string>} run
 */

/** @type {Command[]} */
const commands = [
  {
    name: 'status',
    description: 'Show overall office power status.',
    usage: '!status',
    async run() {
      const [rooms, usage, alerts] = await Promise.all([
        apiClient.getRooms(),
        apiClient.getUsage(),
        apiClient.getAlerts()
      ]);
      const fallback = formatters.formatStatus({
        rooms: rooms.rooms,
        usage: usage.usage,
        alerts: alerts.alerts
      });
      return polish(fallback, 'office status summary');
    }
  },
  {
    name: 'room',
    description: 'Show status of a specific room. Accepts id or name.',
    usage: '!room <room-id-or-name>',
    async run({ args }) {
      if (args.length === 0) {
        return 'Usage: `!room <room-id-or-name>` (try `!status` to list rooms).';
      }
      const query = args.join(' ').trim().toLowerCase();
      // Normalize aliases: "work1" / "work 1" / "workroom1" → "work-room-1", "drawing" → "drawing-room"
      const normalized = query.replace(/[\s_-]+/g, '');
      const aliasMap = {
        drawing: 'drawing-room',
        drawingroom: 'drawing-room',
        work1: 'work-room-1',
        workroom1: 'work-room-1',
        w1: 'work-room-1',
        work2: 'work-room-2',
        workroom2: 'work-room-2',
        w2: 'work-room-2'
      };
      const targetId = aliasMap[normalized];
      const roomsRes = await apiClient.getRooms();
      const match = roomsRes.rooms.find((r) => {
        const rid = r.id.toLowerCase();
        const rname = r.name.toLowerCase();
        return (
          rid === query ||
          rname === query ||
          rid === targetId ||
          rid.replace(/[\s_-]+/g, '') === normalized ||
          rname.replace(/[\s_-]+/g, '') === normalized
        );
      });
      if (!match) {
        return `Room \`${query}\` not found. Try: \`drawing\`, \`work1\`, or \`work2\`.`;
      }
      const fallback = formatters.formatRoom(match);
      return polish(fallback, `room detail for ${match.name}`);
    }
  },
  {
    name: 'usage',
    description: 'Show power draw and today energy consumption.',
    usage: '!usage',
    async run() {
      const usage = await apiClient.getUsage();
      const fallback = formatters.formatUsage(usage.usage);
      return polish(fallback, 'power usage report');
    }
  },
  {
    name: 'help',
    description: 'List available commands.',
    usage: '!help',
    async run() {
      const lines = ['**Office Power Monitor — commands**'];
      for (const cmd of commands) {
        lines.push(`\`${cmd.usage}\` — ${cmd.description}`);
      }
      return lines.join('\n');
    }
  },
  {
    name: 'ask',
    description: 'Ask a free-form question about the office power/alert state.',
    usage: '!ask <question>',
    async run({ args, message }) {
      const question = args.join(' ').trim();
      if (!question) {
        return 'Usage: `!ask <your question>` (e.g. `!ask which room is drawing the most power?`)';
      }

      if (message.channel?.sendTyping) {
        message.channel.sendTyping().catch(() => {});
      }

      const placeholder = await message.reply('🤔 Checking the office data...');
      try {
        const reply = await askQuestion(question);
        await placeholder.edit(reply.length > 1900 ? reply.slice(0, 1900) + '\n…' : reply);
      } catch (err) {
        await placeholder.edit(`Error: ${err.message}`).catch(() => {});
      }
      return null;
    }
  }
];

/**
 * @param {string} name
 * @returns {Command|undefined}
 */
function findCommand(name) {
  const n = name.toLowerCase();
  return commands.find((c) => c.name === n);
}

module.exports = { commands, findCommand };
