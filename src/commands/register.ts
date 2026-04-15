import { Client, REST, Routes, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export async function registerCommands(client: Client<true>) {
  const commands = [
    // ── Staff ──────────────────────────────────────────────────────────
    new SlashCommandBuilder()
      .setName('staff')
      .setDescription('Add a user to the staff team')
      .addUserOption(opt =>
        opt.setName('user').setDescription('The user to add as staff').setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    // ── Moderation ─────────────────────────────────────────────────────
    new SlashCommandBuilder()
      .setName('ban')
      .setDescription('Ban a user from the server')
      .addUserOption(opt => opt.setName('user').setDescription('User to ban').setRequired(true))
      .addStringOption(opt => opt.setName('reason').setDescription('Reason for ban'))
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    new SlashCommandBuilder()
      .setName('kick')
      .setDescription('Kick a user from the server')
      .addUserOption(opt => opt.setName('user').setDescription('User to kick').setRequired(true))
      .addStringOption(opt => opt.setName('reason').setDescription('Reason for kick'))
      .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    new SlashCommandBuilder()
      .setName('mute')
      .setDescription('Timeout a user')
      .addUserOption(opt => opt.setName('user').setDescription('User to mute').setRequired(true))
      .addIntegerOption(opt =>
        opt.setName('duration').setDescription('Duration in minutes').setRequired(true)
      )
      .addStringOption(opt => opt.setName('reason').setDescription('Reason for mute'))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new SlashCommandBuilder()
      .setName('unmute')
      .setDescription('Remove timeout from a user')
      .addUserOption(opt => opt.setName('user').setDescription('User to unmute').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new SlashCommandBuilder()
      .setName('warn')
      .setDescription('Warn a user')
      .addUserOption(opt => opt.setName('user').setDescription('User to warn').setRequired(true))
      .addStringOption(opt =>
        opt.setName('reason').setDescription('Reason for warning').setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new SlashCommandBuilder()
      .setName('warnings')
      .setDescription('View warnings for a user')
      .addUserOption(opt => opt.setName('user').setDescription('User to check').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new SlashCommandBuilder()
      .setName('clearwarnings')
      .setDescription('Clear all warnings for a user')
      .addUserOption(opt =>
        opt.setName('user').setDescription('User to clear warnings for').setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
      .setName('clear')
      .setDescription('Delete messages from a channel')
      .addIntegerOption(opt =>
        opt
          .setName('amount')
          .setDescription('Number of messages to delete (1-100)')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(100)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    new SlashCommandBuilder()
      .setName('slowmode')
      .setDescription('Set slowmode for a channel')
      .addIntegerOption(opt =>
        opt
          .setName('seconds')
          .setDescription('Slowmode duration in seconds (0 to disable)')
          .setRequired(true)
          .setMinValue(0)
          .setMaxValue(21600)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    new SlashCommandBuilder()
      .setName('lock')
      .setDescription('Lock a channel (prevent messages)')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    new SlashCommandBuilder()
      .setName('unlock')
      .setDescription('Unlock a channel')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    // ── Utility ────────────────────────────────────────────────────────
    new SlashCommandBuilder()
      .setName('userinfo')
      .setDescription('Get information about a user')
      .addUserOption(opt => opt.setName('user').setDescription('User to inspect')),

    new SlashCommandBuilder()
      .setName('serverinfo')
      .setDescription('Get information about the server'),

    new SlashCommandBuilder()
      .setName('announce')
      .setDescription('Send an announcement embed')
      .addStringOption(opt =>
        opt.setName('title').setDescription('Announcement title').setRequired(true)
      )
      .addStringOption(opt =>
        opt.setName('message').setDescription('Announcement message').setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
      .setName('help')
      .setDescription('Show all available commands'),

    // ── Cheat Scanner ──────────────────────────────────────────────────
    new SlashCommandBuilder()
      .setName('scan')
      .setDescription('Scan a user for suspicious activity')
      .addUserOption(opt =>
        opt.setName('user').setDescription('User to scan').setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new SlashCommandBuilder()
      .setName('cheater')
      .setDescription('Flag a Discord ID as a cheater (admin only)')
      .addStringOption(opt =>
        opt.setName('userid').setDescription('Discord user ID to flag').setRequired(true)
      )
      .addStringOption(opt =>
        opt.setName('reason').setDescription('Reason for flagging').setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
      .setName('cheaterlog')
      .setDescription('View all flagged cheaters (admin only)')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
      .setName('checkinvite')
      .setDescription('Scan a Discord invite link for suspicious activity')
      .addStringOption(opt =>
        opt.setName('invite').setDescription('Invite link or code').setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    // ── Ticket System ──────────────────────────────────────────────────
    new SlashCommandBuilder()
      .setName('ticket')
      .setDescription('Open a support ticket'),

    // ── Intimidation Commands ──────────────────────────────────────────
    new SlashCommandBuilder()
      .setName('track')
      .setDescription('Activate surveillance tracking on a user')
      .addUserOption(opt =>
        opt.setName('user').setDescription('User to track').setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new SlashCommandBuilder()
      .setName('expose')
      .setDescription('Generate an exposure report on a user')
      .addUserOption(opt =>
        opt.setName('user').setDescription('User to expose').setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new SlashCommandBuilder()
      .setName('watchlist')
      .setDescription('Add a user to the active watchlist')
      .addUserOption(opt =>
        opt.setName('user').setDescription('User to add').setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new SlashCommandBuilder()
      .setName('evidence')
      .setDescription('Create a permanent evidence file against a user')
      .addUserOption(opt =>
        opt.setName('user').setDescription('Subject of the evidence').setRequired(true)
      )
      .addStringOption(opt =>
        opt.setName('details').setDescription('Details of the evidence').setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new SlashCommandBuilder()
      .setName('profile')
      .setDescription('Generate a full criminal profile for a user')
      .addUserOption(opt =>
        opt.setName('user').setDescription('User to profile').setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new SlashCommandBuilder()
      .setName('intercept')
      .setDescription('Intercept and log communications from a user')
      .addUserOption(opt =>
        opt.setName('user').setDescription('User to intercept').setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new SlashCommandBuilder()
      .setName('database')
      .setDescription('Query the global cheat database for a user')
      .addUserOption(opt =>
        opt.setName('user').setDescription('User to query').setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new SlashCommandBuilder()
      .setName('verdict')
      .setDescription('Deliver a final verdict on a user')
      .addUserOption(opt =>
        opt.setName('user').setDescription('Subject of the verdict').setRequired(true)
      )
      .addStringOption(opt =>
        opt
          .setName('decision')
          .setDescription('Verdict decision')
          .setRequired(true)
          .addChoices(
            { name: 'Guilty', value: 'guilty' },
            { name: 'Innocent', value: 'innocent' }
          )
      )
      .addStringOption(opt =>
        opt.setName('reason').setDescription('Reasoning behind verdict')
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new SlashCommandBuilder()
      .setName('freeze')
      .setDescription('Initiate account freeze protocol on a user')
      .addUserOption(opt =>
        opt.setName('user').setDescription('User to freeze').setRequired(true)
      )
      .addStringOption(opt =>
        opt.setName('reason').setDescription('Reason for freeze')
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new SlashCommandBuilder()
      .setName('classify')
      .setDescription('Assign an official threat level to a user (1-5)')
      .addUserOption(opt =>
        opt.setName('user').setDescription('User to classify').setRequired(true)
      )
      .addIntegerOption(opt =>
        opt
          .setName('level')
          .setDescription('Threat level (1=Low, 5=Critical)')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(5)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new SlashCommandBuilder()
      .setName('breach')
      .setDescription('Send a CheatGuard system breach alert DM to a user')
      .addUserOption(opt =>
        opt.setName('user').setDescription('User to send the breach alert to').setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  ];

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN!);

  await rest.put(Routes.applicationCommands(client.user.id), {
    body: commands.map(cmd => cmd.toJSON()),
  });
}
