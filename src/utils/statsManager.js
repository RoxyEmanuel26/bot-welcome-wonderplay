import fs from 'fs/promises';
import { existsSync } from 'fs';

const STATS_FILE = 'stats.json';
let stats = { totalWelcomes: 0, messageUsage: {}, lastWelcome: null };

export async function loadStats() {
  try {
    if (existsSync(STATS_FILE)) {
      const data = await fs.readFile(STATS_FILE, 'utf8');
      stats = JSON.parse(data);
      console.log(`📊 Stats loaded: ${stats.totalWelcomes} total welcomes`);
    }
  } catch (err) {
    console.log('📊 Creating new stats file...');
  }
}

export async function saveStats() {
  try {
    await fs.writeFile(STATS_FILE, JSON.stringify(stats, null, 2));
  } catch (err) {
    console.error('❌ Error saving stats:', err.message);
  }
}

export function updateStats(messageId) {
  stats.totalWelcomes++;
  stats.messageUsage[messageId] = (stats.messageUsage[messageId] || 0) + 1;
  stats.lastWelcome = new Date().toISOString();
  saveStats();
}

export function getStats() {
  return stats;
}
