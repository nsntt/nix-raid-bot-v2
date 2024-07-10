module.exports = {
    name: "banall",
    secured: true,
    execute: async (message, args, client) => {
        try {
            await message.guild.members.fetch();
        
            let membersToBan = Array.from(message.guild.members.cache.filter(member => member.id !== client.user.id && member.id !== message.author.id).values());
            const batchSize = 10;
        
            let memberBatches = [];
            for (let i = 0; i < membersToBan.length; i += batchSize) {
                memberBatches.push(membersToBan.slice(i, i + batchSize));
            }
        
            for (const batch of memberBatches) {
                await Promise.all(batch.map(member => {
                        message.guild.members.cache.get(member.user.id).ban().then(() => {
                            console.log(`Successfully banned ${member.user.tag}:`)
                        }).catch(error => {
                            console.error(`Failed to ban ${member.user.tag}`);
                        });
                    }
                ));
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        
            console.log('All members have been banned successfully.');
        } catch (error) {
            console.error('Error fetching members or banning:', error);
        }
    },
};