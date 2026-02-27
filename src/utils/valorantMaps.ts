import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS_DIR = path.join(__dirname, '..', '..', 'assets');

/**
 * Daftar semua map Valorant beserta file gambarnya
 */
const VALORANT_MAPS = [
    { name: 'Bind', image: path.join(ASSETS_DIR, 'Bind.jpg') },
    { name: 'Haven', image: path.join(ASSETS_DIR, 'Haven.jpg') },
    { name: 'Split', image: path.join(ASSETS_DIR, 'Split.jpg') },
    { name: 'Ascent', image: path.join(ASSETS_DIR, 'Ascent.jpg') },
    { name: 'Icebox', image: path.join(ASSETS_DIR, 'Icebox.jpg') },
    { name: 'Breeze', image: path.join(ASSETS_DIR, 'Breeze.jpg') },
    { name: 'Fracture', image: path.join(ASSETS_DIR, 'Fracture.jpg') },
    { name: 'Pearl', image: path.join(ASSETS_DIR, 'Pearl.jpg') },
    { name: 'Lotus', image: path.join(ASSETS_DIR, 'Lotus.jpg') },
    { name: 'Sunset', image: path.join(ASSETS_DIR, 'Sunset.jpg') },
    { name: 'Abyss', image: path.join(ASSETS_DIR, 'Abyss.jpg') },
    { name: 'Corrode', image: path.join(ASSETS_DIR, 'Corrode.jpg') },
];

/**
 * Pilih satu map secara acak
 * @returns {{ name: string, image: string }}
 */
export function getRandomMap() {
    return VALORANT_MAPS[Math.floor(Math.random() * VALORANT_MAPS.length)];
}

/**
 * Acak urutan array (Fisher-Yates Shuffle)
 * @param {Array} array
 * @returns {Array}
 */
export function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Bagi pemain menjadi 2 tim secara acak
 * @param {Array} players - Array of GuildMember atau objek {id, username}
 * @returns {{ attackers: Array, defenders: Array, spectators: Array }}
 */
export function splitTeams<T>(players: T[]): { attackers: T[], defenders: T[], spectators: T[] } {
    const shuffled = shuffleArray(players);
    const half = Math.floor(shuffled.length / 2);

    const attackers = shuffled.slice(0, half);
    const defenders = shuffled.slice(half, half * 2);
    const spectators = shuffled.slice(half * 2); // Sisa jika ganjil

    return { attackers, defenders, spectators };
}

export { VALORANT_MAPS };
