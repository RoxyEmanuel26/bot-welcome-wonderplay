import { getMultiplier, LEVELS } from '../games/LevelConfig.js';

// Helper: ambil nilai number dari .env dengan fallback
function envNum(key, fallback) {
    const val = process.env[key];
    const num = parseFloat(val);
    return (!val || isNaN(num)) ? fallback : num;
}

// Ambil konfigurasi bonus dari .env
export function getBonusConfig() {
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
 *
 * TIDAK ADA batasan minimal/maksimal panjang kata.
 * Kata pendek = multiplier kecil tapi tetap VALID.
 * Kata panjang = multiplier besar = reward lebih banyak.
 *
 * @param {number} level            - Level game (1-5)
 * @param {number} responseTimeSec  - Waktu jawab dalam detik
 * @param {number} timeLimit        - Batas waktu level (detik)
 * @param {string} word             - Kata jawaban user
 * @param {object} bonuses          - { streak, isSpeed, isComeback }
 * @returns {object} hasil kalkulasi lengkap
 */
export function calculatePoint(level, responseTimeSec, timeLimit, word = '', bonuses = {}) {
    const config = getBonusConfig();
    const levelCfg = LEVELS[level];
    const maxBase = envNum(`SK_MAX_POINT_L${level}`, levelCfg?.maxPoint ?? 10);
    const minPoint = Math.max(1, Math.floor(maxBase * envNum('SK_MIN_POINT_RATIO', 0.20)));

    // ── 1. MULTIPLIER BERDASARKAN PANJANG KATA ──────────────────
    const wordLength = word.length;
    const multiplier = getMultiplier(wordLength);
    const adjustedMax = Math.ceil(maxBase * multiplier);

    // ── 2. BASE POINT BERDASARKAN KECEPATAN ─────────────────────
    //   ratio mendekati 1.0 = jawab sangat cepat = point besar
    //   ratio mendekati 0.0 = jawab di detik terakhir = point kecil
    const safeTime = Math.min(responseTimeSec, timeLimit); // clamp
    const ratio = Math.max(0, 1 - (safeTime / timeLimit));
    const basePoint = Math.max(minPoint, Math.round(adjustedMax * ratio));

    // ── 3. BONUS POINT ───────────────────────────────────────────
    let bonusTotal = 0;
    const bonusBreakdown = [];

    // Streak bonus: jawab benar X kali berturut-turut
    if (bonuses.streak && bonuses.streak >= config.streakThreshold) {
        bonusTotal += config.bonusStreak;
        bonusBreakdown.push({ name: 'STREAK', value: config.bonusStreak, icon: '🔥' });
    }

    // Speed bonus: jawab dalam X% pertama waktu
    if (responseTimeSec <= timeLimit * config.speedThreshold) {
        bonusTotal += config.bonusSpeed;
        bonusBreakdown.push({ name: 'SPEED', value: config.bonusSpeed, icon: '⚡' });
    }

    // Comeback bonus: jawab benar setelah salah
    if (bonuses.isComeback) {
        bonusTotal += config.bonusComeback;
        bonusBreakdown.push({ name: 'COMEBACK', value: config.bonusComeback, icon: '💪' });
    }

    // Kata langka bonus: panjang kata >= threshold di .env
    if (wordLength >= config.rareWordLength) {
        bonusTotal += config.bonusRareWord;
        bonusBreakdown.push({ name: `KATA LANGKA (${wordLength} huruf)`, value: config.bonusRareWord, icon: '📚' });
    }

    // ── 4. TOTAL ─────────────────────────────────────────────────
    const total = basePoint + bonusTotal;

    // ── 5. RETURN OBJECT LENGKAP ─────────────────────────────────
    return {
        // Nilai utama
        base: basePoint,
        bonusTotal: bonusTotal,
        total: total,

        // Info kalkulasi (untuk embed/log)
        wordLength: wordLength,
        multiplier: multiplier,
        adjustedMax: adjustedMax,
        responseTime: responseTimeSec,
        bonuses: bonusBreakdown,

        // String info siap pakai
        multiplierText: multiplier >= 1.0
            ? `×${multiplier.toFixed(2)} 🔺`
            : `×${multiplier.toFixed(2)} 🔻`,
        detail: `${wordLength} huruf ×${multiplier.toFixed(2)} | ${responseTimeSec.toFixed(1)}s | Base: ${basePoint} + Bonus: ${bonusTotal} = ${total}pt`
    };
}

// Fungsi lama tetap ada tapi deprecated (backward compat)
export function calculateTotalPoints(basePoint, isStreak, isSpeed, isComeback, isRareWord) {
    const config = getBonusConfig();
    let total = basePoint;
    let bonuses = [];
    if (isStreak) { total += config.bonusStreak; bonuses.push({ name: 'STREAK', value: config.bonusStreak }); }
    if (isSpeed) { total += config.bonusSpeed; bonuses.push({ name: 'SPEED', value: config.bonusSpeed }); }
    if (isComeback) { total += config.bonusComeback; bonuses.push({ name: 'COMEBACK', value: config.bonusComeback }); }
    if (isRareWord) { total += config.bonusRareWord; bonuses.push({ name: 'KATA LANGKA', value: config.bonusRareWord }); }
    return { total, bonuses };
    // ⚠️ DEPRECATED - gunakan calculatePoint() yang baru!
}
