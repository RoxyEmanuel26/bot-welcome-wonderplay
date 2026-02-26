import { PermissionFlagsBits } from 'discord.js';

export function checkPermissions(message, requiredPerms = []) {
  // Server Owner always has access
  if (message.guild.ownerId === message.author.id) {
    return { allowed: true, role: 'Server Owner' };
  }

  // Bot Owners (dari .env)
  const botOwners = process.env.BOT_OWNERS?.split(',').map(id => id.trim()) || [];
  if (botOwners.includes(message.author.id)) {
    return { allowed: true, role: 'Bot Owner' };
  }

  // Check Discord permissions
  for (const perm of requiredPerms) {
    if (message.member.permissions.has(perm)) {
      return { allowed: true, role: 'Administrator' };
    }
  }

  return { allowed: false, role: null };
}

export function createPermissionEmbed(authorizedRoles = ['Administrator', 'Server Owner']) {
  return {
    content: '❌ **AKSES DITOLAK!**',
    embeds: [{
      color: 0xFF0000,
      title: '🔒 Permission Required',
      description: `Command ini hanya bisa digunakan oleh:\n${authorizedRoles.map(r => `• **${r}**`).join('\n')}`,
      footer: { text: 'WonderPlay Security System' },
      timestamp: new Date().toISOString()
    }],
    allowedMentions: { repliedUser: false }
  };
}
