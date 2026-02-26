const maxPoints = { 1: 5, 2: 8, 3: 10, 4: 12, 5: 15 };

/**
 * Calculates base point based on level and response time
 */
export function calculatePoint(level, responseTimeSec, timeLimit) {
    const max = maxPoints[level];
    const ratio = 1 - (responseTimeSec / timeLimit);
    const earned = Math.max(
        Math.floor(max * 0.2),
        Math.round(max * ratio)
    );
    return earned;
}

/**
 * Calculates bonuses and total points
 */
export function calculateTotalPoints(basePoint, isStreak, isSpeed, isComeback, isRareWord) {
    let total = basePoint;
    let bonuses = [];

    if (isStreak) {
        total += 2;
        bonuses.push({ name: 'STREAK', value: 2 });
    }

    if (isSpeed) {
        total += 2;
        bonuses.push({ name: 'SPEED', value: 2 });
    }

    if (isComeback) {
        total += 1;
        bonuses.push({ name: 'COMEBACK', value: 1 });
    }

    if (isRareWord) {
        total += 3;
        bonuses.push({ name: 'KATA LANGKA', value: 3 });
    }

    return { total, bonuses };
}
