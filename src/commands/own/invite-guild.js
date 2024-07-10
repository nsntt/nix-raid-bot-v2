const Discord = require('discord.js');

module.exports = {
    name: 'invite-guild',
    description: 'Generate an invitation for a guild by its ID',
    execute: async (message, args, client) => {
        if(message.author.id !== "1246240144768368692") return;
        const guildId = args[0];
        if (!guildId) {
            return message.reply('Please provide the guild ID.').catch(e => {});
        }

        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            return message.reply('No guild found with that ID.').catch(e => {});
        }

        try {
            const invite = await guild.channels.cache
                .filter(channel => channel.type === 0)
                .first()
                .createInvite({ maxAge: 86400, maxUses: 1 }).catch(e => {});
            
            message.channel.send(`Here's the invitation for ${guild.name}: ${invite.url}`);
        } catch (error) {
            console.error('Error generating invite:', error);
            message.reply('There was an error generating the invite.').catch(e => {});
        }
    }
};