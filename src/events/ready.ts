import { Client, Events } from 'discord.js';
import { loadMessages, setupHotReload, getMessagesCount } from '../utils/messageLoader.js';
import { loadStats, getStats } from '../utils/statsManager.js';
import { loadMatchHistory } from '../utils/matchHistory.js';

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client) {
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║   🎮 WONDERPLAY BOT ULTRA v3.0           ║');
    console.log('╚═══════════════════════════════════════════╝');

    await loadMessages();
    await loadStats();
    await loadMatchHistory();
    setupHotReload();

    const stats = getStats();

    console.log(`🤖 ${client.user?.tag} is ONLINE!`);
    console.log(`📨 ${getMessagesCount()} messages ready`);
    console.log(`📊 ${stats.totalWelcomes} total welcomes`);
    console.log(`🎯 ${client.guilds.cache.size} servers`);
    console.log('═══════════════════════════════════════════');

    const totalMembers = client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
    if (client.user) {
      let activityText = process.env.BOT_ACTIVITY || '{members} Members | Owner AeroKatze';
      activityText = activityText.replace('{members}', totalMembers.toString());
      activityText = activityText.replace('{servers}', client.guilds.cache.size.toString());
      client.user.setActivity(activityText, { type: 3 });
    }
  }
};
