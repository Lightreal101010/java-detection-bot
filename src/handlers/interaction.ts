import { Interaction, ChatInputCommandInteraction, ButtonInteraction } from 'discord.js';
import { handleStaff } from '../commands/staff.js';
import { handleBan } from '../commands/ban.js';
import { handleKick } from '../commands/kick.js';
import { handleMute, handleUnmute } from '../commands/mute.js';
import { handleWarn, handleWarnings, handleClearWarnings } from '../commands/warn.js';
import { handleClear } from '../commands/clear.js';
import { handleUserInfo } from '../commands/userinfo.js';
import { handleServerInfo } from '../commands/serverinfo.js';
import { handleSlowmode } from '../commands/slowmode.js';
import { handleLock, handleUnlock } from '../commands/lock.js';
import { handleAnnounce } from '../commands/announce.js';
import { handleScan } from '../commands/scan.js';
import { handleHelp } from '../commands/help.js';
import { handleCheater, handleCheaterLog } from '../commands/cheater.js';
import { handleCheckInvite } from '../commands/checkinvite.js';
import { handleTicket, handleCloseTicketButton } from '../commands/ticket.js';
import { handleTrack, handleExpose, handleWatchlist, handleEvidence } from '../commands/intimidate.js';
import { handleProfile, handleIntercept, handleDatabase, handleVerdict, handleFreeze, handleClassify } from '../commands/intimidate2.js';
import { handleBreach } from '../commands/breach.js';

export async function handleInteraction(interaction: Interaction) {
  try {
    if (interaction.isButton()) {
      const btn = interaction as ButtonInteraction;
      if (btn.customId.startsWith('close_ticket_')) {
        return await handleCloseTicketButton(btn);
      }
    }

    if (!interaction.isChatInputCommand()) return;
    const cmd = interaction as ChatInputCommandInteraction;

    switch (cmd.commandName) {
      case 'staff':        return await handleStaff(cmd);
      case 'ban':          return await handleBan(cmd);
      case 'kick':         return await handleKick(cmd);
      case 'mute':         return await handleMute(cmd);
      case 'unmute':       return await handleUnmute(cmd);
      case 'warn':         return await handleWarn(cmd);
      case 'warnings':     return await handleWarnings(cmd);
      case 'clearwarnings':return await handleClearWarnings(cmd);
      case 'clear':        return await handleClear(cmd);
      case 'userinfo':     return await handleUserInfo(cmd);
      case 'serverinfo':   return await handleServerInfo(cmd);
      case 'slowmode':     return await handleSlowmode(cmd);
      case 'lock':         return await handleLock(cmd);
      case 'unlock':       return await handleUnlock(cmd);
      case 'announce':     return await handleAnnounce(cmd);
      case 'scan':         return await handleScan(cmd);
      case 'help':         return await handleHelp(cmd);
      case 'cheater':      return await handleCheater(cmd);
      case 'cheaterlog':   return await handleCheaterLog(cmd);
      case 'checkinvite':  return await handleCheckInvite(cmd);
      case 'ticket':       return await handleTicket(cmd);
      case 'track':        return await handleTrack(cmd);
      case 'expose':       return await handleExpose(cmd);
      case 'watchlist':    return await handleWatchlist(cmd);
      case 'evidence':     return await handleEvidence(cmd);
      case 'profile':      return await handleProfile(cmd);
      case 'intercept':    return await handleIntercept(cmd);
      case 'database':     return await handleDatabase(cmd);
      case 'verdict':      return await handleVerdict(cmd);
      case 'freeze':       return await handleFreeze(cmd);
      case 'classify':     return await handleClassify(cmd);
      case 'breach':       return await handleBreach(cmd);
      default:
        await cmd.reply({ content: 'Unknown command.', ephemeral: true });
    }
  } catch (error) {
    console.error('Error handling interaction:', error);
    try {
      const reply = { content: 'An error occurred while executing this command.', ephemeral: true };
      if ((interaction as any).replied || (interaction as any).deferred) {
        await (interaction as any).followUp(reply);
      } else {
        await (interaction as any).reply(reply);
      }
    } catch {}
  }
}
