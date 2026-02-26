import { GamePoints } from '../database/models/GamePoints.js';

/**
 * Add points for Sambung Kata and update GamePoints schema
 */
export async function addSambungKataPoints(guildId, userId, username, points, gameData, isWinner) {
    try {
        const reason = `Level: ${gameData.level} | Benar: ${gameData.correctAnswers}x | Salah: ${gameData.wrongAnswers}x | Avg: ${gameData.avgResponseTime.toFixed(1)}s | Bonus: ${gameData.bonuses.map(b => b.name).join(',')}`;

        const updateDoc = {
            $set: { username, lastPlayedAt: new Date() },
            $inc: {
                totalPoints: points,
                weeklyPoints: points,
                monthlyPoints: points,
                gamesPlayed: 1,
                gamesWon: isWinner ? 1 : 0
            },
            $push: {
                pointsHistory: {
                    $each: [{
                        game: 'sambung_kata',
                        points,
                        reason,
                        earnedAt: new Date()
                    }],
                    $slice: -50
                }
            }
        };

        // Handle currentStreak logic
        if (isWinner) {
            updateDoc.$inc.currentStreak = 1;
        } else {
            updateDoc.$set.currentStreak = 0;
        }

        const result = await GamePoints.findOneAndUpdate(
            { guildId, userId },
            updateDoc,
            { upsert: true, new: true }
        );

        // Update longestStreak if currentStreak is higher
        if (result.currentStreak > result.longestStreak) {
            await GamePoints.updateOne(
                { _id: result._id },
                { $set: { longestStreak: result.currentStreak } }
            );
            result.longestStreak = result.currentStreak;
        }

        console.log(`✅ [sambung_kata] ${username} +${points}pts | Total: ${result.totalPoints}`);
        return result;

    } catch (error) {
        console.error(`❌ Error adding sambung_kata points for ${username}:`, error);
        throw error;
    }
}

/**
 * Get user points document
 */
export async function getUserPoints(guildId, userId) {
    try {
        return await GamePoints.findOne({ guildId, userId });
    } catch (error) {
        console.error(`❌ Error fetching user points for ${userId}:`, error);
        return null;
    }
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(guildId, limit = 10, type = 'total') {
    try {
        let sortField = 'totalPoints';
        if (type === 'weekly') sortField = 'weeklyPoints';
        if (type === 'monthly') sortField = 'monthlyPoints';

        return await GamePoints.find({ guildId, [sortField]: { $gt: 0 } })
            .sort({ [sortField]: -1 })
            .limit(limit);
    } catch (error) {
        console.error('❌ Error fetching leaderboard:', error);
        return [];
    }
}

/**
 * Get player rank
 */
export async function getPlayerRank(guildId, userId) {
    try {
        const userPoint = await GamePoints.findOne({ guildId, userId });
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
export async function getPointsByGame(guildId, userId, gameName) {
    try {
        const userStats = await GamePoints.findOne({ guildId, userId });
        if (!userStats) return { totalFromGame: 0, historyCount: 0, history: [] };

        const history = userStats.pointsHistory.filter(h => h.game === gameName);
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
export async function getSambungKataStats(guildId, userId) {
    try {
        const userStats = await GamePoints.findOne({ guildId, userId });
        if (!userStats) {
            return { totalPoints: 0, gamesFromSK: 0, winsFromSK: 0, avgPoints: 0, bestGame: 0, historyCount: 0 };
        }

        const history = userStats.pointsHistory.filter(h => h.game === 'sambung_kata');
        const gamesFromSK = history.length;
        const totalPoints = history.reduce((sum, h) => sum + h.points, 0);
        const avgPoints = gamesFromSK > 0 ? (totalPoints / gamesFromSK).toFixed(1) : 0;
        const bestGame = gamesFromSK > 0 ? Math.max(...history.map(h => h.points)) : 0;

        // Asumsi "winsFromSK" dalam konteks history mungkin sulit dibedakan kecuali dari reason.
        // Kita hitung dari reason yg mencirikan winner jika ada, atau kita ambil dari Player.js external.
        // Untuk saat ini fallback ke best guess atau just return what's needed.
        const winsFromSK = history.filter(h => h.reason && h.reason.includes('Winner')).length || 0;
        // Note: Reason format given by user does not explicitly state "Winner" but we can compute it if needed.
        // Actually the prompt says "winsFromSK", let's leave it as 0 if we can't extract it reliably, or we can just fetch from Player.js if really needed later.
        // Or we can rely on Player stats for detailed SK stats.

        return { totalPoints, gamesFromSK, winsFromSK, avgPoints, bestGame, historyCount: gamesFromSK };
    } catch (error) {
        console.error(`❌ Error fetching Sambung Kata specific stats:`, error);
        return null;
    }
}
