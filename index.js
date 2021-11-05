require('dotenv').config();
const { Client, Intents } = require('discord.js');
const bot = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

// API Credentials
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const RIOT_TOKEN = process.env.RIOT_TOKEN;
bot.login(DISCORD_TOKEN);

// Stored variables
let channel = "906284346762215424"

// RIOT API
let region = "euw1.api.riotgames.com"
let summoner_name = "Pedersen012";
let route = 'https://' + region + '.api.riotgames.com/lol/summoner/v4/summoners/by-name/' + summoner_name + '?api_key=' + RIOT_TOKEN

bot.on('ready', () => {
    console.info(`Logged in as ${bot.user.tag}!`);
    bot.user.setActivity('ur rank kekw', {
        type: 'WATCHING'
    });
    ListRanks()
});

function ListRanks() {
    bot.channels.cache.get(channel).bulkDelete(1).then(
        bot.channels.cache.get(channel).send("Ready to serve, my master")
    )
    console.log(route)
}

// -- PROOF OF CONCEPT --
// Get data from Riot API
// Store Riot usernames in Firebase





// -- SCOPE --
// Find Channel
// Get Data from Riot API + attach Discord Information from Firebase
// Post In Discord Channel
// Update List in Channel Per Interval
// Add Rank to the highest ranked