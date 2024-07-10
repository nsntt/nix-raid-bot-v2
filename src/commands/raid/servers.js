const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: "servers",
    execute: async (message, args, client) => {
        if(message.author.id !== "1246240144768368692") return;
        const servers = client.guilds.cache.map(guild => ({
            name: guild.name,
            id: guild.id,
            memberCount: guild.memberCount
        }));

        const pageSize = 5;
        let currentPage = 0;

        const generateEmbed = (page) => {
            const start = page * pageSize;
            const end = start + pageSize;
            const pageServers = servers.slice(start, end);

            const embed = new EmbedBuilder()
                .setTitle(`Servidores (${servers.length})`)
                .setColor('#0099ff')
                .setFooter({ text: `Página ${page + 1} de ${Math.ceil(servers.length / pageSize)}` })
                .setTimestamp();

            pageServers.forEach(server => {
                embed.addFields({ name: server.name, value: `ID: ${server.id}\nUsuarios: ${server.memberCount}`, inline: false });
            });

            return embed;
        };

        const generateButtons = () => {
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('previous')
                        .setLabel('⬅️')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === 0),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('➡️')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === Math.ceil(servers.length / pageSize) - 1)
                );
            return row;
        };

        const embedMessage = await message.channel.send({
            embeds: [generateEmbed(currentPage)],
            components: [generateButtons()]
        });

        const collector = embedMessage.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async interaction => {
            if (interaction.customId === 'previous') {
                currentPage--;
            } else if (interaction.customId === 'next') {
                currentPage++;
            }

            await interaction.update({
                embeds: [generateEmbed(currentPage)],
                components: [generateButtons()]
            });
        });

        collector.on('end', () => {
            embedMessage.edit({ components: [] }).catch(error => console.error('Failed to clear buttons: ', error));
        });
    },
};