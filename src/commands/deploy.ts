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
            return message.reply('❌ **Akses Ditolak!** Command ini hanya bisa digunakan oleh Owner Bot.');
        }

        const reply = await message.reply('🔄 Sedang mengeksekusi script `npm run deploy` di background... Mohon tunggu.');

        try {
            // Jalankan script deploy via exec dengan timeout 15 detik agar gak stuck
            const { stdout, stderr } = await execPromise('npm run deploy', { timeout: 15000 });

            console.log('--- Deploy Log ---');
            console.log(stdout);
            if (stderr) console.error(stderr);
            console.log('------------------');

            await reply.edit('✅ **Berhasil!** Script deployment (*npm run deploy*) telah dieksekusi.\nℹ️ *Seluruh slash command terbaru sudah dicatatkan ke API Discord. Perubahan mungkin butuh beberapa saat / restart aplikasi Discord untuk muncul (tergantung cache Discord).*');
        } catch (error: any) {
            console.error('Deploy error:', error);
            await reply.edit(`❌ **Gagal mengeksekusi script.** Terjadi error pada terminal server/host:\n\`\`\`\n${error.message}\n\`\`\``);
        }
    }
};
