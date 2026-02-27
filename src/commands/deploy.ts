import { Message, Client } from 'discord.js';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export default {
    name: 'deploy',
    aliases: ['register', 'sync'],
    description: 'Mendaftarkan slash commands secara manual (Khusus Owner)',

    async execute(message: Message, args: string[], client: Client) {
        // Cek apakah user adalah owner
        const owners = process.env.BOT_OWNERS?.split(',') || [];
        if (!owners.includes(message.author.id)) {
            return message.reply('❌ Command ini hanya bisa digunakan oleh Owner Bot!');
        }

        const reply = await message.reply('🔄 Sedang mendaftarkan slash commands... Mohon tunggu.');

        try {
            // Jalankan script deploy via exec
            const { stdout, stderr } = await execPromise('npm run deploy');

            console.log(stdout);
            if (stderr) console.error(stderr);

            await reply.edit('✅ Berhasil mendaftarkan slash commands!\nℹ️ *Perubahan mungkin butuh beberapa menit / restart aplikasi Discord untuk muncul (cache Discord).*');
        } catch (error: any) {
            console.error('Deploy error:', error);
            await reply.edit(`❌ Terjadi kesalahan saat mendaftarkan commands:\n\`\`\`\n${error.message}\n\`\`\``);
        }
    }
};
