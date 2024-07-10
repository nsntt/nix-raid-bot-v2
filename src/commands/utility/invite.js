module.exports = {
    name: "invite",
    execute: async (message, args, client) => {
        const embed = {
            title: "<:blackstar:1248808853299269672>    Invite Application",
            url: "https://discord.com/oauth2/authorize?client_id=1251384499229429801&permissions=8&integration_type=0&scope=bot",
            description: "Click the link above to invite the bot to your server.",
            color: null,
            footer: {
                text: `Requested by ${message.author.username}`
            }
        };

        try {
            await message.author.send({ embeds: [embed] }).catch(e => { return message.reply("I couldn't send you a DM. Please check your DM settings and try again.").catch(e => {}); });;
            message.reply("I've sent you a DM with the invite link!").catch(e => {});
        } catch (error) {
            console.error("Could not send DM to the user.", error);
            return message.reply("I couldn't send you a DM. Please check your DM settings and try again.").catch(e => {});
        }
    }
};