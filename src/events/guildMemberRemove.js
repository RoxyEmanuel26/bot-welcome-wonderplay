import { EmbedBuilder } from 'discord.js';

export default {
    name: 'guildMemberRemove',
    once: false,

    async execute(member, client) {
        // Ignore bots
        if (member.user.bot) return;

        // Update Bot Activity realtime
        const totalMembers = client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
        client.user.setActivity(`${totalMembers} Members | Owner AeroKatzh`, { type: 3 });

        // Cek config toggle
        if (process.env.FITUR_GOODBYE?.toLowerCase() !== 'on') {
            return;
        }

        console.log(`\n🚪 MEMBER LEAVE: ${member.user.tag} | ${member.guild.name}`);

        const channelId = process.env.WELCOME_CHANNEL_ID;

        if (!channelId) {
            return console.warn('⚠️ WELCOME_CHANNEL_ID not set in .env! Cannot send goodbye message.');
        }

        const channel = member.guild.channels.cache.get(channelId);

        if (!channel) {
            return console.warn(`⚠️ Welcome/Goodbye channel ${channelId} not found!`);
        }

        try {
            if (process.env.USE_EMBED === 'true') {
                const embed = new EmbedBuilder()
                    .setColor('#333333')
                    .setTitle(`Goodbye, ${member.user.username}! 😢`)
                    .setDescription(`**${member.user.username}** baru saja meninggalkan server ini.\nSemoga kita berjumpa lagi di lain waktu!`)
                    .setThumbnail(member.user.displayAvatarURL())
                    .setTimestamp()
                    .setFooter({ text: `Member count: ${member.guild.memberCount}`, iconURL: member.guild.iconURL() });

                await channel.send({ embeds: [embed] });
            } else {
                await channel.send(`**${member.user.username}** baru saja meninggalkan server. Selamat jalan! 👋`);
            }
        } catch (error) {
            console.error('❌ Error sending goodbye message:', error);
        }
    }
};
