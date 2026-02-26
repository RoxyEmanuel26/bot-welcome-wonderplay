// Helper: ambil nilai number dari .env dengan fallback
function envNum(key, fallback) {
    const val = process.env[key];
    const num = parseFloat(val);
    return (!val || isNaN(num)) ? fallback : num;
}

// Ambil konfigurasi dari .env dengan fallback default
export function getLevelConfig() {
    return {
        maxPoints: {
            1: envNum('SK_MAX_POINT_L1', 5),
            2: envNum('SK_MAX_POINT_L2', 8),
            3: envNum('SK_MAX_POINT_L3', 10),
            4: envNum('SK_MAX_POINT_L4', 12),
            5: envNum('SK_MAX_POINT_L5', 15)
        },
        minPointRatio: envNum('SK_MIN_POINT_RATIO', 0.20),
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
 * Hitung multiplier berdasarkan panjang kata
 * @param {number} wordLength - Panjang kata jawaban
 * @returns {number} multiplier (0.5 - 1.5)
 */
export function getWordLengthMultiplier(wordLength) {
    if (wordLength <= 3) return 0.50;
    if (wordLength === 4) return 0.65;
    if (wordLength === 5) return 0.80;
    if (wordLength === 6) return 0.90;
    if (wordLength === 7) return 1.00;  // baseline
    if (wordLength === 8) return 1.10;
    if (wordLength === 9) return 1.20;
    if (wordLength === 10) return 1.30;
    return 1.50;  // 11+ huruf
}

/**
 * Kalkulasi point lengkap berdasarkan:
 * - Waktu jawab (semakin cepat = semakin banyak)
 * - Panjang kata (semakin panjang = max point lebih tinggi)
 * - Bonus yang aktif
 *
 * @param {number} level          - Level game (1-5)
 * @param {number} responseTimeSec - Waktu jawab dalam detik
 * @param {number} timeLimit      - Batas waktu level (detik)
 * @param {string} word           - Kata yang dijawab
 * @param {object} bonuses        - { streak, isSpeed, isComeback }
 * @returns {object} { base, multiplier, bonusTotal, total, breakdown }
 */
export function calculatePoint(level, responseTimeSec, timeLimit, word, bonuses = {}) {
    const config = getLevelConfig();
    const maxBase = config.maxPoints[level];
    const minPoint = Math.max(1, Math.floor(maxBase * config.minPointRatio));

    // 1. MULTIPLIER BERDASARKAN PANJANG KATA
    const wordLength = word.length;
    const multiplier = getWordLengthMultiplier(wordLength);
    const adjustedMax = Math.ceil(maxBase * multiplier);

    // 2. BASE POINT BERDASARKAN KECEPATAN
    //    Semakin cepat jawab = semakin mendekati adjustedMax
    const timeRatio = 1 - (responseTimeSec / timeLimit);
    const basePoint = Math.max(minPoint, Math.round(adjustedMax * timeRatio));

    // 3. BONUS POINT
    let bonusTotal = 0;
    const bonusBreakdown = [];

    // Streak bonus
    if (bonuses.streak && bonuses.streak >= config.streakThreshold) {
        bonusTotal += config.bonusStreak;
        bonusBreakdown.push(`🔥 STREAK x${bonuses.streak} +${config.bonusStreak}`);
    }

    // Speed bonus (jawab dalam threshold% pertama waktu)
    if (responseTimeSec <= timeLimit * config.speedThreshold) {
        bonusTotal += config.bonusSpeed;
        bonusBreakdown.push(`⚡ SPEED +${config.bonusSpeed}`);
    }

    // Comeback bonus
    if (bonuses.isComeback) {
        bonusTotal += config.bonusComeback;
        bonusBreakdown.push(`💪 COMEBACK +${config.bonusComeback}`);
    }

    // Kata langka bonus (berdasarkan config)
    if (wordLength >= config.rareWordLength) {
        bonusTotal += config.bonusRareWord;
        bonusBreakdown.push(`📚 KATA LANGKA (${wordLength} huruf) +${config.bonusRareWord}`);
    }

    // 4. TOTAL
    const total = basePoint + bonusTotal;

    // 5. RETURN BREAKDOWN LENGKAP
    return {
        base: basePoint,
        multiplier: multiplier,
        adjustedMax: adjustedMax,
        wordLength: wordLength,
        bonusTotal: bonusTotal,
        total: total,
        breakdown: bonusBreakdown,
        responseTime: responseTimeSec,
        detail: `${wordLength} huruf (×${multiplier}) | ${responseTimeSec.toFixed(1)}s | Base: ${basePoint} + Bonus: ${bonusTotal} = ${total}pt`
    };
}
