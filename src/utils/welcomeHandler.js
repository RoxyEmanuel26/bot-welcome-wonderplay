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

        // Coba pakai Gemini AI dulu kalau fiturnya dinyalakan
        let aiMessage = null;
        if (process.env.USE_GEMINI_AI?.toLowerCase() === 'on') {
            aiMessage = await generateWelcomeAI(member);
        }

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

        // 2. Siapkan dan Kirim Canvas Image + Embed ke Channel Banner
        if (process.env.FITUR_WELCOME_BANNER?.toLowerCase() === 'on') {
            try {
                const bannerChannelId = process.env.WELCOME_CHANNEL_BANNER_ID;
                if (bannerChannelId) {
                    const bannerChannel = member.guild.channels.cache.get(bannerChannelId);
                    if (bannerChannel) {
                        const embed = new EmbedBuilder()
                            .setColor('#e94560')
                            .setTitle(`🎉 Welcome to ${member.guild.name}!`)
                            .setDescription(finalText)
                            .setThumbnail(member.user.displayAvatarURL())
                            .setTimestamp()
                            .setFooter({ text: `Member #${member.guild.memberCount}`, iconURL: member.guild.iconURL() });

                        const files = [];
                        if (process.env.USE_CANVAS_IMAGE?.toLowerCase() === 'on') {
                            const buffer = await buildWelcomeImage(member);
                            const attachment = new AttachmentBuilder(buffer, { name: 'welcome-image.png' });
                            embed.setImage('attachment://welcome-image.png');
                            files.push(attachment);
                        }

                        await bannerChannel.send({ content: `<@${member.id}>`, embeds: [embed], files });
                        console.log(`✅ Banner Embed sent to channel ${bannerChannelId}`);
                    } else {
                        console.warn(`⚠️ Banner channel ${bannerChannelId} tidak ditemukan.`);
                    }
                } else {
                    console.warn(`⚠️ WELCOME_CHANNEL_BANNER_ID belum diatur di .env!`);
                }
            } catch (canvasErr) {
                console.error('⚠️ Banner/Canvas generation failed:', canvasErr.message);
            }
        }

        // 3. Kirim Teks Biasa (Tanpa Embed dan Banner) ke Main Welcome Channel
        if (process.env.FITUR_WELCOME_MESSAGE?.toLowerCase() === 'on') {
            await channel.send({ content: finalText });
        }

        // 4. Update Stats (Selalu Menyala)
        updateStats(messageId);

        console.log(`✅ Welcome sent for ${member.user.tag} | Message ID: ${messageId}`);
        return true;

    } catch (err) {
        console.error('❌ Error sending welcome:', err.stack);

        // Fallback message minimal
        await channel.send(`<@${member.id}> selamat datang di ${member.guild.name}! 🎮`).catch(console.error);
        return false;
    }
}
