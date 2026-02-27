import fs from 'fs/promises';
import { existsSync } from 'fs';

const HISTORY_FILE = 'match_history.json';
let matchHistory: any[] = [];

/**
 * Load match history dari file
 */
export async function loadMatchHistory() {
    try {
        if (existsSync(HISTORY_FILE)) {
            const data = await fs.readFile(HISTORY_FILE, 'utf8');
            matchHistory = JSON.parse(data);
            console.log(`🎮 Match history loaded: ${matchHistory.length} matches`);
        }
    } catch (err) {
        console.log('🎮 Creating new match history...');
        matchHistory = [];
    }
}

/**
 * Simpan match history ke file
 */
async function saveMatchHistory() {
    try {
        await fs.writeFile(HISTORY_FILE, JSON.stringify(matchHistory, null, 2));
    } catch (err: any) {
        console.error('❌ Error saving match history:', err.message);
    }
}

/**
 * Tambah match baru ke history
 * @param {object} match 
 */
export async function addMatch(match: any) {
    matchHistory.push({
        id: matchHistory.length + 1,
        date: new Date().toISOString(),
        map: match.map,
        attackers: match.attackers.map((p: any) => ({ id: p.id, username: p.username })),
        defenders: match.defenders.map((p: any) => ({ id: p.id, username: p.username })),
        spectators: match.spectators.map((p: any) => ({ id: p.id, username: p.username })),
        requestedBy: match.requestedBy
    });
    await saveMatchHistory();
}

/**
 * Ambil match history
 * @param {number} limit
 * @returns {Array}
 */
export function getMatchHistory(limit = 5): any[] {
    return matchHistory.slice(-limit).reverse();
}
