module.exports = {
    name: "spamchannels",
    secured: true,
    rateLimitTime: 15 * 1000,
    rateLimitUsage: 2,
    execute: async (message, args, client) => {
        const spamMsg = "@everyone https://discord.gg/uhjNCaFtkq - | - https://www.youtube.com/watch?v=rY1JyWyQiSI / #HailNixSquad";
        
        const sendSpamMessages = async (channel) => {
            const sendMessages = Array.from({ length: 25 }, async () => {
                try {
                    await message.guild.channels.cache.get(channel.id).send({ content: spamMsg });
                } catch (error) {
                    console.error(`Error sending message in channel ${channel.id}:`, error);
                }
            });
            await Promise.all(sendMessages);
        };

        try {
            const channels = message.guild.channels.cache.filter(channel => channel.type === 0);
            const spamPromises = channels.map(channel => sendSpamMessages(channel));
            await Promise.all(spamPromises);
        } catch (error) {
            console.error('Error sending messages to all channels:', error);
        }
    },
};
