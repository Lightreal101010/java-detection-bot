import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  Interaction,
  PermissionFlagsBits,
  GuildMember,
} from 'discord.js';

const TICKET_CATEGORY_ID = '1494310963665567784';
const TICKET_LOG_CHANNEL_ID = '1494310988445388822';

async function sendTicketLog(guild: any, embed: EmbedBuilder) {
  const channel = await guild.channels.fetch(TICKET_LOG_CHANNEL_ID).catch(() => null);
  if (!channel) return;
  if (!channel.isSendable()) return;

  await channel.send({ embeds: [embed] }).catch(() => null);
}

export async function handleInteraction(interaction: Interaction) {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'ticketpanel') {
        if (!interaction.guild) {
          await interaction.reply({
            content: 'Dieser Command funktioniert nur in einem Server.',
            ephemeral: true,
          });
          return;
        }

        const member = interaction.member;

        if (!(member instanceof GuildMember)) {
          await interaction.reply({
            content: 'Mitglied konnte nicht korrekt erkannt werden.',
            ephemeral: true,
          });
          return;
        }

        if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
          await interaction.reply({
            content: 'Du brauchst dafür die Berechtigung "Server verwalten".',
            ephemeral: true,
          });
          return;
        }

        const embed = new EmbedBuilder()
          .setTitle('🎫 Ticket Support')
          .setDescription(
            'Klicke unten auf den Button, um ein Ticket zu erstellen.\n\n' +
            'Bitte beschreibe dein Anliegen danach im Ticket.'
          );

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('create_ticket')
            .setLabel('Ticket erstellen')
            .setStyle(ButtonStyle.Primary),
        );

        await interaction.reply({
          content: 'Ticket-Panel wurde gesendet.',
          ephemeral: true,
        });

        if (!interaction.channel || !interaction.channel.isSendable()) return;

        await interaction.channel.send({
          embeds: [embed],
          components: [row],
        });

        return;
      }
    }

    if (interaction.isButton()) {
      if (!interaction.guild) return;

      if (interaction.customId === 'create_ticket') {
        const existingTicket = interaction.guild.channels.cache.find((ch) => {
          return ch.type === ChannelType.GuildText && ch.name === `ticket-${interaction.user.id}`;
        });

        if (existingTicket) {
          await interaction.reply({
            content: `Du hast bereits ein Ticket: ${existingTicket}`,
            ephemeral: true,
          });
          return;
        }

        const ticketChannel = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.id}`,
          type: ChannelType.GuildText,
          parent: TICKET_CATEGORY_ID,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: interaction.user.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.AttachFiles,
              ],
            },
            {
              id: interaction.client.user!.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.ManageChannels,
              ],
            },
          ],
        });

        const closeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('Ticket schließen')
            .setStyle(ButtonStyle.Danger),
        );

        const embed = new EmbedBuilder()
          .setTitle('📩 Ticket erstellt')
          .setDescription(
            `Hallo ${interaction.user},\n` +
            `bitte schreibe hier dein Anliegen rein.\n\n` +
            `Ein Teammitglied wird sich bald melden.`
          );

        await ticketChannel.send({
          content: `${interaction.user}`,
          embeds: [embed],
          components: [closeRow],
        });

        await interaction.reply({
          content: `Dein Ticket wurde erstellt: ${ticketChannel}`,
          ephemeral: true,
        });

        await sendTicketLog(
          interaction.guild,
          new EmbedBuilder()
            .setTitle('📂 Ticket erstellt')
            .setDescription(
              `User: ${interaction.user.tag}\n` +
              `User ID: ${interaction.user.id}\n` +
              `Channel: ${ticketChannel}`
            ),
        );

        return;
      }

      if (interaction.customId === 'close_ticket') {
        const channel = interaction.channel;

        if (!channel || channel.type !== ChannelType.GuildText) {
          await interaction.reply({
            content: 'Das geht nur in Ticket-Channels.',
            ephemeral: true,
          });
          return;
        }

        if (!channel.name.startsWith('ticket-')) {
          await interaction.reply({
            content: 'Das ist kein Ticket-Channel.',
            ephemeral: true,
          });
          return;
        }

        await interaction.reply({
          content: 'Ticket wird in 3 Sekunden geschlossen...',
        });

        await sendTicketLog(
          interaction.guild,
          new EmbedBuilder()
            .setTitle('🔒 Ticket geschlossen')
            .setDescription(
              `Channel: #${channel.name}\n` +
              `Geschlossen von: ${interaction.user.tag}`
            ),
        );

        setTimeout(async () => {
          await channel.delete().catch(() => null);
        }, 3000);

        return;
      }
    }
  } catch (error) {
    console.error('Interaction handler error:', error);

    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: 'Es ist ein Fehler passiert.',
        ephemeral: true,
      }).catch(() => null);
    }
  }
}
