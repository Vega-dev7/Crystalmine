import Eris, { Message, TextChannel } from 'eris';
import chalk from 'chalk';
import fs from 'fs';

const bot = new Eris(process.env.DISCORD_TOKEN);

let inventoryData: { [userId: string]: { [item: string]: number } } = {};
if (fs.existsSync('inventory.json')) {
    const rawData = fs.readFileSync('inventory.json');
    inventoryData = JSON.parse(rawData.toString());
}

// Cooldowns object to track command cooldowns for each user
const cooldowns: { [userId: string]: number } = {};

// Crafting recipes
const craftingRecipes: { [item: string]: { [material: string]: number } } = {
    "Citrine": { "Ruby": 2, "Emerald": 2 }
};

bot.on('ready', () => {
    console.log(chalk.green('Bot is ready!'));
    bot.editStatus('online', {
        name: 'C!help for commands',
        type: 0
    });
});

function sendAbout(msg: Message) {
    const embed = {
        title: 'CrystalMine',
        description: 'CrystalMine is a bot used to trade crystals for pets and items and more stuff. This bot is written in Typescript. The author of the bot is topaz.dev',
        footer: { text: 'Version 1.0.0 (beta) Made With 💖 by *Topaz* ' },
        color: 0x87CEEB,
    };
    bot.createMessage(msg.channel.id, { embed });
}

function sendHelp(msg: Message) {
    const embed = {
        title: 'CrystalMine Commands',
        description: 'Here is all of the commands you can use',
        fields: [
            { name: 'C!About', value: 'Get information about the bot and how it was made.' },
            { name: 'C!help', value: 'Display this help message.' },
            { name: 'C!Code', value: 'This Can help you find the official Crystalmine GitHub repository.' },
            { name: 'C!contributions', value: 'Check The list of Contributors.' },
            { name: 'C!Inventory', value: 'Check Your Inventory' },
            { name: 'C!Mine', value: 'Mine crystal and it will be added to your Inventory' },
        ],
        color: 0x87CEEB,
        footer: { text: 'Version 1.0.0 (beta) Made With 💖 by Topaz ' },
    };
    bot.createMessage(msg.channel.id, { embed });
}

function sendCode(msg: Message) {
    bot.createMessage(msg.channel.id, 'You Can Find the sourceCode at github.com Here is the Repository: https://github.com/Topaz-dev7/Crystalmine');
}

function sendContributions(msg: Message) {
    const embed = {
        title: 'CrystalMine Contributions',
        description: 'Here is a list of the contributors:',
        fields: [
            { name: 'Topaz (Owner)', value: 'Topaz Was the one who created the bot and coded most of the bot.' }
        ],
        color: 0x87CEEB,
        footer: { text: 'Version 1.0.0 (beta) Made With 💖 by Topaz ' },
    };
    bot.createMessage(msg.channel.id, { embed });
}

function sendInventory(msg: Message) {
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
}

function mineCrystal(msg: Message) {
    const userId = msg.author.id;

    // Check if user is on cooldown
    if (cooldowns[userId] && Date.now() - cooldowns[userId] < 60000) {
        bot.createMessage(msg.channel.id, 'You are on cooldown. Please wait before mining again.');
        return;
    }

    // Set cooldown for the user
    cooldowns[userId] = Date.now();

    // Define crystal types and their colors
    const crystals = [
        { type: 'Ruby', color: 0xFF0000 }, // Red for Ruby
        { type: 'Emerald', color: 0x00FF00 }, // Green for Emerald
        { type: 'Diamond', color: 0x0000FF }, // Blue for diamond 
        { type: 'Turquoise', color: 0x008080 },
        // Add more crystal types here
    ];

    // Randomly select a crystal type
    const randomCrystal = crystals[Math.floor(Math.random() * crystals.length)];

    // Update or initialize crystal count in user's inventory
    if (!inventoryData[userId]) {
        inventoryData[userId] = {};
    }
    if (!inventoryData[userId][randomCrystal.type]) {
        inventoryData[userId][randomCrystal.type] = 1;
    } else {
        inventoryData[userId][randomCrystal.type]++;
    }
    fs.writeFileSync('inventory.json', JSON.stringify(inventoryData, null, 2));

    const embed = {
        title: `You Got 1 ${randomCrystal.type}!`,
        description: `A ${randomCrystal.type.toLowerCase()} crystal has been added to your inventory!`,
        color: randomCrystal.color,
        footer: { text: 'Version 1.0.0 (beta) Made With 💖 by Topaz ' },
    };
    bot.createMessage(msg.channel.id, { embed });
}

function craftItem(msg: Message) {
    const userId = msg.author.id;
    const embed = {
        title: 'Crafting Recipes',
        description: 'Select an item to craft:',
        fields: [],
        color: 0xFFA500, // Orange color
        footer: { text: 'Made with 💖 Version 1.0.0 (beta)' },
    };

    // Add crafting recipes as options in the embed
    for (const item in craftingRecipes) {
        embed.fields.push({ name: item, value: 'Craft this item' });
    }

    bot.createMessage(msg.channel.id, { embed }).then((craftMsg) => {
        // Set up a collector to listen for user's choice
        const collector = new Eris.MessageCollector(bot, msg.channel, (m) => m.author.id === userId, {
            time: 60000, // 1 minute
            max: 1,
        });

        collector.on('collect', (responseMsg) => {
            const choice = responseMsg.content.trim();
            if (craftingRecipes[choice]) {
                const materials = craftingRecipes[choice];
                let canCraft = true;

                // Check if user has enough materials to craft
                for (const material in materials) {
                    if (!inventoryData[userId] || !inventoryData[userId][material] || inventoryData[userId][material] < materials[material]) {
                        canCraft = false;
                        break;
                    }
                }

                if (canCraft) {
                    // Remove materials from inventory
                    for (const material in materials) {
                        inventoryData[userId][material] -= materials[material];
                        if (inventoryData[userId][material] === 0) {
                            delete inventoryData[userId][material];
                        }
                    }
                    // Add crafted item to inventory
                    if (!inventoryData[userId][choice]) {
                        inventoryData[userId][choice] = 1;
                    } else {
                        inventoryData[userId][choice]++;
                    }
                    fs.writeFileSync('inventory.json', JSON.stringify(inventoryData, null, 2));
                    bot.createMessage(msg.channel.id, `You have successfully crafted ${choice}!`);
                } else {
                    bot.createMessage(msg.channel.id, 'You do not have enough materials to craft this item.');
                }
            } else {
                bot.createMessage(msg.channel.id, 'Invalid choice. Please select a valid item to craft.');
            }
            collector.stop();
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'limit') {
                bot.createMessage(msg.channel.id, 'Crafting selection timed out. Please try again.');
            }
        });
    }).catch((err) => {
        console.error('Error sending crafting menu:', err);
    });
}

bot.on('messageCreate', (msg: Message) => {
    if (msg.content === 'C!About') {
        sendAbout(msg);
    } else if (msg.content === 'C!help') {
        sendHelp(msg);
    } else if (msg.content === 'C!Code') {
        sendCode(msg);
    } else if (msg.content === 'C!contributions') {
        sendContributions(msg);
    } else if (msg.content === 'C!Inventory') {
        sendInventory(msg);
    } else if (msg.content === 'C!Mine') {
        mineCrystal(msg);
    } else if (msg.content === 'C!craft') {
        craftItem(msg);
    }
});

bot.connect();
