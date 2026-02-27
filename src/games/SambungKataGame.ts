import { v4 as uuidv4 } from 'uuid';
import { ThreadAutoArchiveDuration, GuildMember, TextChannel, Message, ThreadChannel } from 'discord.js';
import { validateWord, getRandomStartWord, getWordSuffix, checkWordPrefix } from '../utils/kbbiAPI.js';
import { calculatePoint } from '../utils/pointCalculator.js';
import { getLengthFeedback, LevelConfig, LEVELS } from './LevelConfig.js';
import { createLobbyEmbed, createTurnEmbed, createCorrectEmbed, createWrongEmbed, createEliminatedEmbed, createGameEndEmbed } from '../utils/embedBuilder.js';
import { addSambungKataPoints } from '../utils/pointsManager.js';
import gameManager from './GameManager.js';
import GameHistory from '../database/models/GameHistory.js';
import Player from '../database/models/Player.js';

export interface PlayerState {
    member: GuildMember;
    points: number;
    lives: number;
    correct: number;
    wrong: number;
    streak: number;
    longestStreak: number;
    totalResponseTime: number;
    eliminated: boolean;
}

export default class SambungKataGame {
    public gameId: string;
    public guildId: string;
    public channelId: string;
    public hostId: string;
    public level: number;
    public levelConfig: LevelConfig;

    public players: Map<string, PlayerState>;
    private turnOrder: string[];
    private currentTurnIndex: number;
    private currentWord: string;
    private currentSuffixLength: number;
    private currentSuffix: string;
    private usedWords: Set<string>;

    public status: 'lobby' | 'playing' | 'ended';
    private lobbyMessage: Message | null;
    private thread: ThreadChannel | null;

    private turnStartTime: number;
    private turnTimer: NodeJS.Timeout | null;
    private lobbyTimer: NodeJS.Timeout | null;
    private startTime: Date;

    constructor(guildId: string, channelId: string, hostMember: GuildMember, level: number) {
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

    /**
     * Safely send a message to the game thread.
     * If the channel was deleted or is unavailable, gracefully end the game instead of crashing.
     */
    private async safeSend(options: any): Promise<Message | null> {
        if (!this.thread) return null;
        try {
            return await this.thread.send(options);
        } catch (error: any) {
            if (error?.code === 10003 || error?.code === 10008 || error?.status === 404) {
                console.error(`⚠️ Game ${this.gameId}: Channel/Thread tidak ditemukan. Mengakhiri game secara otomatis.`);
                this.thread = null;
                if (this.turnTimer) clearTimeout(this.turnTimer);
                if (this.lobbyTimer) clearTimeout(this.lobbyTimer);
                this.status = 'ended';
                gameManager.endGame(this.guildId, this.channelId);
                return null;
            }
            console.error(`⚠️ Game ${this.gameId}: Error saat mengirim pesan:`, error.message);
            return null;
        }
    }

    private getLivesEmoji(userId: string): string {
        const player = this.players.get(userId);
        if (!player) return "";
        const maxLives = this.levelConfig.lives;
        const currentLives = player.lives;
        return '❤️'.repeat(currentLives) + '⬛'.repeat(maxLives - currentLives);
    }

    private getLiveScoreboard(): string {
        const sortedPlayers = Array.from(this.players.entries())
            .map(([id, p]) => ({ id, points: p.points, eliminated: p.eliminated }))
            .sort((a, b) => b.points - a.points);

        return sortedPlayers.slice(0, 3).map((p, i) => {
            const medal = ['🥇', '🥈', '🥉'][i];
            const strike = p.eliminated ? '~~' : '';
            return `${medal} ${strike}<@${p.id}>${strike}: ${p.points}pt`;
        }).join('\n');
    }

    public getAlivePlayers(): string[] {
        return Array.from(this.players.keys()).filter(id => !this.players.get(id)!.eliminated);
    }

    public addPlayer(member: GuildMember): boolean {
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

    public removePlayer(userId: string): void {
        if (this.status !== 'lobby') return;
        if (userId === this.hostId) return; // Host cannot strictly leave without canceling
        this.players.delete(userId);
    }

    public async startLobby(channel: TextChannel): Promise<void> {
        let timeLeft = 60;

        const updateLobby = async (): Promise<void> => {
            if (this.status !== 'lobby') return;

            const playersUsersList = Array.from(this.players.values()).map(p => p.member.user);
            const hostPlayer = this.players.get(this.hostId);
            if (!hostPlayer) return;

            const { embeds, components } = createLobbyEmbed(
                this.level, this.levelConfig.name, hostPlayer.member.user,
                this.levelConfig, playersUsersList, timeLeft
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

    public async startGame(channel: TextChannel): Promise<void> {
        if (this.status !== 'lobby') return;
        if (this.lobbyTimer) clearTimeout(this.lobbyTimer);
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

        await this.safeSend(`🚀 **GAME DIMULAI!**\nKata pertama kita adalah: **${this.currentWord.toUpperCase()}**\n\nSelamat bermain dan semoga beruntung!`);

        await this.prepareNextTurn();
    }

    /**
     * Start a rematch game reusing an existing thread.
     */
    public async startRematch(existingThread: ThreadChannel, parentChannel: TextChannel): Promise<void> {
        if (this.status !== 'lobby') return;
        if (this.lobbyTimer) clearTimeout(this.lobbyTimer);
        this.status = 'playing';

        // Shuffle player turn
        this.turnOrder = Array.from(this.players.keys()).sort(() => 0.5 - Math.random());
        this.currentTurnIndex = 0;

        // Reuse existing thread
        this.thread = existingThread;

        // Add all players to thread
        for (const userId of this.players.keys()) {
            await this.thread.members.add(userId).catch(() => { });
        }

        this.currentWord = getRandomStartWord(this.level);
        this.usedWords.add(this.currentWord);

        await this.safeSend(`🔄 **REMATCH! GAME DIMULAI!**\nKata pertama kita adalah: **${this.currentWord.toUpperCase()}**\n\nSelamat bermain dan semoga beruntung!`);

        await this.prepareNextTurn();
    }

    private async prepareNextTurn(): Promise<void> {
        if (this.status !== 'playing' || !this.thread) return;

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
            if (!this.players.get(nextUserId)!.eliminated) {
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
        if (!currentPlayer) return;

        this.currentSuffixLength = this.levelConfig.getSuffixCount();
        this.currentSuffix = getWordSuffix(this.currentWord, this.currentSuffixLength);

        const { content, embeds } = createTurnEmbed(
            currentPlayer.member.user,
            this.currentWord,
            this.currentSuffix,
            this.currentSuffixLength,
            this.levelConfig,
            this.getLivesEmoji(currentUserId),
            '',
            this.getLiveScoreboard(),
            Array.from(this.usedWords).slice(-20).join(', ') // Tampilkan 20 terakhir
        );

        await this.safeSend({ content, embeds });

        this.turnStartTime = Date.now();
        this.turnTimer = setTimeout(() => this.handleTimeout(currentUserId), this.levelConfig.timeLimit * 1000 + 1000); // 1s grace period
    }

    public async handleTimeout(userId: string): Promise<void> {
        if (this.status !== 'playing' || !this.thread) return;
        const currentId = this.turnOrder[this.currentTurnIndex];
        if (userId !== currentId) return; // Avoid race condition

        const player = this.players.get(userId);
        if (!player) return;

        player.wrong += 1;
        player.lives -= 1;
        player.streak = 0; // Reset streak

        if (player.lives <= 0) {
            await this.eliminatePlayer(userId);
        } else {
            // Give them another chance or just let it pass and let them retry...
            // Specification says: "JIKA WAKTU HABIS: Kurangi 1 nyawa, TIMEOUT embed, Auto lanjut ke giliran berikutnya"
            await this.safeSend(`⏱️ Waktu habis <@${userId}>! Kamu kehilangan 1 nyawa.\nSisa nyawa: ${this.getLivesEmoji(userId)}`);
        }

        await this.prepareNextTurn();
    }

    public async validateAnswer(message: Message): Promise<void> {
        if (this.status !== 'playing' || !this.thread) return;
        if (message.channel.id !== this.thread.id) return;

        const userId = message.author.id;
        const currentId = this.turnOrder[this.currentTurnIndex];

        // 1. Cek giliran
        if (userId !== currentId) return;

        if (this.turnTimer) clearTimeout(this.turnTimer);

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

        // 3. Cek apakah kata sudah dipakai
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
        await this.handleCorrect(userId, word, validation.definition || "Tidak ada definisi.");
    }

    private async handleWrong(userId: string, word: string, reason: string): Promise<void> {
        if (!this.thread) return;
        const player = this.players.get(userId);
        if (!player) return;

        player.wrong += 1;
        player.lives -= 1;
        player.streak = 0;

        if (player.lives <= 0) {
            await this.eliminatePlayer(userId);
            await this.prepareNextTurn();
        } else {
            const timeLeft = Math.max(0, Math.floor((this.levelConfig.timeLimit * 1000 - (Date.now() - this.turnStartTime)) / 1000));
            const { embeds } = createWrongEmbed(player.member.user, word, reason, this.getLivesEmoji(userId), timeLeft);
            await this.safeSend({ embeds });

            // Re-setup timer based on remaining time
            if (timeLeft > 0) {
                this.turnTimer = setTimeout(() => this.handleTimeout(userId), timeLeft * 1000 + 1000);
            } else {
                await this.handleTimeout(userId);
            }
        }
    }

    private async handleCorrect(userId: string, word: string, definition: string): Promise<void> {
        if (!this.thread) return;
        const responseTime = (Date.now() - this.turnStartTime) / 1000;
        const player = this.players.get(userId);
        if (!player) return;

        player.correct += 1;
        player.streak += 1;
        if (player.streak > player.longestStreak) {
            player.longestStreak = player.streak;
        }
        player.totalResponseTime += responseTime;

        // Calculate points
        const isStreak = player.streak >= 3;
        const isSpeed = responseTime <= (this.levelConfig.timeLimit * 0.2);
        const isComeback = player.wrong > 0 && player.streak === 1; // Simplification of comeback

        const pointData = calculatePoint(
            this.level,
            responseTime,
            this.levelConfig.timeLimit,
            word,
            { streak: isStreak ? player.streak : 0, isSpeed, isComeback }
        );

        player.points += pointData.total;

        this.usedWords.add(word);
        this.currentWord = word;

        const { embeds } = createCorrectEmbed(
            player.member.user,
            word,
            definition,
            pointData,
            player.points,
            getLengthFeedback(word.length) // passing the feedback string
        );

        await this.safeSend({ embeds });
        await this.prepareNextTurn();
    }

    public async eliminatePlayer(userId: string): Promise<void> {
        if (!this.thread) return;
        const player = this.players.get(userId);
        if (!player) return;

        player.eliminated = true;

        const aliveCount = this.getAlivePlayers().length;
        const remainingStr = aliveCount > 0
            ? `${aliveCount} pemain: ` + this.getAlivePlayers().map(id => `<@${id}>`).join(', ')
            : 'Tidak ada';

        const { embeds } = createEliminatedEmbed(player.member.user, player.points, player.correct, player.wrong, remainingStr);
        await this.safeSend({ embeds });
    }

    public async endGame(): Promise<void> {
        if (this.status === 'ended') return;
        if (this.turnTimer) clearTimeout(this.turnTimer);
        this.status = 'ended';

        const alivePlayers = this.getAlivePlayers();
        let winnerId: string | null = null;

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

        const ranking = sortedAll.map((p, i) => ({
            userId: p.member.id,
            username: p.member.user.username,
            points: p.points,
            correctAnswers: p.correct,
            wrongAnswers: p.wrong,
            avgResponseTime: p.correct > 0 ? p.totalResponseTime / p.correct : 0,
            eliminated: p.eliminated,
            longestStreak: p.longestStreak
        }));

        const { embeds, components } = createGameEndEmbed(
            this.level,
            this.levelConfig.name,
            winnerId ? { userId: winnerId } : null,
            ranking,
            statsStr
        );

        const endMsg = await this.safeSend({ content: "🏆 **PERMAINAN SELESAI!**", embeds, components });

        // Store rematch data for 10 seconds
        if (endMsg && this.thread) {
            gameManager.storeRematchData(endMsg.id, {
                hostId: this.hostId,
                level: this.level,
                playerIds: Array.from(this.players.keys()),
                guildId: this.guildId,
                channelId: this.channelId,
                threadId: this.thread.id
            });

            // Disable buttons after 10 seconds
            const msgRef = endMsg;
            setTimeout(async () => {
                try {
                    const disabledComponents = new (await import('discord.js')).ActionRowBuilder<any>().addComponents(
                        new (await import('discord.js')).ButtonBuilder().setLabel('🔄 REMATCH').setStyle(2).setCustomId('sk_rematch').setDisabled(true),
                        new (await import('discord.js')).ButtonBuilder().setLabel('📊 STATS').setStyle(2).setCustomId('sk_stats')
                    );
                    await msgRef.edit({ components: [disabledComponents] }).catch(() => { });
                } catch { }
            }, 10000);
        }

        await this.saveToDatabase(winnerId, ranking, totalDurationSec);

        gameManager.endGame(this.guildId, this.channelId);
    }

    private async saveToDatabase(winnerId: string | null, ranking: any[], durationSec: number): Promise<void> {
        try {
            // Save Game History
            const historyData = {
                gameId: this.gameId,
                guildId: this.guildId,
                channelId: this.channelId,
                hostId: this.hostId,
                level: this.level,
                players: ranking.map((p, i) => ({
                    ...p,
                    rank: i + 1,
                    longestStreak: p.longestStreak
                })),
                winnerId: winnerId,
                wordsUsed: Array.from(this.usedWords),
                totalRounds: this.usedWords.size,
                duration: durationSec,
                startedAt: this.startTime,
                endedAt: new Date()
            };
            await GameHistory.create(historyData);

            // Update Player Stats
            for (const [userId, stats] of this.players.entries()) {
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
            }

            // Save to shared database
            const savePromises = ranking.map((player, i) => {
                const rank = i + 1;
                const winnerBonus = rank === 1 ? 10 : 0;
                const totalPoints = player.points + winnerBonus;

                return addSambungKataPoints(
                    this.guildId,
                    player.userId,
                    player.username,
                    totalPoints,
                    {
                        level: this.level,
                        correctAnswers: player.correctAnswers,
                        wrongAnswers: player.wrongAnswers,
                        avgResponseTime: player.avgResponseTime,
                        bonuses: [] // Bonuses array, can get from game event log if stored. Using [] per spec snippet flexibility
                    },
                    rank === 1
                );
            });

            const saveResults = await Promise.allSettled(savePromises);
            const failed = saveResults.filter(r => r.status === 'rejected');

            if (failed.length > 0) {
                console.error(`❌ ${failed.length} player points failed to save`);
            }

            console.log(`✅ Game ${this.gameId} - Points saved to shared DB!`);

        } catch (error) {
            console.error('❌ Error saving game stats:', error);
        }
    }
}
