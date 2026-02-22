// ═══════════════════════════════════════════════════════════════
// 🎮 WONDERPLAY WELCOME BOT - CLEAN ARCHITECTURE v3.5
// ═══════════════════════════════════════════════════════════════

import dotenv from 'dotenv';
dotenv.config({ path: './config/.env' });

import { Client, GatewayIntentBits, Partials, Collection, REST, Routes } from 'discord.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';

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
// 📂 LOAD COMMANDS (Prefix & Slash)
// ═══════════════════════════════════════════════════════════════

const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
const slashCommandsData = [];

for (const file of commandFiles) {
    const command = await import(`./commands/${file}`);
    const cmd = command.default;
    
    // Load prefix commands (semua command dengan name & execute)
    if (cmd.name && cmd.execute) {
        client.commands.set(cmd.name, cmd);
        
        // Load aliases juga
        if (cmd.aliases && Array.isArray(cmd.aliases)) {
            cmd.aliases.forEach(alias => {
                client.commands.set(alias, cmd);
            });
        }
        
        console.log(`✅ Loaded command: !${cmd.name}`);
    }
    
    // Load slash commands (command dengan data property)
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
const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'));

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

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    const command = client.slashCommands.get(interaction.commandName);
    
    if (!command) {
        console.error(`❌ Slash command ${interaction.commandName} not found`);
        return;
    }
    
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`❌ Error executing /${interaction.commandName}:`, error);
        
        const errorMessage = {
            content: '❌ Terjadi error saat menjalankan command!',
            ephemeral: true
        };
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
        } else {
            await interaction.reply(errorMessage);
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// 💬 PREFIX COMMAND HANDLER (!command)
// ═══════════════════════════════════════════════════════════════

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith('!')) return;
    
    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    const command = client.commands.get(commandName);
    
    if (!command) return;
    
    try {
        await command.execute(message, args, client);
    } catch (error) {
        console.error(`❌ Error executing !${commandName}:`, error);
        await message.reply('❌ Ada error saat execute command!');
    }
});

// ═══════════════════════════════════════════════════════════════
// 🚀 BOT READY & REGISTER SLASH COMMANDS
// ═══════════════════════════════════════════════════════════════

client.once('ready', async () => {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`✅ Bot sudah online sebagai ${client.user.tag}`);
    console.log(`📊 Loaded ${client.commands.size} prefix commands`);
    console.log(`📊 Loaded ${client.slashCommands.size} slash commands`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Register slash commands
    if (slashCommandsData.length > 0) {
        try {
            console.log('🔄 Registering slash commands...');
            
            const rest = new REST().setToken(process.env.DISCORD_TOKEN);
            
            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: slashCommandsData }
            );
            
            console.log('✅ Slash commands registered successfully!\n');
        } catch (error) {
            console.error('❌ Error registering slash commands:', error);
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// 🔐 LOGIN
// ═══════════════════════════════════════════════════════════════

client.login(process.env.DISCORD_TOKEN);
