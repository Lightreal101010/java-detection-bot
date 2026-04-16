import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  GuildMember,
  Interaction,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
} from 'discord.js';

const TICKET_CATEGORY_ID = '1494310963665567784';
const TICKET_LOG_CHANNEL_ID = '1494310988445388822';
const STAFF_ROLE_ID = '1494121818854785034';

async function sendTicketLog(guild: any, embed: EmbedBuilder) {
  const channel = await guild.channels.fetch(TICKET_LOG_CHANNEL_ID).catch(() => null);
  if (!channel) return;
  if (!channel.isSendable()) return;

  await channel.send({ embeds: [embed] }).catch(() => null);
}

function makeTicketName(type: string, userId: string) {
  return `${type}-${userId}`;
}

function prettyType(type: string) {
  switch (type) {
    case 'support':
      return 'Support';
    case 'scanner-help':
      return 'Scanner Help';
    case 'partnership':
      return 'Partnership';
    default:
      return 'Ticket';
  }
}

export async function handleInteraction(interaction: Interaction) {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'ticketpanel') {
        if (!interaction.guild) {
          await interaction.reply({
            content: 'This command only works inside a server.',
            ephemeral: true,
          });
          return;
        }

        const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);

        if (!(member instanceof GuildMember)) {
          await interaction.reply({
            content: 'Could not verify your member permissions.',
            ephemeral: true,
          });
          return;
        }

        if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
          await interaction.reply({
            content: 'You need the "Manage Server" permission to use this command.',
            ephemeral: true,
          });
          return;
        }

        const embed = new EmbedBuilder()
          .setTitle('🎫 Open a Ticket')
          .setDescription(
            'Choose the type of ticket you want to open from the dropdown below.\n\n' +
            '**Available options:**\n' +
            '• Support\n' +
            '• Scanner Help\n' +
            '• Partnership'
          );

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId('ticket_type_select')
          .setPlaceholder('Choose a ticket type')
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions(
            {
              label: 'Support',
              description: 'General support and questions',
              value: 'support',
              emoji: '🎫',
            },
            {
              label: 'Scanner Help',
              description: 'Help with the scanner or setup',
              value: 'scanner-help',
              emoji: '🛠️',
            },
            {
              label: 'Partnership',
              description: 'Business or partnership inquiries',
              value: 'partnership',
              emoji: '🤝',
            },
          );

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

        await interaction.reply({
          content: 'The ticket panel has been sent.',
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

    if (interaction.isStringSelectMenu()) {
      if (!interaction.guild) return;
      if (interaction.customId !== 'ticket_type_select') return;

      const selectedType = interaction.values[0];
      const ticketName = makeTicketName(selectedType, interaction.user.id);

      const existingTicket = interaction.guild.channels.cache.find((ch) => {
        return ch.type === ChannelType.GuildText && ch.name === ticketName;
      });

      if (existingTicket) {
        await interaction.reply({
          content: `You already have an open ${prettyType(selectedType)} ticket: ${existingTicket}`,
          ephemeral: true,
        });
        return;
      }

      const ticketChannel = await interaction.guild.channels.create({
        name: ticketName,
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
            id: STAFF_ROLE_ID,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.ManageMessages,
            ],
          },
          {
            id: interaction.client.user!.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.ManageMessages,
            ],
          },
        ],
      });

      const closeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('Close Ticket')
          .setStyle(ButtonStyle.Danger),
      );

      const embed = new EmbedBuilder()
        .setTitle(`📩 ${prettyType(selectedType)} Ticket`)
        .setDescription(
          `Hello ${interaction.user},\n\n` +
          `Please describe your issue in detail.\n` +
          `A staff member will help you as soon as possible.\n\n` +
          `**Category:** ${prettyType(selectedType)}`
        );

      await ticketChannel.send({
        content: `<@${interaction.user.id}> <@&${STAFF_ROLE_ID}>`,
        embeds: [embed],
        components: [closeRow],
      });

      await interaction.reply({
        content: `Your ${prettyType(selectedType)} ticket has been created: ${ticketChannel}`,
        ephemeral: true,
      });

      await sendTicketLog(
        interaction.guild,
        new EmbedBuilder()
          .setTitle('📂 Ticket Created')
          .setDescription(
            `**User:** ${interaction.user.tag}\n` +
            `**User ID:** ${interaction.user.id}\n` +
            `**Type:** ${prettyType(selectedType)}\n` +
            `**Channel:** ${ticketChannel}`
          ),
      );

      return;
    }

    if (interaction.isButton()) {
      if (!interaction.guild) return;

      if (interaction.customId === 'close_ticket') {
        const channel = interaction.channel;

        if (!channel || channel.type !== ChannelType.GuildText) {
          await interaction.reply({
            content: 'This only works inside a ticket channel.',
            ephemeral: true,
          });
          return;
        }

        const validPrefixes = ['support-', 'scanner-help-', 'partnership-'];
        if (!validPrefixes.some((prefix) => channel.name.startsWith(prefix))) {
          await interaction.reply({
            content: 'This is not a valid ticket channel.',
            ephemeral: true,
          });
          return;
        }

        await interaction.reply({
          content: 'This ticket will be closed in 3 seconds...',
        });

        await sendTicketLog(
          interaction.guild,
          new EmbedBuilder()
            .setTitle('🔒 Ticket Closed')
            .setDescription(
              `**Channel:** #${channel.name}\n` +
              `**Closed by:** ${interaction.user.tag}`
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
        content: 'An error occurred while processing this interaction.',
        ephemeral: true,
      }).catch(() => null);
    }
  }
}
