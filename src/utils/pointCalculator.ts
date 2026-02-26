import { getMultiplier, LEVELS } from '../games/LevelConfig.js';
import { PointResult } from '../types/index.js';

// Helper: ambil nilai number dari .env dengan fallback
function envNum(key: string, fallback: number): number {
    const val = process.env[key];
    const num = parseFloat(val || '');
    return (!val || isNaN(num)) ? fallback : num;
}

export interface BonusConfig {
    bonusStreak: number;
    bonusSpeed: number;
    bonusComeback: number;
    bonusRareWord: number;
    bonusWinner: number;
    streakThreshold: number;
    speedThreshold: number;
    rareWordLength: number;
}

export interface PointBonuses {
    streak?: number;
    isSpeed?: boolean;
    isComeback?: boolean;
}

export interface BonusBreakdown {
    name: string;
    value: number;
    icon: string;
}

export interface CalculatedPoints extends PointResult {
    base: number;
    bonusTotal: number;
    total: number;
    adjustedMax: number;
    responseTime: number;
    bonuses: BonusBreakdown[];
    detail: string;
    multiplier: number;
}

// Ambil konfigurasi bonus dari .env
export function getBonusConfig(): BonusConfig {
    return {
        bonusStreak: envNum('SK_BONUS_STREAK', 2),
        bonusSpeed: envNum('SK_BONUS_SPEED', 2),
        bonusComeback: envNum('SK_BONUS_COMEBACK', 1),
        bonusRareWord: envNum('SK_BONUS_RARE_WORD', 3),
        bonusWinner: envNum('SK_BONUS_WINNER', 10),
        streakThreshold: envNum('SK_STREAK_THRESHOLD', 3),
        speedThreshold: envNum('SK_SPEED_THRESHOLD', 0.20),
        rareWordLength: envNum('SK_RARE_WORD_LENGTH', 8)
    };
}

/**
 * Kalkulasi point berdasarkan:
 *   - Level game (menentukan max base point dan time limit)
 *   - Waktu jawab (semakin cepat = semakin besar point)
 *   - Panjang kata jawaban (semakin panjang = multiplier lebih tinggi)
 */
export function calculatePoint(level: number, responseTimeSec: number, timeLimit: number, word: string = '', bonuses: PointBonuses = {}): CalculatedPoints {
    const config = getBonusConfig();
    const levelCfg = LEVELS[level];
    const maxBase = envNum(`SK_MAX_POINT_L${level}`, levelCfg?.maxPoint ?? 10);
    const minPoint = Math.max(1, Math.floor(maxBase * envNum('SK_MIN_POINT_RATIO', 0.20)));

    // ── 1. MULTIPLIER BERDASARKAN PANJANG KATA ──────────────────
    const wordLength = word.length;
    const multiplier = getMultiplier(wordLength);
    const adjustedMax = Math.ceil(maxBase * multiplier);

    // ── 2. BASE POINT BERDASARKAN KECEPATAN ─────────────────────
    const safeTime = Math.min(responseTimeSec, timeLimit); // clamp
    const ratio = Math.max(0, 1 - (safeTime / timeLimit));
    const basePoint = Math.max(minPoint, Math.round(adjustedMax * ratio));

    // ── 3. BONUS POINT ───────────────────────────────────────────
    let bonusTotal = 0;
    const bonusBreakdown: BonusBreakdown[] = [];

    // Streak bonus
    if (bonuses.streak && bonuses.streak >= config.streakThreshold) {
        bonusTotal += config.bonusStreak;
        bonusBreakdown.push({ name: 'STREAK', value: config.bonusStreak, icon: '🔥' });
    }

    // Speed bonus
    if (responseTimeSec <= timeLimit * config.speedThreshold) {
        bonusTotal += config.bonusSpeed;
        bonusBreakdown.push({ name: 'SPEED', value: config.bonusSpeed, icon: '⚡' });
    }

    // Comeback bonus
    if (bonuses.isComeback) {
        bonusTotal += config.bonusComeback;
        bonusBreakdown.push({ name: 'COMEBACK', value: config.bonusComeback, icon: '💪' });
    }

    // Kata langka bonus
    if (wordLength >= config.rareWordLength) {
        bonusTotal += config.bonusRareWord;
        bonusBreakdown.push({ name: `KATA LANGKA (${wordLength} huruf)`, value: config.bonusRareWord, icon: '📚' });
    }

    // ── 4. TOTAL ─────────────────────────────────────────────────
    const total = basePoint + bonusTotal;

    // ── 5. RETURN OBJECT LENGKAP ─────────────────────────────────
    return {
        // Core PointResult mapping (backward compat)
        basePoint: basePoint,
        wordLengthMultiplier: multiplier,
        streakBonus: bonuses.streak && bonuses.streak >= config.streakThreshold ? config.bonusStreak : 0,
        speedBonus: responseTimeSec <= timeLimit * config.speedThreshold ? config.bonusSpeed : 0,
        comebackBonus: bonuses.isComeback ? config.bonusComeback : 0,
        rareWordBonus: wordLength >= config.rareWordLength ? config.bonusRareWord : 0,
        totalPoint: total,

        // Expanded Custom Result
        base: basePoint,
        bonusTotal: bonusTotal,
        total: total,
        wordLength: wordLength,
        multiplier: multiplier,
        adjustedMax: adjustedMax,
        responseTime: responseTimeSec,
        bonuses: bonusBreakdown,
        multiplierText: multiplier >= 1.0
            ? `×${multiplier.toFixed(2)} 🔺`
            : `×${multiplier.toFixed(2)} 🔻`,
        detail: `${wordLength} huruf ×${multiplier.toFixed(2)} | ${responseTimeSec.toFixed(1)}s | Base: ${basePoint} + Bonus: ${bonusTotal} = ${total}pt`
    };
}

// ⚠️ DEPRECATED - gunakan calculatePoint() yang baru!
export function calculateTotalPoints(basePoint: number, isStreak: boolean, isSpeed: boolean, isComeback: boolean, isRareWord: boolean): { total: number, bonuses: { name: string, value: number }[] } {
    const config = getBonusConfig();
    let total = basePoint;
    let bonuses: { name: string, value: number }[] = [];
    if (isStreak) { total += config.bonusStreak; bonuses.push({ name: 'STREAK', value: config.bonusStreak }); }
    if (isSpeed) { total += config.bonusSpeed; bonuses.push({ name: 'SPEED', value: config.bonusSpeed }); }
    if (isComeback) { total += config.bonusComeback; bonuses.push({ name: 'COMEBACK', value: config.bonusComeback }); }
    if (isRareWord) { total += config.bonusRareWord; bonuses.push({ name: 'KATA LANGKA', value: config.bonusRareWord }); }
    return { total, bonuses };
}
