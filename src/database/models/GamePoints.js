import mongoose from 'mongoose';

// ⚠️ Schema ini IDENTIK dengan GamePoints.ts dari bot
// Academy-Drix-Valorant. Jangan ubah field apapun!
const GamePointsSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    username: { type: String, required: true },
    totalPoints: { type: Number, default: 0 },
    weeklyPoints: { type: Number, default: 0 },
    monthlyPoints: { type: Number, default: 0 },
    pointsHistory: [{
        game: { type: String, required: true },
        points: { type: Number, required: true },
        reason: { type: String, required: true },
        earnedAt: { type: Date, default: Date.now }
    }],
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastPlayedAt: { type: Date, default: null },
    lastDailyAt: { type: Date, default: null }
}, { timestamps: true });

GamePointsSchema.index({ guildId: 1, userId: 1 }, { unique: true });
GamePointsSchema.index({ guildId: 1, totalPoints: -1 });
GamePointsSchema.index({ guildId: 1, weeklyPoints: -1 });
GamePointsSchema.index({ guildId: 1, monthlyPoints: -1 });

export const GamePoints = mongoose.model('GamePoints', GamePointsSchema);
