const fs = require('fs');
const path = require('path');

const premiumsPath = path.join(__dirname, '../../premiums.json');

module.exports = {
    name: 'removepremium',
    description: 'Remove a user from the premium list',
    execute: async (message, args, client) => {
        if(message.author.id !== "1246240144768368692") return;
        if (!args.length) {
            return message.reply('Please provide a user ID or mention.');
        }

        let userId;

        const mention = args[0].match(/^<@!?(\d+)>$/);
        if (mention) {
            userId = mention[1];
        } else if (/^\d+$/.test(args[0])) {
            userId = args[0];
        } else {
            return message.reply('Invalid user ID or mention.');
        }

        let premiums = {};
        if (fs.existsSync(premiumsPath)) {
            premiums = JSON.parse(fs.readFileSync(premiumsPath, 'utf8'));
        }

        if (!premiums[userId]) {
            return message.reply('This user is not in the premium list.');
        }
        delete premiums[userId];

        fs.writeFileSync(premiumsPath, JSON.stringify(premiums, null, 2));

        message.reply(`User <@${userId}> (${userId}) has been removed from the premium list.`);
    }
};