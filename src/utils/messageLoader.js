import fs from 'fs/promises';
import { watchFile } from 'fs';

let welcomeMessages = [];
const recentMessages = [];

export async function loadMessages(filePath = 'pesan.txt') {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    welcomeMessages = data
      .split('\n')
      .map((line, idx) => ({ id: idx, text: line.trim() }))
      .filter(msg => msg.text && !msg.text.startsWith('//') && !msg.text.startsWith('#'));
    
    console.log(`✅ Loaded ${welcomeMessages.length} pesan dari ${filePath}`);
    return true;
  } catch (error) {
    console.error('❌ Error loading messages:', error.message);
    welcomeMessages = [{ id: 0, text: '<@user> selamat datang di WonderPlay!' }];
    return false;
  }
}

export function getRandomMessage() {
  if (welcomeMessages.length === 0) return null;
  
  const available = welcomeMessages.filter(msg => !recentMessages.includes(msg.id));
  const pool = available.length > 0 ? available : welcomeMessages;
  const selected = pool[Math.floor(Math.random() * pool.length)];
  
  recentMessages.push(selected.id);
  if (recentMessages.length > 20) recentMessages.shift();
  
  return selected;
}

export function setupHotReload(filePath = 'pesan.txt') {
  watchFile(filePath, async () => {
    console.log('🔄 pesan.txt changed, reloading...');
    await loadMessages(filePath);
  });
}

export function getMessagesCount() {
  return welcomeMessages.length;
}
