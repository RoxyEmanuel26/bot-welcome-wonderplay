import GamePoints, { IGamePoints, PointsHistoryItem } from '../database/models/GamePoints.js';

export interface SambungKataGameData {
    level: number;
    correctAnswers: number;
    wrongAnswers: number;
    avgResponseTime: number;
    bonuses: Array<{ name: string; value: number }>;
}

export interface PlayerRankResult {
    rank: number;
    total: number;
}

export interface PointsByGameResult {
    totalFromGame: number;
    historyCount: number;
    history: PointsHistoryItem[];
}

export interface SambungKataStatsResult {
    totalPoints: number;
    gamesFromSK: number;
    winsFromSK: number;
    avgPoints: number | string;
    bestGame: number;
    historyCount: number;
}

/**
 * Add points for Sambung Kata and update GamePoints schema
 */
export async function addSambungKataPoints(
    guildId: string,
    userId: string,
    username: string,
    points: number,
    gameData: SambungKataGameData,
    isWinner: boolean
): Promise<IGamePoints | null> {
    try {
        const reason = `Level: ${gameData.level} | Benar: ${gameData.correctAnswers}x | Salah: ${gameData.wrongAnswers}x | Avg: ${gameData.avgResponseTime.toFixed(1)}s | Bonus: ${gameData.bonuses.map(b => b.name).join(',')}`;

        const newHistoryItem = {
            game: 'sambung_kata',
            points,
            reason,
            earnedAt: new Date()
        };

        // Single atomic aggregation pipeline update — eliminates longestStreak race condition
        const pipeline: any[] = [
            {
                $set: {
                    username,
                    lastPlayedAt: new Date(),
                    totalPoints: { $add: [{ $ifNull: ['$totalPoints', 0] }, points] },
                    weeklyPoints: { $add: [{ $ifNull: ['$weeklyPoints', 0] }, points] },
                    monthlyPoints: { $add: [{ $ifNull: ['$monthlyPoints', 0] }, points] },
                    gamesPlayed: { $add: [{ $ifNull: ['$gamesPlayed', 0] }, 1] },
                    gamesWon: { $add: [{ $ifNull: ['$gamesWon', 0] }, isWinner ? 1 : 0] },
                    currentStreak: isWinner
                        ? { $add: [{ $ifNull: ['$currentStreak', 0] }, 1] }
                        : 0,
                    longestStreak: isWinner
                        ? {
                            $max: [
                                { $ifNull: ['$longestStreak', 0] },
                                { $add: [{ $ifNull: ['$currentStreak', 0] }, 1] }
                            ]
                        }
                        : { $ifNull: ['$longestStreak', 0] },
                    pointsHistory: {
                        $slice: [
                            { $concatArrays: [{ $ifNull: ['$pointsHistory', []] }, [newHistoryItem]] },
                            -50
                        ]
                    }
                }
            }
        ];

        const result = await GamePoints.findOneAndUpdate(
            { guildId, userId },
            pipeline,
            { upsert: true, new: true }
        ).lean() as any;

        console.log(`✅ [sambung_kata] ${username} +${points}pts | Total: ${result?.totalPoints || 0}`);
        return result;

    } catch (error) {
        console.error(`❌ Error adding sambung_kata points for ${username}:`, error);
        throw error;
    }
}

/**
 * Get user points document
 */
export async function getUserPoints(guildId: string, userId: string): Promise<IGamePoints | null> {
    try {
        return await GamePoints.findOne({ guildId, userId }).lean() as any;
    } catch (error) {
        console.error(`❌ Error fetching user points for ${userId}:`, error);
        return null;
    }
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(guildId: string, limit: number = 10, type: string = 'total'): Promise<IGamePoints[]> {
    try {
        let sortField = 'totalPoints';
        if (type === 'weekly') sortField = 'weeklyPoints';
        if (type === 'monthly') sortField = 'monthlyPoints';

        return await GamePoints.find({ guildId, [sortField]: { $gt: 0 } })
            .sort({ [sortField]: -1 })
            .limit(limit)
            .lean() as any[];
    } catch (error) {
        console.error('❌ Error fetching leaderboard:', error);
        return [];
    }
}

/**
 * Get player rank
 */
export async function getPlayerRank(guildId: string, userId: string): Promise<PlayerRankResult> {
    try {
        const userPoint = await GamePoints.findOne({ guildId, userId }).lean() as any;
        if (!userPoint || userPoint.totalPoints <= 0) return { rank: 0, total: 0 };

        const rank = await GamePoints.countDocuments({
            guildId,
            totalPoints: { $gt: userPoint.totalPoints }
        }) + 1; // +1 because count returns number of people better than user

        const total = await GamePoints.countDocuments({ guildId, totalPoints: { $gt: 0 } });

        return { rank, total };
    } catch (error) {
        console.error(`❌ Error fetching rank for ${userId}:`, error);
        return { rank: 0, total: 0 };
    }
}

/**
 * Get points filtered by specific game (sambung_kata, quiz, guess_map)
 */
export async function getPointsByGame(guildId: string, userId: string, gameName: string): Promise<PointsByGameResult> {
    try {
        const userStats = await GamePoints.findOne({ guildId, userId }).lean() as any;
        if (!userStats) return { totalFromGame: 0, historyCount: 0, history: [] };

        const history: PointsHistoryItem[] = userStats.pointsHistory.filter((h: any) => h.game === gameName);
        const totalFromGame = history.reduce((sum, record) => sum + record.points, 0);

        return {
            totalFromGame,
            historyCount: history.length,
            history
        };
    } catch (error) {
        console.error(`❌ Error fetching points for game ${gameName}:`, error);
        return { totalFromGame: 0, historyCount: 0, history: [] };
    }
}

/**
 * Get stats specific to Sambung Kata only
 */
export async function getSambungKataStats(guildId: string, userId: string): Promise<SambungKataStatsResult | null> {
    try {
        const userStats = await GamePoints.findOne({ guildId, userId }).lean() as any;
        if (!userStats) {
            return { totalPoints: 0, gamesFromSK: 0, winsFromSK: 0, avgPoints: 0, bestGame: 0, historyCount: 0 };
        }

        const history = userStats.pointsHistory.filter((h: any) => h.game === 'sambung_kata');
        const gamesFromSK = history.length;
        const totalPoints = history.reduce((sum: number, h: any) => sum + h.points, 0);
        const avgPoints = gamesFromSK > 0 ? (totalPoints / gamesFromSK).toFixed(1) : 0;
        const bestGame = gamesFromSK > 0 ? Math.max(...history.map((h: any) => h.points)) : 0;

        // Asumsi "winsFromSK" dalam konteks history mungkin sulit dibedakan kecuali dari reason.
        // Kita hitung dari reason yg mencirikan winner jika ada, atau kita ambil dari Player.js external.
        const winsFromSK = history.filter((h: any) => h.reason && h.reason.includes('Winner')).length || 0;

        return { totalPoints, gamesFromSK, winsFromSK, avgPoints, bestGame, historyCount: gamesFromSK };
    } catch (error) {
        console.error(`❌ Error fetching Sambung Kata specific stats:`, error);
        return null;
    }
}
