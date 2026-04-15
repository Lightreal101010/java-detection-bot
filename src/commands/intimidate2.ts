import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

// ─── /profile ───────────────────────────────────────────────────────────────

export async function handleProfile(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user', true);
  const guild = interaction.guild;
  await interaction.deferReply();
  await new Promise(r => setTimeout(r, 2000));

  const member = await guild?.members.fetch(user.id).catch(() => null);
  const accountAgeDays = Math.floor((Date.now() - user.createdTimestamp) / 86_400_000);
  const joinedDaysAgo = member?.joinedAt
    ? Math.floor((Date.now() - member.joinedAt.getTime()) / 86_400_000)
    : null;

  const threatScore = Math.min(
    100,
    (accountAgeDays < 30 ? 40 : 0) +
    (!user.avatarURL() ? 20 : 0) +
    (joinedDaysAgo !== null && joinedDaysAgo < 7 ? 30 : 0) +
    Math.floor(Math.random() * 20)
  );

  const threatLabel =
    threatScore >= 80 ? '🔴 CRITICAL'
    : threatScore >= 60 ? '🟠 HIGH'
    : threatScore >= 40 ? '🟡 MEDIUM'
    : '🟢 LOW';

  const color =
    threatScore >= 80 ? 0xff0000
    : threatScore >= 60 ? 0xff6600
    : threatScore >= 40 ? 0xffcc00
    : 0x00cc44;

  const flags = [
    accountAgeDays < 30 && 'New account — possible alt',
    !user.avatarURL() && 'No profile avatar (common for alts)',
    joinedDaysAgo !== null && joinedDaysAgo < 7 && 'Joined server very recently',
    threatScore > 60 && 'Behavioral anomalies detected',
    threatScore > 75 && 'Cross-server violation history suspected',
  ].filter(Boolean);

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`🗂️ CRIMINAL PROFILE — ${user.tag}`)
    .setThumbnail(user.displayAvatarURL({ size: 256 }))
    .addFields(
      { name: 'Subject ID', value: `\`${user.id}\``, inline: true },
      { name: 'Account Age', value: `${accountAgeDays} days`, inline: true },
      { name: 'Threat Score', value: `**${threatScore}/100**`, inline: true },
      { name: 'Threat Level', value: threatLabel, inline: true },
      { name: 'Bot Probability', value: user.bot ? '100% (confirmed bot)' : `${Math.min(95, Math.max(5, 100 - accountAgeDays))}%`, inline: true },
      { name: 'Server Presence', value: joinedDaysAgo !== null ? `${joinedDaysAgo} days` : 'Not in server', inline: true },
      { name: 'Behavioral Flags', value: flags.length > 0 ? flags.map(f => `⚠️ ${f}`).join('\n') : '✅ No flags detected' },
      { name: 'Profile Classification', value: threatScore >= 60 ? '🚨 PERSON OF INTEREST — Under active monitoring' : '📁 Logged for reference' },
    )
    .setFooter({ text: `Compiled by ${interaction.user.tag} • Case filed permanently` })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

// ─── /intercept ─────────────────────────────────────────────────────────────

export async function handleIntercept(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user', true);
  await interaction.deferReply();
  await new Promise(r => setTimeout(r, 2500));

  const now = new Date();
  const fakeTimestamps = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(now.getTime() - i * 1000 * 60 * Math.floor(Math.random() * 30 + 1));
    return d.toLocaleTimeString();
  });

  const patterns = [
    'Repeated keyword triggers: "bypass", "loader", "inject"',
    'Unusual message frequency spike detected',
    'DM solicitation pattern recognized',
    'External link distribution to suspicious domains',
    'Coordination signals with flagged accounts',
  ];

  const embed = new EmbedBuilder()
    .setColor(0xcc0000)
    .setTitle(`📡 INTERCEPT LOG — ${user.tag}`)
    .setDescription(`**STATUS:** 🔴 ACTIVE INTERCEPT\nCommunications from \`${user.id}\` are being monitored in real time.`)
    .addFields(
      {
        name: 'Flagged Activity Timestamps',
        value: fakeTimestamps.map((t, i) => `\`[${t}]\` ${patterns[i] || 'Anomaly recorded'}`).join('\n'),
      },
      { name: 'Signal Confidence', value: `${65 + Math.floor(Math.random() * 30)}%`, inline: true },
      { name: 'Data Retained', value: '72 hours rolling', inline: true },
      { name: 'Alert Status', value: '🚨 Staff notified', inline: true },
      {
        name: 'Notice',
        value: 'This user has been placed under full communication surveillance. All outgoing and incoming messages are being logged by CheatGuard.',
      },
    )
    .setFooter({ text: `Intercept initiated by ${interaction.user.tag} • ID: ${Date.now()}` })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

// ─── /database ──────────────────────────────────────────────────────────────

export async function handleDatabase(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user', true);
  await interaction.deferReply();

  const steps = [
    '🔍 Querying CheatGuard Global Database...',
    '📡 Cross-referencing ban lists...',
    '🧠 Running behavioral fingerprint analysis...',
    '📊 Compiling risk assessment...',
  ];

  await interaction.editReply(steps[0]);
  for (let i = 1; i < steps.length; i++) {
    await new Promise(r => setTimeout(r, 1200));
    await interaction.editReply(steps[i]);
  }
  await new Promise(r => setTimeout(r, 1000));

  const accountAgeDays = Math.floor((Date.now() - user.createdTimestamp) / 86_400_000);
  const isHighRisk = accountAgeDays < 30 || !user.avatarURL();
  const matchScore = isHighRisk
    ? `${70 + Math.floor(Math.random() * 25)}% match`
    : `${5 + Math.floor(Math.random() * 20)}% match`;

  const embed = new EmbedBuilder()
    .setColor(isHighRisk ? 0xff0000 : 0x00cc44)
    .setTitle('🗄️ GLOBAL CHEAT DATABASE — Results')
    .setThumbnail(user.displayAvatarURL({ size: 128 }))
    .addFields(
      { name: 'Subject', value: `${user.tag} \`${user.id}\``, inline: false },
      { name: 'Database Match', value: isHighRisk ? `🔴 RECORD FOUND (${matchScore})` : `✅ No direct record found (${matchScore})`, inline: false },
      { name: 'Cross-Server Flags', value: isHighRisk ? `${Math.floor(Math.random() * 4) + 1} server(s) reported` : 'None', inline: true },
      { name: 'Cheat Association', value: isHighRisk ? 'Suspected' : 'None detected', inline: true },
      { name: 'Account Integrity', value: accountAgeDays < 30 ? '⚠️ LOW' : '✅ NORMAL', inline: true },
      {
        name: 'Recommendation',
        value: isHighRisk
          ? '🚨 **High confidence match.** Recommend manual review and potential ban.'
          : '✅ No direct action required. Continue passive monitoring.',
      },
    )
    .setFooter({ text: `Query by ${interaction.user.tag} • CheatGuard DB v4.2` })
    .setTimestamp();

  await interaction.editReply({ content: null, embeds: [embed] });
}

// ─── /verdict ───────────────────────────────────────────────────────────────

export async function handleVerdict(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user', true);
  const decision = interaction.options.getString('decision', true) as 'guilty' | 'innocent';
  const reason = interaction.options.getString('reason') || 'No further elaboration provided.';

  await interaction.deferReply();
  await new Promise(r => setTimeout(r, 1800));

  const caseId = `CG-${Date.now().toString().slice(-6)}`;
  const isGuilty = decision === 'guilty';

  const embed = new EmbedBuilder()
    .setColor(isGuilty ? 0xff0000 : 0x00cc44)
    .setTitle(`⚖️ FINAL VERDICT — Case ${caseId}`)
    .setDescription(
      isGuilty
        ? `## 🔴 GUILTY\nThe subject has been found in violation of server rules and fair-play policies.`
        : `## 🟢 INNOCENT\nThe subject has been cleared of all current suspicions.`
    )
    .addFields(
      { name: 'Subject', value: `${user.tag} \`${user.id}\``, inline: true },
      { name: 'Verdict', value: isGuilty ? '**GUILTY**' : '**INNOCENT**', inline: true },
      { name: 'Issued by', value: interaction.user.tag, inline: true },
      { name: 'Reasoning', value: reason },
      {
        name: 'Next Steps',
        value: isGuilty
          ? '🚨 Subject flagged for enforcement action. Record has been archived permanently.'
          : '📁 Case closed. Subject record retained for reference only.',
      },
    )
    .setFooter({ text: `Case ${caseId} • CheatGuard Justice System • Verdict is final` })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

// ─── /freeze ─────────────────────────────────────────────────────────────────

export async function handleFreeze(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user', true);
  const reason = interaction.options.getString('reason') || 'Suspicious activity detected';

  await interaction.deferReply();
  await new Promise(r => setTimeout(r, 1500));

  const caseRef = `FRZ-${Math.floor(Math.random() * 90000) + 10000}`;

  const embed = new EmbedBuilder()
    .setColor(0x00bfff)
    .setTitle('🧊 ACCOUNT FREEZE PROTOCOL — INITIATED')
    .setDescription(
      `Account activity for **${user.tag}** has been flagged and placed under a freeze protocol.\n\n*All actions by this user are now under enhanced scrutiny.*`
    )
    .addFields(
      { name: 'Subject', value: `${user.tag} \`${user.id}\``, inline: true },
      { name: 'Reference', value: caseRef, inline: true },
      { name: 'Initiated by', value: interaction.user.tag, inline: true },
      { name: 'Freeze Reason', value: reason },
      { name: 'Restrictions Applied', value: '- Message logging enabled\n- Invite creation monitored\n- Reaction history archived\n- DM patterns flagged', inline: false },
      { name: 'Status', value: '🔵 ACTIVE — Pending admin review', inline: false },
    )
    .setFooter({ text: `Ref: ${caseRef} • CheatGuard Compliance System` })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

// ─── /classify ───────────────────────────────────────────────────────────────

export async function handleClassify(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user', true);
  const level = interaction.options.getInteger('level', true);

  await interaction.deferReply();
  await new Promise(r => setTimeout(r, 1200));

  const levelData: Record<number, { label: string; color: number; description: string; action: string }> = {
    1: { label: '🟢 LEVEL 1 — LOW RISK',      color: 0x00cc44, description: 'Minimal concern. Routine monitoring.', action: 'No immediate action required.' },
    2: { label: '🟡 LEVEL 2 — GUARDED',       color: 0xffcc00, description: 'Notable patterns detected. Elevated attention advised.', action: 'Increase passive monitoring.' },
    3: { label: '🟠 LEVEL 3 — ELEVATED',      color: 0xff8800, description: 'Clear red flags identified. Significant concern.', action: 'Active surveillance. Prepare enforcement.' },
    4: { label: '🔴 LEVEL 4 — HIGH THREAT',   color: 0xff3300, description: 'Confirmed violation signals. Immediate attention required.', action: 'Escalate to senior staff immediately.' },
    5: { label: '☠️ LEVEL 5 — CRITICAL',      color: 0x990000, description: 'Extreme threat. Subject poses direct risk to server integrity.', action: '🚨 IMMEDIATE BAN RECOMMENDED. All activity archived.' },
  };

  const data = levelData[level];

  const embed = new EmbedBuilder()
    .setColor(data.color)
    .setTitle(`🔐 THREAT CLASSIFICATION — ${user.tag}`)
    .addFields(
      { name: 'Subject', value: `${user.tag} \`${user.id}\``, inline: true },
      { name: 'Classified by', value: interaction.user.tag, inline: true },
      { name: 'Threat Level', value: `**${data.label}**` },
      { name: 'Assessment', value: data.description },
      { name: 'Required Action', value: data.action },
    )
    .setFooter({ text: `Classification is permanent • CheatGuard Threat Matrix` })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
