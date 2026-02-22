import { loadMessages, setupHotReload, getMessagesCount } from '../utils/messageLoader.js';
import { loadStats, getStats } from '../utils/statsManager.js';

export default {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║   🎮 WONDERPLAY BOT ULTRA v3.0           ║');
    console.log('╚═══════════════════════════════════════════╝');
    
    await loadMessages();
    await loadStats();
    setupHotReload();
    
    const stats = getStats();
    
    console.log(`🤖 ${client.user.tag} is ONLINE!`);
    console.log(`📨 ${getMessagesCount()} messages ready`);
    console.log(`📊 ${stats.totalWelcomes} total welcomes`);
    console.log(`🎯 ${client.guilds.cache.size} servers`);
    console.log('═══════════════════════════════════════════');
    
    client.user.setActivity(`${stats.totalWelcomes} Member | Owner AeroKatzh`, { type: 3 });
  }
};
