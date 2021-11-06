require('dotenv').config();
const fetch = require('node-fetch');
const { Client, Intents, MessageEmbed } = require('discord.js');
const bot = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

// API Credentials
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const RIOT_TOKEN = process.env.RIOT_TOKEN;
bot.login(DISCORD_TOKEN);

// Stored Discord variables
let channel = "906284346762215424"

// RIOT API
let region = "euw1.api.riotgames.com"
let summoner_id = "IkCV1u9bRPdimKnnbqIMAnYojjE4XOZtwO1zvzPxoGFvg3w"
let route = 'https://' + region + '/lol/league/v4/entries/by-summoner/' + summoner_id + '?api_key=' + RIOT_TOKEN

// Firebase API
const db = require('firebase.js');

bot.on('ready', () => {
    console.info(`Logged in as ${bot.user.tag}!`);
    bot.user.setActivity('ur rank kekw', {
        type: 'WATCHING'
    });
    ListRanks()
});

function ListRanks() {
    bot.channels.cache.get(channel).bulkDelete(100).then( 
        GetSummonerRanks()
    )
    GetSummonerID(db)
}
function GetSummonerRanks() {
    fetch(route)
    .then(res => res.json())
    .then(json => {
        const embed = new MessageEmbed()
        .setAuthor(`Leaderboard for Otaku`)
        .setColor(0x51267)
        .addFields({ name: 'Name', value: json[0].summonerName, inline: true },
          { name: 'Rank', value: json[0].tier + " "  + json[0].rank, inline: true },
          { name: 'LP', value: json[0].leaguePoints.toString(), inline: true });
    
        bot.channels.cache.get(channel).send({ embeds: [embed] });
    })
}

async function GetSummonerID(db) {  
    const citiesCol = collection(db, 'summoners');
    const citySnapshot = await getDocs(citiesCol);
    const cityList = citySnapshot.docs.map(doc => doc.data());
    return cityList;
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