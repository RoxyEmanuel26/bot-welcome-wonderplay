import { loadMessages, setupHotReload, getMessagesCount } from '../utils/messageLoader.js';
import { loadStats, getStats } from '../utils/statsManager.js';
import { loadMatchHistory } from '../utils/matchHistory.js';

export default {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║   🎮 WONDERPLAY BOT ULTRA v3.0           ║');
    console.log('╚═══════════════════════════════════════════╝');

    await loadMessages();
    await loadStats();
    await loadMatchHistory();
    setupHotReload();

    const stats = getStats();

    console.log(`🤖 ${client.user.tag} is ONLINE!`);
    console.log(`📨 ${getMessagesCount()} messages ready`);
    console.log(`📊 ${stats.totalWelcomes} total welcomes`);
    console.log(`🎯 ${client.guilds.cache.size} servers`);
    console.log('═══════════════════════════════════════════');

    const totalMembers = client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
    client.user.setActivity(`${totalMembers} Members | Owner AeroKatzh`, { type: 3 });
  }
};
