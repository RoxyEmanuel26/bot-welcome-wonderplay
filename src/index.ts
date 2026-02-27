// ═══════════════════════════════════════════════════════════════
// 🎮 WONDERPLAY WELCOME BOT - CLEAN ARCHITECTURE v3.5
// ═══════════════════════════════════════════════════════════════

import dotenv from 'dotenv';
dotenv.config({ path: './config/.env' });

import { Client, GatewayIntentBits, Partials, Collection, REST, Routes, Interaction, ChatInputCommandInteraction, ButtonInteraction } from 'discord.js';
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
        console.log(`✅ Loaded command: !${cmd.name}`);
    }

    // Load slash commands
    if (cmd.data) {
        client.slashCommands.set(cmd.data.name, cmd);
        slashCommandsData.push(cmd.data.toJSON());
        console.log(`✅ Loaded slash command: /${cmd.data.name}`);
    }
}

// ═══════════════════════════════════════════════════════════════
// 📂 LOAD EVENTS
// ═══════════════════════════════════════════════════════════════

const eventsPath = join(__dirname, 'events');
const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

for (const file of eventFiles) {
    const event = await import(`./events/${file}`);
    const eventName = file.split('.')[0];

    if (event.default.once) {
        client.once(eventName, (...args) => event.default.execute(...args, client));
    } else {
        client.on(eventName, (...args) => event.default.execute(...args, client));
    }
    console.log(`✅ Loaded event: ${eventName}`);
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

client.once('ready', async () => {
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
