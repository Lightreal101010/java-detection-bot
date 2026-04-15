import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export async function handleHelp(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('CheatGuard Bot — Commands')
    .addFields(
      {
        name: '🔨 Moderation',
        value: [
          '`/ban` — Ban a user',
          '`/kick` — Kick a user',
          '`/mute` — Timeout a user',
          '`/unmute` — Remove timeout',
          '`/warn` — Warn a user',
          '`/warnings` — View warnings',
          '`/clearwarnings` — Clear warnings',
          '`/clear` — Delete messages',
          '`/slowmode` — Set slowmode',
          '`/lock` / `/unlock` — Lock/unlock channel',
        ].join('\n'),
      },
      {
        name: '🎫 Tickets',
        value: '`/ticket` — Open a private support ticket',
      },
      {
        name: '🚨 Cheat Scanner',
        value: [
          '`/scan` — Scan a user for red flags',
          '`/cheater` — Flag a Discord ID as a cheater *(Admin)*',
          '`/cheaterlog` — View all flagged cheaters *(Admin)*',
          '`/checkinvite` — Scan an invite link for danger',
        ].join('\n'),
      },
      {
        name: '🔴 Surveillance & Intimidation',
        value: [
          '`/track` — Activate real-time surveillance',
          '`/expose` — Generate an exposure report',
          '`/watchlist` — Add a user to the watchlist',
          '`/evidence` — Create a permanent evidence file',
          '`/profile` — Generate full criminal profile with threat score',
          '`/intercept` — Log and intercept communications',
          '`/database` — Query the global cheat database',
          '`/verdict` — Deliver a final guilty/innocent verdict',
          '`/freeze` — Initiate account freeze protocol',
          '`/classify` — Assign a threat level 1–5',
        ].join('\n'),
      },
      {
        name: '📋 Staff & Utility',
        value: [
          '`/staff` — Add a user to staff *(Admin)*',
          '`/announce` — Post an announcement *(Admin)*',
          '`/userinfo` — User information',
          '`/serverinfo` — Server information',
          '`/help` — Show this menu',
        ].join('\n'),
      },
      {
        name: '🤖 AI Chat',
        value: 'Mention the bot or reply to it in any channel. Speaks English & German. Pings admins when it can\'t help.',
      },
    )
    .setFooter({ text: 'CheatGuard — Keeping your server clean' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
