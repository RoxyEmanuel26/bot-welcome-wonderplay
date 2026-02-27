import { EmbedBuilder, Message, Client, SlashCommandBuilder, ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';

const buildAdminHelpEmbed = (user: any) => {
    return new EmbedBuilder()
        .setColor('#f44336') // Warna merah menandakan Admin
        .setTitle('🛡️ PANDUAN WONDERPLAY BOT (ADMIN & OWNER)')
        .setDescription('Panel kontrol khusus Moderator dan Administrator. Daftar command di bawah ini memerlukan permission **Administrator** atau **Manage Guild**.')
        .addFields(
            {
                name: '👋 Welcome & Goodbye System',
                value: 'Sistem penyambutan member server.\n\n' +
                    '• **`/welcome @user`** atau **`!welcome @user`** : Memaksa bot mengirim pesan Welcome (Banner + Text) ke channel welcome, seolah-olah user tersebut baru saja join.\n' +
                    '• **`!welc`** : Command *Testing*. Mengirimkan pesan simulasi welcome ke channel tempat command ini diketik.',
                inline: false
            },
            {
                name: '📊 Server Statistics & Database',
                value: 'Pemantauan status bot.\n\n' +
                    '• **`!stats`** : Melihat statistik internal bot (Total Welcome terkirim, Jumlah Memory Pesan, dsb).\n' +
                    '• **Database MongoDB** : Semua data pemain (Sistem Poin Game) tersimpan aman di sistem Cloud eksternal.',
                inline: false
            },
            {
                name: '🕹️ Sistem Pengujian Tambahan',
                value: '• **`?testroulettevoice`** : Menjalankan tes Valorant Team Roulette menggunakan 8 dummy player tanpa perlu berada di Voice Channel.\n' +
                    '• **`?testroulettevoice 6`** : Sama seperti di atas, tapi dengan custom jumlah dummy (cth: 6).',
                inline: false
            },
            {
                name: '⚙️ Pemeliharaan (Maintenance)',
                value: '• Untuk mendaftarkan Slash Command baru (*sync* kode VSCode ke Server Discord), kamu bisa menjalankan **`!deploy`** di Discord atau jalankan `npm run deploy` di terminal host Anda.',
                inline: false
            }
        )
        .setFooter({ text: `Wonderplay Admin Panel • Diminta oleh ${user.tag}` })
        .setTimestamp();
};

const checkAdminPermission = (member: any) => {
    // Administrator
    if (member && member.permissions && member.permissions.has(PermissionsBitField.Flags.Administrator)) return true;
    // Manage Guild
    if (member && member.permissions && member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return true;

    // Fallback: Check if user is BOT OWNER (from .env)
    const owners = process.env.BOT_OWNERS?.split(',') || [];
    if (owners.includes(member?.id || member?.user?.id)) return true;

    return false;
};

export default {
    name: 'helpadmin',
    aliases: ['ha', 'help_admin', 'adminhelp'],
    description: 'Menampilkan panduan operasional khusus Admin',

    // Slash Command Setup
    data: new SlashCommandBuilder()
        .setName('help_admin')
        .setDescription('Menampilkan panduan operasional khusus Moderator/Admin server')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild), // Default Permission

    // Eksekusi jika lewat Prefix (!helpadmin)
    async execute(message: Message, args: string[], client: Client) {
        if (!checkAdminPermission(message.member)) {
            return message.reply('❌ **Akses Ditolak!** Command ini hanya untuk Administrator atau Owner.');
        }

        const embed = buildAdminHelpEmbed(message.author);
        await message.reply({ embeds: [embed] });
    },

    // Eksekusi jika lewat Slash Command (/help_admin)
    async executeSlash(interaction: ChatInputCommandInteraction) {
        if (!checkAdminPermission(interaction.member)) {
            return interaction.reply({ content: '❌ **Akses Ditolak!** Command ini hanya untuk Administrator atau Owner.', ephemeral: true });
        }

        const embed = buildAdminHelpEmbed(interaction.user);
        await interaction.reply({ embeds: [embed], ephemeral: true }); // Admin help is often best kept ephemeral
    }
};
