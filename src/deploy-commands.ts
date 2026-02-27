import dotenv from 'dotenv';
dotenv.config({ path: './config/.env' });

import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface CommandModule {
    default: {
        data?: { toJSON: () => object };
        name?: string;
    };
}

const commands: object[] = [];
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(
    file => file.endsWith('.ts') || file.endsWith('.js')
);

for (const file of commandFiles) {
    const filePath = pathToFileURL(join(commandsPath, file)).href;
    const command = await import(filePath) as CommandModule;
    const cmd = command.default;

    if (cmd.data) {
        commands.push(cmd.data.toJSON());
        console.log(`✅ Loaded slash command: /${(cmd.data as any).name}`);
    }
}

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
    console.error('❌ DISCORD_TOKEN atau CLIENT_ID tidak ditemukan di .env!');
    process.exit(1);
}

const rest = new REST().setToken(token);

(async () => {
    try {
        console.log(`\n🔄 Mendaftarkan ${commands.length} slash command ke Discord...\n`);

        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands }
        );

        console.log(`✅ Berhasil mendaftarkan ${commands.length} slash command!`);
        console.log('ℹ️  Perubahan mungkin butuh beberapa menit untuk muncul di Discord.\n');
    } catch (error) {
        console.error('❌ Error mendaftarkan slash commands:', error);
        process.exit(1);
    }
})();
