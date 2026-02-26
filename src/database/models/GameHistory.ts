import mongoose, { Document, Model, Schema } from 'mongoose';

export interface GamePlayerHistory {
    userId: string;
    username: string;
    points: number;
    correctAnswers: number;
    wrongAnswers: number;
    avgResponseTime: number;
    longestStreak: number;
    eliminated: boolean;
    rank: number;
}

export interface IGameHistory extends Document {
    gameId: string;
    guildId: string;
    channelId: string;
    hostId: string;
    level: number;
    players: GamePlayerHistory[];
    winnerId: string | null;
    wordsUsed: string[];
    totalRounds: number;
    duration: number; // in seconds
    startedAt: Date;
    endedAt: Date;
}

const gameHistorySchema = new Schema<IGameHistory>({
    gameId: { type: String, required: true, unique: true },
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    hostId: { type: String, required: true },
    level: { type: Number, required: true },
    players: [{
        userId: { type: String },
        username: { type: String },
        points: { type: Number },
        correctAnswers: { type: Number },
        wrongAnswers: { type: Number },
        avgResponseTime: { type: Number },
        longestStreak: { type: Number },
        eliminated: { type: Boolean },
        rank: { type: Number }
    }],
    winnerId: { type: String },
    wordsUsed: [{ type: String }],
    totalRounds: { type: Number },
    duration: { type: Number }, // in seconds
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date }
});

const GameHistory: Model<IGameHistory> = mongoose.models.GameHistory || mongoose.model<IGameHistory>('GameHistory', gameHistorySchema);

export default GameHistory;
