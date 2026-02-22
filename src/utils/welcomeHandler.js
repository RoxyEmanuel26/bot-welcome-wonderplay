import { getRandomMessage } from './messageLoader.js';
import { updateStats } from './statsManager.js';
import { buildWelcomeImage } from './canvasBuilder.js';
import { generateWelcomeAI } from './aiGenerator.js';
import { EmbedBuilder, AttachmentBuilder } from 'discord.js';

/**
 * Kirim welcome message ke member
 * @param {GuildMember} member - Member yang akan di-welcome
 * @param {TextChannel} channel - Channel tujuan
 * @returns {Promise<boolean>} - Success status
 */
export async function sendWelcomeMessage(member, channel) {
    try {
        // 1. Siapkan teks utama
        let finalText = '';
        let messageId = 0; // default ID

        // Coba pakai Gemini AI dulu
        const aiMessage = await generateWelcomeAI(member);

        if (aiMessage) {
            finalText = `<@${member.id}>, AI says: \n${aiMessage}`;
            messageId = 'ai_generated';
        } else {
            // Fallback ke pesan dari file txt
            const messageObj = getRandomMessage();
            if (!messageObj) throw new Error('No messages available');

            finalText = messageObj.text
                .replace(/@user/g, `<@${member.id}>`)
                .replace(/WonderPlay/g, member.guild.name);
            messageId = messageObj.id;
        }

        // 2. Siapkan Canvas Image (jika diaktifkan)
        let attachment = null;
        if (process.env.ENABLE_WELCOME_IMAGE === 'true') {
            try {
                const buffer = await buildWelcomeImage(member);
                attachment = new AttachmentBuilder(buffer, { name: 'welcome-image.png' });
            } catch (canvasErr) {
                console.error('⚠️ Canvas generation failed, sending without image:', canvasErr.message);
            }
        }

        // 3. Kirim Pesan (Pakai Embed atau Teks Biasa)
        if (process.env.USE_EMBED === 'true') {
            const embed = new EmbedBuilder()
                .setColor('#e94560')
                .setTitle(`🎉 Welcome to ${member.guild.name}!`)
                .setDescription(finalText)
                .setThumbnail(member.user.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: `Member #${member.guild.memberCount}`, iconURL: member.guild.iconURL() });

            if (attachment) {
                embed.setImage('attachment://welcome-image.png');
                await channel.send({ embeds: [embed], files: [attachment] });
            } else {
                await channel.send({ content: `<@${member.id}>`, embeds: [embed] });
            }

        } else {
            // Teks Biasa (Bukan Embed)
            if (attachment) {
                await channel.send({ content: finalText, files: [attachment] });
            } else {
                await channel.send({ content: finalText });
            }
        }

        if (process.env.ENABLE_STATS === 'true') {
            updateStats(messageId);
        }

        console.log(`✅ Welcome sent for ${member.user.tag} | Message ID: ${messageId}`);
        return true;

    } catch (err) {
        console.error('❌ Error sending welcome:', err.stack);

        // Fallback message minimal
        await channel.send(`<@${member.id}> selamat datang di ${member.guild.name}! 🎮`).catch(console.error);
        return false;
    }
}
