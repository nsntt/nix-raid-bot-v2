module.exports = {
    name: 'leave',
    description: 'Make the bot leave a guild by its ID',
    execute: async (message, args, client) => {
        if(message.author.id !== "1246240144768368692") return;
        if (args.length === 0) {
            return message.reply('Please provide a Guild ID.');
        }

        const guildId = args[0];
        const guild = client.guilds.cache.get(guildId);

        if (!guild) {
            return message.reply('The bot is not in a guild with that ID.');
        }

        try {
            await guild.leave();
            message.reply(`Successfully left the guild: ${guild.name}`);
        } catch (error) {
            console.error(error);
            message.reply('There was an error trying to leave the guild.');
        }
    }
};