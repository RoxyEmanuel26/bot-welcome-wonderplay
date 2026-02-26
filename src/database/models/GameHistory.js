import mongoose from 'mongoose';

const gameHistorySchema = new mongoose.Schema({
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

const GameHistory = mongoose.models.GameHistory || mongoose.model('GameHistory', gameHistorySchema);

export default GameHistory;
