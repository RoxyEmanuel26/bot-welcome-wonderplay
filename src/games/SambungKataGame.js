import { v4 as uuidv4 } from 'uuid';
import { ThreadAutoArchiveDuration } from 'discord.js';
import { validateWord, getRandomStartWord, getWordSuffix, checkWordPrefix } from '../utils/kbbiAPI.js';
import { calculatePoint, calculateTotalPoints } from '../utils/pointCalculator.js';
import { createLobbyEmbed, createTurnEmbed, createCorrectEmbed, createWrongEmbed, createEliminatedEmbed, createGameEndEmbed } from '../utils/embedBuilder.js';
import gameManager from './GameManager.js';
import GameHistory from '../database/models/GameHistory.js';
import Player from '../database/models/Player.js';
import { LEVELS } from './LevelConfig.js';

export default class SambungKataGame {
    constructor(guildId, channelId, hostMember, level) {
        this.gameId = uuidv4();
        this.guildId = guildId;
        this.channelId = channelId;
        this.hostId = hostMember.id;
        this.level = level;
        this.levelConfig = LEVELS[level];

        this.players = new Map();
        this.players.set(hostMember.id, {
            member: hostMember,
            points: 0,
            lives: this.levelConfig.lives,
            correct: 0,
            wrong: 0,
            streak: 0,
            longestStreak: 0,
            totalResponseTime: 0,
            eliminated: false
        });

        this.turnOrder = [];
        this.currentTurnIndex = 0;
        this.currentWord = "";
        this.currentSuffixLength = 0;
        this.currentSuffix = "";
        this.usedWords = new Set();

        this.status = 'lobby'; // 'lobby' | 'playing' | 'ended'
        this.lobbyMessage = null;
        this.thread = null;

        this.turnStartTime = 0;
        this.turnTimer = null;
        this.lobbyTimer = null;
        this.startTime = new Date();
    }

    getLivesEmoji(userId) {
        const player = this.players.get(userId);
        if (!player) return "";
        const maxLives = this.levelConfig.lives;
        const currentLives = player.lives;
        return '❤️'.repeat(currentLives) + '⬛'.repeat(maxLives - currentLives);
    }

    getLiveScoreboard() {
        const sortedPlayers = Array.from(this.players.entries())
            .map(([id, p]) => ({ id, points: p.points, eliminated: p.eliminated }))
            .sort((a, b) => b.points - a.points);

        return sortedPlayers.slice(0, 3).map((p, i) => {
            const medal = ['🥇', '🥈', '🥉'][i];
            const strike = p.eliminated ? '~~' : '';
            return `${medal} ${strike}<@${p.id}>${strike}: ${p.points}pt`;
        }).join('\n');
    }

    getAlivePlayers() {
        return Array.from(this.players.keys()).filter(id => !this.players.get(id).eliminated);
    }

    addPlayer(member) {
        if (this.status !== 'lobby') return false;
        if (this.players.size >= 10) return false;
        if (this.players.has(member.id)) return false;

        this.players.set(member.id, {
            member,
            points: 0,
            lives: this.levelConfig.lives,
            correct: 0,
            wrong: 0,
            streak: 0,
            longestStreak: 0,
            totalResponseTime: 0,
            eliminated: false
        });
        return true;
    }

    removePlayer(userId) {
        if (this.status !== 'lobby') return;
        if (userId === this.hostId) return; // Host cannot strictly leave without canceling
        this.players.delete(userId);
    }

    async startLobby(channel) {
        let timeLeft = 60;

        const updateLobby = async () => {
            if (this.status !== 'lobby') return;

            const playersList = Array.from(this.players.values()).map(p => p.member);
            const { embeds, components } = createLobbyEmbed(
                this.level, this.levelConfig.name, this.players.get(this.hostId).member,
                this.levelConfig, playersList, timeLeft
            );

            if (!this.lobbyMessage) {
                this.lobbyMessage = await channel.send({ embeds, components });
            } else {
                await this.lobbyMessage.edit({ embeds, components }).catch(() => { });
            }

            if (timeLeft <= 0) {
                if (this.players.size >= 2) {
                    await this.startGame(channel);
                } else {
                    await channel.send("❌ Game batal karena kurang pemain (minimal 2).");
                    gameManager.endGame(this.guildId, this.channelId);
                }
            } else {
                timeLeft -= 10;
                this.lobbyTimer = setTimeout(() => updateLobby(), 10000);
            }
        };

        await updateLobby();
    }

    async startGame(channel) {
        if (this.status !== 'lobby') return;
        clearTimeout(this.lobbyTimer);
        this.status = 'playing';

        // Shuffle player turn
        this.turnOrder = Array.from(this.players.keys()).sort(() => 0.5 - Math.random());
        this.currentTurnIndex = 0;

        // Create thread
        this.thread = await channel.threads.create({
            name: `🎮 Sambung Kata Level ${this.level} - ${Date.now()}`,
            autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
            reason: 'WonderPlay Sambung Kata Game Thread'
        });

        // Add all players to thread
        for (const userId of this.players.keys()) {
            await this.thread.members.add(userId).catch(() => { });
        }

        this.currentWord = getRandomStartWord(this.level);
        this.usedWords.add(this.currentWord);

        await this.thread.send(`🚀 **GAME DIMULAI!**\nKata pertama kita adalah: **${this.currentWord.toUpperCase()}**\n\nSelamat bermain dan semoga beruntung!`);

        await this.prepareNextTurn();
    }

    async prepareNextTurn() {
        if (this.status !== 'playing') return;

        const alivePlayers = this.getAlivePlayers();
        if (alivePlayers.length <= 1) {
            await this.endGame();
            return;
        }

        // Cari pemain berikutnya yang masih hidup
        let found = false;
        let startIndex = this.currentTurnIndex;
        do {
            this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;
            const nextUserId = this.turnOrder[this.currentTurnIndex];
            if (!this.players.get(nextUserId).eliminated) {
                found = true;
                break;
            }
        } while (this.currentTurnIndex !== startIndex);

        if (!found) {
            await this.endGame();
            return;
        }

        const currentUserId = this.turnOrder[this.currentTurnIndex];
        const currentPlayer = this.players.get(currentUserId);

        this.currentSuffixLength = this.levelConfig.getSuffixCount();
        this.currentSuffix = getWordSuffix(this.currentWord, this.currentSuffixLength);

        const { content, embeds } = createTurnEmbed(
            currentPlayer.member.user,
            this.currentWord,
            this.currentSuffix,
            this.currentSuffixLength,
            this.levelConfig,
            this.getLivesEmoji(currentUserId),
            null,
            this.getLiveScoreboard(),
            Array.from(this.usedWords).slice(-5).join(', ') // Tampilkan 5 terakhir
        );

        await this.thread.send({ content, embeds });

        this.turnStartTime = Date.now();
        this.turnTimer = setTimeout(() => this.handleTimeout(currentUserId), this.levelConfig.timeLimit * 1000 + 1000); // 1s grace period
    }

    async handleTimeout(userId) {
        if (this.status !== 'playing') return;
        const currentId = this.turnOrder[this.currentTurnIndex];
        if (userId !== currentId) return; // Avoid race condition

        const player = this.players.get(userId);
        player.wrong += 1;
        player.lives -= 1;
        player.streak = 0; // Reset streak

        if (player.lives <= 0) {
            await this.eliminatePlayer(userId);
        } else {
            // Give them another chance or just let it pass and let them retry...
            // Specification says: "JIKA WAKTU HABIS: Kurangi 1 nyawa, TIMEOUT embed, Auto lanjut ke giliran berikutnya"
            await this.thread.send(`⏱️ Waktu habis <@${userId}>! Kamu kehilangan 1 nyawa.\nSisa nyawa: ${this.getLivesEmoji(userId)}`);
        }

        await this.prepareNextTurn();
    }

    async validateAnswer(message) {
        if (this.status !== 'playing') return;
        if (message.channel.id !== this.thread.id) return;

        const userId = message.author.id;
        const currentId = this.turnOrder[this.currentTurnIndex];

        // 1. Cek giliran
        if (userId !== currentId) return;

        clearTimeout(this.turnTimer);

        const word = message.content.trim().toLowerCase();

        // Cek spasi
        if (word.includes(' ')) {
            await this.handleWrong(userId, word, "Hanya boleh 1 kata!");
            return;
        }

        // 2. Cek apakah kata diawali dengan suffix yang benar
        if (!checkWordPrefix(word, this.currentSuffix)) {
            await this.handleWrong(userId, word, `Kata harus diawali huruf **${this.currentSuffix.toUpperCase()}**`);
            return;
        }

        // 3. Cek panjang kata
        if (word.length < this.levelConfig.minWordLength) {
            await this.handleWrong(userId, word, `Minimal panjang kata untuk level ini adalah ${this.levelConfig.minWordLength} huruf`);
            return;
        }

        // 4. Cek apakah kata sudah dipakai
        if (this.usedWords.has(word)) {
            await this.handleWrong(userId, word, "Kata ini sudah digunakan dalam game ini!");
            return;
        }

        // 5. Validasi KBBI
        const validation = await validateWord(word);
        if (!validation.valid) {
            await this.handleWrong(userId, word, "Kata tidak ditemukan di dalam KBBI.");
            return;
        }

        // JikA BENAR
        await this.handleCorrect(userId, word, validation.definition);
    }

    async handleWrong(userId, word, reason) {
        const player = this.players.get(userId);
        player.wrong += 1;
        player.lives -= 1;
        player.streak = 0;

        if (player.lives <= 0) {
            await this.eliminatePlayer(userId);
            await this.prepareNextTurn();
        } else {
            const timeLeft = Math.max(0, Math.floor((this.levelConfig.timeLimit * 1000 - (Date.now() - this.turnStartTime)) / 1000));
            const { embeds } = createWrongEmbed(player.member.user, word, reason, this.getLivesEmoji(userId), timeLeft);
            await this.thread.send({ embeds });

            // Re-setup timer based on remaining time
            if (timeLeft > 0) {
                this.turnTimer = setTimeout(() => this.handleTimeout(userId), timeLeft * 1000 + 1000);
            } else {
                await this.handleTimeout(userId);
            }
        }
    }

    async handleCorrect(userId, word, definition) {
        const responseTime = (Date.now() - this.turnStartTime) / 1000;
        const player = this.players.get(userId);

        player.correct += 1;
        player.streak += 1;
        if (player.streak > player.longestStreak) {
            player.longestStreak = player.streak;
        }
        player.totalResponseTime += responseTime;

        // Calculate points
        const basePoint = calculatePoint(this.level, responseTime, this.levelConfig.timeLimit);

        const isStreak = player.streak >= 3;
        const isSpeed = responseTime <= (this.levelConfig.timeLimit * 0.2);
        const isComeback = player.wrong > 0 && player.streak === 1; // Simplification of comeback
        const isRareWord = word.length >= 8;

        const { total, bonuses } = calculateTotalPoints(basePoint, isStreak, isSpeed, isComeback, isRareWord);
        player.points += total;

        this.usedWords.add(word);
        this.currentWord = word;

        const { embeds } = createCorrectEmbed(
            player.member.user,
            word,
            responseTime.toFixed(1),
            definition,
            total,
            player.points,
            bonuses
        );

        await this.thread.send({ embeds });
        await this.prepareNextTurn();
    }

    async eliminatePlayer(userId) {
        const player = this.players.get(userId);
        player.eliminated = true;

        const aliveCount = this.getAlivePlayers().length;
        const remainingStr = aliveCount > 0
            ? `${aliveCount} pemain: ` + this.getAlivePlayers().map(id => `<@${id}>`).join(', ')
            : 'Tidak ada';

        const { embeds } = createEliminatedEmbed(player.member.user, player.points, player.correct, player.wrong, remainingStr);
        await this.thread.send({ embeds });
    }

    async endGame() {
        if (this.status === 'ended') return;
        clearTimeout(this.turnTimer);
        this.status = 'ended';

        const alivePlayers = this.getAlivePlayers();
        let winnerId = null;

        // Tentukan Pemenang (Pemain yang masih hidup dan poin tertinggi, atau 1 yang tersisa)
        const sortedAll = Array.from(this.players.values()).sort((a, b) => b.points - a.points);
        if (alivePlayers.length === 1) {
            winnerId = alivePlayers[0];
        } else if (alivePlayers.length > 1) {
            // Point tertinggi dari alive players
            winnerId = sortedAll.find(p => !p.eliminated)?.member.id || null;
        }

        const totalDurationSec = Math.floor((Date.now() - this.startTime.getTime()) / 1000);
        const totalMins = Math.floor(totalDurationSec / 60);
        const rmSecs = totalDurationSec % 60;

        const statsStr = `Kata dipakai: ${this.usedWords.size} | Durasi: ${totalMins}m ${rmSecs}s | Level: ${this.level}`;

        const ranking = sortedAll.map(p => ({
            userId: p.member.id,
            username: p.member.user.username,
            points: p.points,
            correctAnswers: p.correct,
            wrongAnswers: p.wrong,
            avgResponseTime: p.correct > 0 ? p.totalResponseTime / p.correct : 0,
            eliminated: p.eliminated
        }));

        const { embeds, components } = createGameEndEmbed(
            this.level,
            this.levelConfig.name,
            winnerId ? { userId: winnerId } : null,
            ranking,
            statsStr
        );

        await this.thread.send({ content: "🏆 **PERMAINAN SELESAI!**", embeds, components });

        await this.saveToDatabase(winnerId, ranking, totalDurationSec);

        gameManager.endGame(this.guildId, this.channelId);
    }

    async saveToDatabase(winnerId, ranking, durationSec) {
        try {
            // Save Game History
            await GameHistory.create({
                gameId: this.gameId,
                guildId: this.guildId,
                channelId: this.channelId,
                hostId: this.hostId,
                level: this.level,
                players: ranking.map((p, i) => ({
                    ...p,
                    rank: i + 1,
                    longestStreak: this.players.get(p.userId).longestStreak
                })),
                winnerId: winnerId,
                wordsUsed: Array.from(this.usedWords),
                totalRounds: this.usedWords.size,
                duration: durationSec,
                startedAt: this.startTime,
                endedAt: new Date()
            });

            // Update Player Stats
            for (const [userId, stats] of this.players.entries()) {
                const avgResp = stats.correct > 0 ? stats.totalResponseTime / stats.correct : 0;
                const isWinner = userId === winnerId;

                await Player.findOneAndUpdate(
                    { userId },
                    {
                        $setOnInsert: { username: stats.member.user.username, guildId: this.guildId },
                        $inc: {
                            'stats.totalGames': 1,
                            'stats.totalWins': isWinner ? 1 : 0,
                            'stats.totalPoints': stats.points,
                            'stats.totalCorrect': stats.correct,
                            'stats.totalWrong': stats.wrong,
                            [`stats.byLevel.${this.level}.games`]: 1,
                            [`stats.byLevel.${this.level}.wins`]: isWinner ? 1 : 0,
                            [`stats.byLevel.${this.level}.points`]: stats.points,
                            [`stats.byLevel.${this.level}.correct`]: stats.correct,
                            [`stats.byLevel.${this.level}.wrong`]: stats.wrong
                        },
                        $set: { lastPlayed: new Date() },
                        $max: {
                            'stats.longestStreak': stats.longestStreak
                        }
                    },
                    { upsert: true }
                );

                // For avgResponseTime, we need a slight workaround to update a moving average or just store the most recent.
                // Or pull and compute... since it's just general info, we update it via a find then save if necessary,
                // but for now keeping it simple. We can use $set or skip it inside $inc to avoid complex moving average code.
                /* We could do an aggregation pipeline update if needed. */
            }
        } catch (error) {
            console.error('❌ Error saving game stats:', error);
        }
    }
}
