import Eris, { Message } from 'eris';
import chalk from 'chalk';
import fs from 'fs';

const bot = new Eris(process.env.DISCORD_TOKEN);


let inventoryData = {};
if (fs.existsSync('inventory.json')) {
    const rawData = fs.readFileSync('inventory.json');
    inventoryData = JSON.parse(rawData);
}

bot.on('ready', () => {
    console.log(chalk.green('Bot is ready!'));
});

bot.on('messageCreate', (msg: Message) => {
    if (msg.content === 'C!About') {
        const embed = {
            title: 'CrystalMine',
            description: 'CrystalMine is a bot used to trade crystals for pets and items and more stuff. This bot is written in Typescript. The author of the bot is topaz.dev',
            footer: { text: 'Version 1.0.0 (beta) Made With 💖 by *Topaz* ' }, 
            color: 0x87CEEB, 
        };
        bot.createMessage(msg.channel.id, { embed });
    } else if (msg.content === 'C!help') {
        const embed = {
            title: 'CrystalMine Commands',
            description: 'Here is all of the commands you can use',
            fields: [
                { name: 'C!About', value: 'Get information about the bot and how it was made.' },
                { name: 'C!help', value: 'Display this help message.' }, 
                { name: 'C!Code', value: 'This Can help you find the official Crystalmine GitHub repository.' }, 
                { name: 'C!contributions', value: 'Check The list of Contributors.' }, 
                { name: 'C!Inventory', value: 'Check Your Inventory' }, 
              { name: 'C!Mine', value: 'Mine crystal and it will be added to your Inventory'}, 
            ],
            color: 0x87CEEB,
            footer: { text: 'Version 1.0.0 (beta) Made With 💖 by Topaz ' }, 
        };
        bot.createMessage(msg.channel.id, { embed });
    } else if (msg.content === 'C!Code') {
        bot.createMessage(msg.channel.id, 'You Can Find the sourceCode at github.com Here is the Repository: https://github.com/Topaz-dev7/Crystalmine');
    } else if (msg.content === 'C!contributions') {
        const embed = {
            title: 'CrystalMine Contributions', 
            description: 'Here is a list of the contributors:', 
            fields: [
                { name: 'Topaz (Owner)', value: 'Topaz Was the one who created the bot and coded most of the bot.'}
            ], 
            color: 0x87CEEB,
            footer: { text: 'Version 1.0.0 (beta) Made With 💖 by Topaz ' }, 
        };
        bot.createMessage(msg.channel.id, { embed });
    } else if (msg.content === 'C!Inventory') {
        const userId = msg.author.id;
        const userInventory = inventoryData[userId] || {};
        let inventoryMessage = '';
        for (const crystalType in userInventory) {
            inventoryMessage += `${crystalType}: ${userInventory[crystalType]}\n`;
        }
        if (inventoryMessage === '') {
            bot.createMessage(msg.channel.id, 'You have nothing in your inventory.');
        } else {
            const embed = {
                title: `${msg.author.username}'s Inventory`,
                description: inventoryMessage,
                color: 0x00FF00, 
                footer: { text: 'Version 1.0.0 (beta) Made With 💖 by Topaz ' }, 
            };
            bot.createMessage(msg.channel.id, { embed });
        }
    } else if (msg.content === 'C!Mine') {
        const userId = msg.author.id;
        const crystalType = 'Ruby'; 
        if (!inventoryData[userId]) {
            inventoryData[userId] = {};
        }
        if (!inventoryData[userId][crystalType]) {
            inventoryData[userId][crystalType] = 1;
        } else {
            inventoryData[userId][crystalType]++;
        }
        fs.writeFileSync('inventory.json', JSON.stringify(inventoryData, null, 2));

        const embed = {
            title: 'Ruby Crystal Spawned!',
            description: 'A ruby crystal has appeared in your mine!',
            color: 0xFF0000, 
            footer: { text: 'Version 1.0.0 (beta) Made With 💖 by Topaz ' }, 
        };
        bot.createMessage(msg.channel.id, { embed });
    }
});

bot.connect();
