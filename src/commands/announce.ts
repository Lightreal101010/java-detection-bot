import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  MessageFlags,
} from 'discord.js';

async function handleAnnounce(interaction: ChatInputCommandInteraction) {
  const title = interaction.options.getString('title', true);
  const message = interaction.options.getString('message', true);

  if (!interaction.channel || !interaction.channel.isSendable()) {
    await interaction.reply({
      content: 'This channel is not sendable.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(title)
    .setDescription(message)
    .setFooter({ text: `Announcement by ${interaction.user.tag}` })
    .setTimestamp();

  await interaction.channel.send({ embeds: [embed] });

  await interaction.reply({
    content: 'Announcement sent.',
    flags: MessageFlags.Ephemeral,
  });
}

export { handleAnnounce };

export default {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Send an announcement')
    .addStringOption((option) =>
      option.setName('title').setDescription('Announcement title').setRequired(true),
    )
    .addStringOption((option) =>
      option.setName('message').setDescription('Announcement message').setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction: ChatInputCommandInteraction) {
    await handleAnnounce(interaction);
  },
};
