export interface PointResult {
    basePoint: number;
    wordLengthMultiplier: number;
    streakBonus: number;
    speedBonus: number;
    comebackBonus: number;
    rareWordBonus: number;
    totalPoint: number;
    wordLength: number;
    multiplierText: string;
}

export interface PlayerSession {
    points: number;
    correct: number;
    wrong: number;
    streak: number;
    speedBonusCount: number;
    isWarned?: boolean;
}

export interface PointBreakdown {
    player: string;
    points: number;
}
