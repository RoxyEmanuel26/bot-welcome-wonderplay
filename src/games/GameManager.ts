import { Guild, TextChannel, User, GuildMember } from 'discord.js';
import SambungKataGame from './SambungKataGame.js';

class GameManager {
    public activeGames: Map<string, SambungKataGame>;

    public guildId: string;

    constructor() {
        this.activeGames = new Map(); // key: guildId_channelId
    }

    createGame(guild: Guild, channel: TextChannel, host: GuildMember, level: number): SambungKataGame | null {
        const key = `${guild.id}_${channel.id}`;

        if (this.activeGames.has(key)) {
            return null; // Game already in progress in this channel
        }

        const game = new SambungKataGame(guild.id, channel.id, host, level);
        this.activeGames.set(key, game);
        return game;
    }

    getGame(guildId: string, channelId: string): SambungKataGame | null {
        return this.activeGames.get(`${guildId}_${channelId}`) || null;
    }

    endGame(guildId: string, channelId: string): void {
        const key = `${guildId}_${channelId}`;
        this.activeGames.delete(key);
    }

    isUserInGame(userId: string, guildId: string): boolean {
        for (const game of this.activeGames.values()) {
            // Note: Property 'players' is private/protected depending on implementation.
            // Assuming it's accessible or we have a getter. If not, we'll need to update SambungKataGame.ts later.
            // Using logic: game.players.has(userId) from original JS
            if (game.guildId === guildId && (game as any).players.has(userId)) {
                return true;
            }
        }
        return false;
    }

    getActiveGameCount(): number {
        return this.activeGames.size;
    }
}

const gameManager = new GameManager();

export default gameManager;
