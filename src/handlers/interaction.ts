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
const STAFF_ROLE_ID = '1494121721513381908';

async function sendTicketLog(guild: any, embed: EmbedBuilder) {
  const channel = await guild.channels.fetch(TICKET_LOG_CHANNEL_ID).catch(() => null);
  if (!channel || !channel.isSendable()) return;
  await channel.send({ embeds: [embed] }).catch(() => null);
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

function ticketName(type: string, userId: string) {
  return `${type}-${userId}`;
}

async function sendTicketPanel(interaction: Interaction) {
  if (!interaction.isRepliable()) return;
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
      content: 'Could not verify your permissions.',
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
      'Select the type of ticket you want to open.\n\n' +
      '• Support\n' +
      '• Scanner Help\n' +
      '• Partnership'
    );

  const menu = new StringSelectMenuBuilder()
    .setCustomId('ticket_type_select')
    .setPlaceholder('Choose a ticket type')
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(
      {
        label: 'Support',
        description: 'General questions and support',
        value: 'support',
        emoji: '🎫',
      },
      {
        label: 'Scanner Help',
        description: 'Help with scanner setup or usage',
        value: 'scanner-help',
        emoji: '🛠️',
      },
      {
        label: 'Partnership',
        description: 'Business and partnership requests',
        value: 'partnership',
        emoji: '🤝',
      },
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);

  await interaction.reply({
    content: 'Ticket panel sent.',
    ephemeral: true,
  });

  if ('channel' in interaction && interaction.channel && interaction.channel.isSendable()) {
    await interaction.channel.send({
      embeds: [embed],
      components: [row],
    });
  }
}

export async function handleInteraction(interaction: Interaction) {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'ticketpanel') {
        await sendTicketPanel(interaction);
        return;
      }

      if (interaction.commandName === 'ticket') {
        const sub = interaction.options.getSubcommand(false);
        if (sub === 'send') {
          await sendTicketPanel(interaction);
          return;
        }

        await interaction.reply({
          content: 'Unknown ticket subcommand.',
          ephemeral: true,
        });
        return;
      }

      if (interaction.commandName === 'ping') {
        await interaction.reply({
          content: `Pong! Latency: ${interaction.client.ws.ping}ms`,
          ephemeral: true,
        });
        return;
      }

      if (interaction.commandName === 'help') {
        await interaction.reply({
          content:
            '**Available commands:**\n' +
            '/ticketpanel - Send the ticket panel\n' +
            '/ticket send - Send the ticket panel\n' +
            '/ping - Show bot latency\n' +
            '/help - Show this message\n' +
            '/staff - Show staff info',
          ephemeral: true,
        });
        return;
      }

      if (interaction.commandName === 'staff') {
        await interaction.reply({
          content: `Staff role ID: ${STAFF_ROLE_ID}`,
          ephemeral: true,
        });
        return;
      }
    }

    if (interaction.isStringSelectMenu()) {
      if (!interaction.guild) return;
      if (interaction.customId !== 'ticket_type_select') return;

      const type = interaction.values[0];
      const name = ticketName(type, interaction.user.id);

      const existing = interaction.guild.channels.cache.find(
        (ch) => ch.type === ChannelType.GuildText && ch.name === name,
      );

      if (existing) {
        await interaction.reply({
          content: `You already have an open ${prettyType(type)} ticket: ${existing}`,
          ephemeral: true,
        });
        return;
      }

      const channel = await interaction.guild.channels.create({
        name,
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
        .setTitle(`📩 ${prettyType(type)} Ticket`)
        .setDescription(
          `Hello ${interaction.user},\n\n` +
          `Please explain your request in detail.\n` +
          `A staff member will assist you soon.\n\n` +
          `**Category:** ${prettyType(type)}`
        );

      await channel.send({
        content: `<@${interaction.user.id}> <@&${STAFF_ROLE_ID}>`,
        embeds: [embed],
        components: [closeRow],
      });

      await interaction.reply({
        content: `Your ${prettyType(type)} ticket has been created: ${channel}`,
        ephemeral: true,
      });

      await sendTicketLog(
        interaction.guild,
        new EmbedBuilder()
          .setTitle('📂 Ticket Created')
          .setDescription(
            `**User:** ${interaction.user.tag}\n` +
            `**User ID:** ${interaction.user.id}\n` +
            `**Type:** ${prettyType(type)}\n` +
            `**Channel:** ${channel}`
          ),
      );

      return;
    }

    if (interaction.isButton()) {
      if (!interaction.guild) return;
      if (interaction.customId !== 'close_ticket') return;

      const channel = interaction.channel;
      if (!channel || channel.type !== ChannelType.GuildText) {
        await interaction.reply({
          content: 'This only works in a ticket channel.',
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
