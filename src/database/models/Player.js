import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
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
            1: { games: { type: Number, default: 0 }, wins: { type: Number, default: 0 }, points: { type: Number, default: 0 }, correct: { type: Number, default: 0 }, wrong: { type: Number, default: 0 } },
            2: { games: { type: Number, default: 0 }, wins: { type: Number, default: 0 }, points: { type: Number, default: 0 }, correct: { type: Number, default: 0 }, wrong: { type: Number, default: 0 } },
            3: { games: { type: Number, default: 0 }, wins: { type: Number, default: 0 }, points: { type: Number, default: 0 }, correct: { type: Number, default: 0 }, wrong: { type: Number, default: 0 } },
            4: { games: { type: Number, default: 0 }, wins: { type: Number, default: 0 }, points: { type: Number, default: 0 }, correct: { type: Number, default: 0 }, wrong: { type: Number, default: 0 } },
            5: { games: { type: Number, default: 0 }, wins: { type: Number, default: 0 }, points: { type: Number, default: 0 }, correct: { type: Number, default: 0 }, wrong: { type: Number, default: 0 } }
        }
    },
    lastPlayed: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

const Player = mongoose.models.Player || mongoose.model('Player', playerSchema);

export default Player;
