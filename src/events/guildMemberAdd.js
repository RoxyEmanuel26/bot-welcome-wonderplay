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
