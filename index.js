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

// Firebase APIs
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: process.env.apiKey,
    authDomain: process.env.authDomain,
    projectId: process.env.projectId,
    storageBucket: process.env.storageBucket,
    messagingSenderId: process.env.messagingSenderId,
    appId: process.env.appId,
    measurementId: process.env.measurementId
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// Bot Startup
bot.on('ready', () => {
    console.info(`Logged in as ${bot.user.tag}!`);
    bot.user.setActivity('ur rank kekw', {
        type: 'WATCHING'
    });
    getSummonerID(db);
});


// Fetch Summoner Data from Firebase
async function getSummonerID(db) {
    const summoners = collection(db, 'summoners');
    const summonerSnapshot = await getDocs(summoners);
    const summonerList = summonerSnapshot.docs.map(doc => doc.data());

    ListRanks(summonerList);
}

// Do API call to Riot for every Summoner 
function ListRanks(summonerList) {
    let region = "euw1.api.riotgames.com"

    summonerList.forEach(summoner => {
        let route = 'https://' + region + '/lol/league/v4/entries/by-summoner/' + summoner.summoner_id + '?api_key=' + RIOT_TOKEN;
        fetch(route).then(res => res.json())
        .then(json => 
            assembleSummonerData(json[0])
        )
    });
}

// Assemble Data Object
function assembleSummonerData(summoner) {
    let summonerObj = [];

    let itemArray = {
        name: summoner.summonerName,
        rank: summoner.rank,
        tier: summoner.tier,
        lp: summoner.leaguePoints
    }

    summonerObj.push(itemArray);
    console.log(summonerObj);
}


// Discord Embed
function GetSummonerRanks() {
    fetch(route)
    .then(res => res.json())
    .then(json => {
        const embed = new MessageEmbed()
        .setAuthor(`Leaderboard for Otaku`)
        .setColor("#FFFFFF")
        .addFields({ name: 'Name', value: json[0].summonerName, inline: true },
          { name: 'Rank', value: json[0].tier + " "  + json[0].rank, inline: true },
          { name: 'LP', value: json[0].leaguePoints.toString(), inline: true });
    
        bot.channels.cache.get(channel).send({ embeds: [embed] });
    })
}
