import mongoose, { Document, Model, Schema } from 'mongoose';

export interface PointsHistoryItem {
    game: string;
    points: number;
    reason: string;
    earnedAt?: Date;
}

export interface IGamePoints extends Document {
    guildId: string;
    userId: string;
    username: string;
    totalPoints: number;
    weeklyPoints: number;
    monthlyPoints: number;
    pointsHistory: PointsHistoryItem[];
    gamesPlayed: number;
    gamesWon: number;
    currentStreak: number;
    longestStreak: number;
    lastPlayedAt?: Date;
    lastDailyAt?: Date;
}

// ⚠️ Schema ini IDENTIK dengan GamePoints.ts dari bot
// Academy-Drix-Valorant. Jangan ubah field apapun!
const GamePointsSchema = new Schema<IGamePoints>({
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

const GamePoints: Model<IGamePoints> = mongoose.models.GamePoints || mongoose.model<IGamePoints>('GamePoints', GamePointsSchema);

export default GamePoints;
