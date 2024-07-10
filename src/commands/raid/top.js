const topRaids = require('../../topraids.json');

module.exports = {
    name: 'top',
    description: 'Displays the top 10 raids by member count',
    execute: async (message, args, client) => {
        try {
            if (!topRaids || topRaids.length === 0) {
                return message.reply('No raid data found.');
            }
    
            topRaids.sort((a, b) => b.memberCount - a.memberCount);
    
            const embed = {
                title: 'Top 10 Raids',
                description: 'Here are the top 10 raids by member count:',
                color: null,
                fields: topRaids.slice(0, 10).map((raid, index) => ({
                    name: `#${index + 1} - ${raid.guildName} (${raid.memberCount} members)`,
                    value: `Executed by: ${raid.userName} on ${new Date(raid.timestamp).toLocaleString('en-US', { timeZone: 'UTC' })}`
                }))
            };
    
            message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error displaying top raids:', error);
            message.reply('An error occurred while displaying top raids.');
        }
    }
};
