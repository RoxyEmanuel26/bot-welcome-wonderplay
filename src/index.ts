// ═══════════════════════════════════════════════════════════════
// 🎮 WONDERPLAY WELCOME BOT - CLEAN ARCHITECTURE v3.5
// ═══════════════════════════════════════════════════════════════

import dotenv from 'dotenv';
dotenv.config({ path: './config/.env' });

import { Client, GatewayIntentBits, Partials, Collection, Interaction, Events } from 'discord.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';
import connectDB from './database/connection.js';

// Extend Client interface to include commands
declare module 'discord.js' {
    export interface Client {
        commands: Collection<string, any>;
        slashCommands: Collection<string, any>;
    }
}

const __dirname = dirname(fileURLToPath(import.meta.url));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.GuildMember, Partials.User, Partials.Message]
});

// Command collections
client.commands = new Collection();
client.slashCommands = new Collection();

// ═══════════════════════════════════════════════════════════════
// 📂 KONEKSI DATABASE
// ═══════════════════════════════════════════════════════════════

connectDB();

// ═══════════════════════════════════════════════════════════════
// 📂 LOAD COMMANDS (Prefix & Slash)
// ═══════════════════════════════════════════════════════════════

const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
const slashCommandsData: any[] = [];

for (const file of commandFiles) {
    const command = await import(`./commands/${file}`);
    const cmd = command.default;

    // Load prefix commands
    if (cmd.name && cmd.execute) {
        client.commands.set(cmd.name, cmd);

        if (cmd.aliases && Array.isArray(cmd.aliases)) {
            cmd.aliases.forEach((alias: string) => {
                client.commands.set(alias, cmd);
            });
        }
        // console.log(`✅ Loaded command: !${cmd.name}`);
    }

    // Load slash commands
    if (cmd.data) {
        client.slashCommands.set(cmd.data.name, cmd);
        slashCommandsData.push(cmd.data.toJSON());
        // console.log(`✅ Loaded slash command: /${cmd.data.name}`);
    }
}

// ═══════════════════════════════════════════════════════════════
// 📂 LOAD EVENTS
// ═══════════════════════════════════════════════════════════════

const eventsPath = join(__dirname, 'events');
const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

for (const file of eventFiles) {
    const event = await import(`./events/${file}`);
    const eventName = event.default.name || file.split('.')[0];

    if (event.default.once) {
        client.once(eventName, (...args) => event.default.execute(...args, client));
    } else {
        client.on(eventName, (...args) => event.default.execute(...args, client));
    }
    // console.log(`✅ Loaded event: ${eventName === 'ready' ? 'clientReady' : eventName.toString()}`);
}

// ═══════════════════════════════════════════════════════════════
// ⚡ SLASH COMMAND HANDLER
// ═══════════════════════════════════════════════════════════════

client.on('interactionCreate', async (interaction: Interaction) => {
    if (interaction.isButton()) {
        const customId = interaction.customId;

        if (customId === 'sk_start') {
            // Handler di-delegate ke lobby/game manager, tapi secara sederhana kita dapat menangani lewat interaction
            const activeGames = Array.from((await import('./games/GameManager.js')).default.activeGames.values());
            const game = (activeGames as any[]).find(g => g.lobbyMessage && g.lobbyMessage.id === interaction.message.id);
            if (game) {
                if (interaction.user.id !== game.hostId) {
                    return interaction.reply({ content: '❌ Hanya Host yang dapat memulai permainan!', ephemeral: true });
                }
                if (game.players.size < 2) {
                    return interaction.reply({ content: '❌ Minimal butuh 2 pemain untuk memulai!', ephemeral: true });
                }
                await interaction.deferUpdate();
                await game.startGame(interaction.channel);
            } else {
                return interaction.reply({ content: '❌ Game tidak ditemukan atau sudah dimulai/berakhir.', ephemeral: true });
            }
        } else if (customId === 'sk_cancel') {
            const activeGames = Array.from((await import('./games/GameManager.js')).default.activeGames.values());
            const game = (activeGames as any[]).find(g => g.lobbyMessage && g.lobbyMessage.id === interaction.message.id);
            if (game) {
                if (interaction.user.id !== game.hostId) {
                    return interaction.reply({ content: '❌ Hanya Host yang dapat membatalkan permainan!', ephemeral: true });
                }
                await interaction.deferUpdate();
                await interaction.message.edit({ components: [] });
                if (interaction.channel && 'send' in interaction.channel) {
                    await (interaction.channel as any).send('✅ Permainan Dibatalkan oleh Host.');
                }
                (await import('./games/GameManager.js')).default.endGame(game.guildId, game.channelId);
            } else {
                return interaction.reply({ content: '❌ Game tidak ditemukan atau sudah dibatalkan.', ephemeral: true });
            }
        } else if (customId === 'sk_stats') {
            // Show the user's stats via ephemeral reply
            await interaction.deferReply();
            try {
                const Player = (await import('./database/models/Player.js')).default;
                const { getUserPoints, getPlayerRank, getPointsByGame } = await import('./utils/pointsManager.js');
                const { EmbedBuilder } = await import('discord.js');

                const guildId = interaction.guildId!;
                const userId = interaction.user.id;

                const sharedPoints = await getUserPoints(guildId, userId);
                const rankInfo = await getPlayerRank(guildId, userId);
                const skStatsShared = await getPointsByGame(guildId, userId, 'sambung_kata');
                const playerStats = await Player.findOne({ userId });

                if (!sharedPoints && !playerStats) {
                    return interaction.editReply({ content: '❌ Belum ada data statistik untuk kamu.' });
                }

                const totalPts = sharedPoints ? sharedPoints.totalPoints : 0;
                const weeklyPts = sharedPoints ? sharedPoints.weeklyPoints : 0;
                const skPlayed = playerStats ? playerStats.stats.totalGames : 0;
                const skWins = playerStats ? playerStats.stats.totalWins : 0;
                const skCorrect = playerStats ? playerStats.stats.totalCorrect : 0;
                const skWrong = playerStats ? playerStats.stats.totalWrong : 0;

                const embed = new EmbedBuilder()
                    .setTitle(`📊 Stats Kamu — ${interaction.user.username}`)
                    .setColor('#00b0f4')
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .addFields(
                        { name: '💎 Total Points', value: `${totalPts} pt | Rank #${rankInfo && rankInfo.rank > 0 ? rankInfo.rank : '-'}`, inline: true },
                        { name: '📅 Weekly', value: `${weeklyPts} pt`, inline: true },
                        { name: '🎮 Sambung Kata', value: `Main: ${skPlayed} | Win: ${skWins}\n✅ Benar: ${skCorrect} | ❌ Salah: ${skWrong}`, inline: false },
                        { name: '🏆 SK Points', value: `${skStatsShared ? skStatsShared.totalFromGame : 0} pt`, inline: true }
                    )
                    .setFooter({ text: 'WonderPlay Bot • Statistik Pemain' })
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed] });
            } catch (error) {
                console.error('❌ Error loading stats button:', error);
                return interaction.editReply({ content: '❌ Gagal memuat statistik.' });
            }
        } else if (customId === 'sk_rematch') {
            // Auto-rematch using stored game data
            const gm = (await import('./games/GameManager.js')).default;
            const rematchInfo = gm.getRematchData(interaction.message.id);

            if (!rematchInfo) {
                return interaction.reply({ content: '⏱️ Waktu rematch sudah habis (10 detik). Silakan mulai game baru dengan `/sk` atau `!sk <level>`.', ephemeral: true });
            }

            // Only host can rematch
            if (interaction.user.id !== rematchInfo.hostId) {
                return interaction.reply({ content: `❌ Hanya Host (<@${rematchInfo.hostId}>) yang dapat memulai rematch!`, ephemeral: true });
            }

            await interaction.deferReply();
            try {
                const guild = interaction.guild;
                if (!guild) return interaction.editReply({ content: '❌ Guild tidak ditemukan.' });

                // Get parent channel and existing thread
                const parentChannel = await guild.channels.fetch(rematchInfo.channelId).catch(() => null) as any;
                const existingThread = await guild.channels.fetch(rematchInfo.threadId).catch(() => null) as any;

                if (!parentChannel || !existingThread) {
                    return interaction.editReply({ content: '❌ Channel atau thread tidak ditemukan.' });
                }

                // Check if there's already an active game
                const existingGame = gm.getGame(guild.id, parentChannel.id);
                if (existingGame) {
                    return interaction.editReply({ content: '❌ Sudah ada game aktif di channel tersebut!' });
                }

                // Get host member
                const hostMember = await guild.members.fetch(rematchInfo.hostId).catch(() => null);
                if (!hostMember) return interaction.editReply({ content: '❌ Host tidak ditemukan di server.' });

                // Create new game
                const newGame = gm.createGame(guild, parentChannel, hostMember, rematchInfo.level);
                if (!newGame) {
                    return interaction.editReply({ content: '❌ Gagal membuat game baru.' });
                }

                // Add all previous players
                for (const playerId of rematchInfo.playerIds) {
                    if (playerId === hostMember.id) continue;
                    const member = await guild.members.fetch(playerId).catch(() => null);
                    if (member) {
                        newGame.addPlayer(member);
                    }
                }

                if (newGame.players.size < 2) {
                    gm.endGame(guild.id, parentChannel.id);
                    return interaction.editReply({ content: '❌ Minimal 2 pemain untuk rematch! Pemain sebelumnya mungkin sudah tidak ada di server.' });
                }

                // Remove rematch data so button can't be clicked again
                gm.rematchData.delete(interaction.message.id);

                // Disable the rematch button on the old message
                const { ActionRowBuilder, ButtonBuilder } = await import('discord.js');
                const disabledRow = new ActionRowBuilder<any>().addComponents(
                    new ButtonBuilder().setLabel('🔄 REMATCH').setStyle(2).setCustomId('sk_rematch').setDisabled(true),
                    new ButtonBuilder().setLabel('📊 STATS').setStyle(2).setCustomId('sk_stats')
                );
                await interaction.message.edit({ components: [disabledRow] }).catch(() => { });

                const playerList = Array.from(newGame.players.values()).map(p => `<@${p.member.id}>`).join(', ');
                await interaction.editReply({
                    content: `🔄 **REMATCH!** Level ${rematchInfo.level} dimulai ulang!\n👥 Pemain: ${playerList}\n\n⏳ Memulai game...`
                });

                // Start rematch in the same thread
                await newGame.startRematch(existingThread, parentChannel);

            } catch (error) {
                console.error('❌ Error rematch:', error);
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ content: '❌ Terjadi error saat memulai rematch.' }).catch(() => { });
                }
            }
        }
        return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = client.slashCommands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction, [], client);
    } catch (error) {
        console.error(`❌ Error executing /${interaction.commandName}:`, error);

        const errorMessage = { content: '❌ Terjadi error saat menjalankan command!', ephemeral: true };

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
        } else {
            await interaction.reply(errorMessage);
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// 🚀 BOT READY & REGISTER SLASH COMMANDS
// ═══════════════════════════════════════════════════════════════

client.once(Events.ClientReady, async () => {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`✅ Bot online sebagai ${client.user?.tag || 'Unknown'}`);
    console.log(`📊 Loaded ${client.commands.size} prefix commands`);
    console.log(`📊 Loaded ${client.slashCommands.size} slash commands`);
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('ℹ️  Slash commands tidak di-register otomatis.');
    console.log('ℹ️  Jalankan: npx ts-node src/deploy-commands.ts (jika ada command baru)\n');
});

// ═══════════════════════════════════════════════════════════════
// 🔐 LOGIN
// ═══════════════════════════════════════════════════════════════

client.login(process.env.DISCORD_TOKEN);

// ═══════════════════════════════════════════════════════════════
// 🛑 GRACEFUL SHUTDOWN
// ═══════════════════════════════════════════════════════════════

async function shutdown() {
    console.log('\n🛑 Terdeteksi sinyal shutdown! Membersihkan sesi game yang sedang aktif...');
    try {
        const gameManager = (await import('./games/GameManager.js')).default;
        await gameManager.shutdownAllGames();
    } catch (err) {
        console.error('❌ Error saat pembersihan:', err);
    }
    console.log('🔌 Menutup koneksi Discord API...');
    client.destroy();
    console.log('👋 Bot berhasil dimatikan.');
    process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
