import mongoose, { Document, Model, Schema } from 'mongoose';

export interface LevelStats {
    games: number;
    wins: number;
    points: number;
    correct: number;
    wrong: number;
}

export interface IPlayer extends Document {
    userId: string;
    username: string;
    guildId: string;
    stats: {
        totalGames: number;
        totalWins: number;
        totalPoints: number;
        totalCorrect: number;
        totalWrong: number;
        avgResponseTime: number;
        fastestAnswer: number | null;
        longestStreak: number;
        byLevel: {
            "1": LevelStats;
            "2": LevelStats;
            "3": LevelStats;
            "4": LevelStats;
            "5": LevelStats;
        };
    };
    lastPlayed: Date;
    createdAt: Date;
}

const playerSchema = new Schema<IPlayer>({
    userId: { type: String, required: true, unique: true },
    username: { type: String },
    guildId: { type: String },
    stats: {
        totalGames: { type: Number, default: 0 },
        totalWins: { type: Number, default: 0 },
        totalPoints: { type: Number, default: 0 },
        totalCorrect: { type: Number, default: 0 },
        totalWrong: { type: Number, default: 0 },
        avgResponseTime: { type: Number, default: 0 },
        fastestAnswer: { type: Number, default: null },
        longestStreak: { type: Number, default: 0 },
        byLevel: {
            "1": { games: { type: Number, default: 0 }, wins: { type: Number, default: 0 }, points: { type: Number, default: 0 }, correct: { type: Number, default: 0 }, wrong: { type: Number, default: 0 } },
            "2": { games: { type: Number, default: 0 }, wins: { type: Number, default: 0 }, points: { type: Number, default: 0 }, correct: { type: Number, default: 0 }, wrong: { type: Number, default: 0 } },
            "3": { games: { type: Number, default: 0 }, wins: { type: Number, default: 0 }, points: { type: Number, default: 0 }, correct: { type: Number, default: 0 }, wrong: { type: Number, default: 0 } },
            "4": { games: { type: Number, default: 0 }, wins: { type: Number, default: 0 }, points: { type: Number, default: 0 }, correct: { type: Number, default: 0 }, wrong: { type: Number, default: 0 } },
            "5": { games: { type: Number, default: 0 }, wins: { type: Number, default: 0 }, points: { type: Number, default: 0 }, correct: { type: Number, default: 0 }, wrong: { type: Number, default: 0 } }
        }
    },
    lastPlayed: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

const Player: Model<IPlayer> = mongoose.models.Player || mongoose.model<IPlayer>('Player', playerSchema);

export default Player;
