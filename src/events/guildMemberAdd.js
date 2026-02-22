import { sendWelcomeMessage } from '../utils/welcomeHandler.js';

const cooldowns = new Map();

export default {
    name: 'guildMemberAdd',
    once: false,

    async execute(member, client) {
        // Ignore bots
        if (member.user.bot) return;

        // Cooldown check (prevent spam)
        if (cooldowns.has(member.id)) {
            const expiration = cooldowns.get(member.id) + 2000;
            if (Date.now() < expiration) return;
        }

        console.log(`\n👋 NEW MEMBER: ${member.user.tag} | ${member.guild.name}`);

        // Update Bot Activity realtime
        const totalMembers = client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
        client.user.setActivity(`${totalMembers} Members | Owner AeroKatzh`, { type: 3 });

        // 1. AUTO-ROLE FEATURE
        if (process.env.FITUR_AUTO_ROLE?.toLowerCase() === 'on') {
            const roleId = process.env.AUTO_ROLE_ID;
            if (roleId && roleId !== 'masukkan_discord_role_id_member_disini') {
                try {
                    const role = member.guild.roles.cache.get(roleId);
                    if (role) {
                        await member.roles.add(role);
                        console.log(`✅ Auto-Role '${role.name}' diberikan ke ${member.user.tag}`);
                    } else {
                        console.log(`⚠️ Auto-Role gagal: Role ID ${roleId} tidak ditemukan di server!`);
                    }
                } catch (error) {
                    console.error('❌ Error memberikan Auto-Role:', error.message);
                }
            } else {
                console.log('⚠️ FITUR_AUTO_ROLE menyala, tapi AUTO_ROLE_ID belum di-set di .env');
            }
        }

        // 2. WELCOME MESSAGE FEATURE
        if (process.env.FITUR_WELCOME?.toLowerCase() !== 'on') {
            return; // Fitur welcome dimatikan di .env
        }

        const channelId = process.env.WELCOME_CHANNEL_ID;

        if (!channelId) {
            return console.warn('⚠️ WELCOME_CHANNEL_ID not set in .env!');
        }

        const channel = member.guild.channels.cache.get(channelId);

        if (!channel) {
            return console.warn(`⚠️ Welcome channel ${channelId} not found!`);
        }

        await sendWelcomeMessage(member, channel);

        // Set cooldown
        cooldowns.set(member.id, Date.now());
        setTimeout(() => cooldowns.delete(member.id), 2000);
    }
};
