import SambungKataGame from './SambungKataGame.js';

class GameManager {
    constructor() {
        this.activeGames = new Map(); // key: guildId_channelId
    }

    createGame(guild, channel, host, level) {
        const key = `${guild.id}_${channel.id}`;

        if (this.activeGames.has(key)) {
            return null; // Game already in progress in this channel
        }

        const game = new SambungKataGame(guild.id, channel.id, host, level);
        this.activeGames.set(key, game);
        return game;
    }

    getGame(guildId, channelId) {
        return this.activeGames.get(`${guildId}_${channelId}`) || null;
    }

    endGame(guildId, channelId) {
        const key = `${guildId}_${channelId}`;
        this.activeGames.delete(key);
    }

    isUserInGame(userId, guildId) {
        for (const game of this.activeGames.values()) {
            if (game.guildId === guildId && game.players.has(userId)) {
                return true;
            }
        }
        return false;
    }

    getActiveGameCount() {
        return this.activeGames.size;
    }
}

const gameManager = new GameManager();

export default gameManager;
