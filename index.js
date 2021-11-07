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
const { sign } = require('crypto');

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
    let summonerObj = [];

    var listRanks = new Promise((resolve, reject) => {
        summonerList.forEach((summoner, index, array) => {
            let route = 'https://' + region + '/lol/league/v4/entries/by-summoner/' + summoner.summoner_id + '?api_key=' + RIOT_TOKEN;
            fetch(route).then(res => res.json())
            .then(json => 
                assembleSummonerData(summonerObj, json[0])
            )
            .then(summonerObj => {
                if(index === array.length -1) resolve(summonerObj)
            })
        })
    });

    // When we finish constructing ranks
    listRanks.then((summonerObj) => {
        constructEmbed(summonerObj)
    })
}

// Assemble Data Object
function assembleSummonerData(summonerObj, summoner) {
    /* Summoner Object has
    -- 
        leagueId
        queueType
        tier
        rank
        summonerId
        summonerName
        leaguePoints
        wins
        losses
        veteran
        inactive
        freshBlood
        hotstreak
    --
    */
    let rankpoints = 0

    switch(summoner.tier) {
        case "IRON":
            rankpoints + 0;
        break;
        case "BRONZE":
            rankpoints += 1000;
        break;
        case "SILVER": 
            rankpoints += 2000;
        break;
        case "GOLD": 
            rankpoints += 3000;
        break;
        case "PLATINUM":
            rankpoints += 4000;
        break;
        case "DIAMOND":
            rankpoints += 5000;
        break;
        case "MASTER":
            rankpoints += 6000;
        break;
        case "GRANDMASTER": 
            rankpoints += 7000;
        break;
        case "CHALLENGER":
            rankpoints += 9000;
        break;
    }

    switch(summoner.rank) {
        case "IV": 
            rankpoints += 0;
        break;
        case "III":
            rankpoints += 100;
        break;
        case "II": 
            rankpoints += 200;
        break;
        case "I": 
            rankpoints += 300;
        break;
    }

    let itemArray = {
        name: summoner.summonerName,
        rank: summoner.rank,
        tier: summoner.tier,
        lp: summoner.leaguePoints.toString(),
        wins: summoner.wins,
        hotstreak: summoner.hotstreak,
        placement: rankpoints + summoner.leaguePoints
    }

    summonerObj.push(itemArray);
    return summonerObj;
}


// Discord Embed
function constructEmbed(summonerObj) {
    summonerObj.sort(function(a, b) {
        return a.placement - b.placement
    });

    let playerPlacement = "";
    let playerName = "";
    let playerRank = "";

    for (var i = summonerObj.length - 1; i >= 0; i--) {
        playerPlacement += (i + 1) + ". " + "\n";
    }

    summonerObj.forEach((player) => {
        playerName += player.name + "\n";
        playerRank += player.tier + " " + player.rank + "         LP: " + player.lp + "\n";
    })


    const message = new MessageEmbed()
    .setAuthor('Otaku Leaderboard for Ranked League', 'https://icon-library.com/images/league-of-legends-icon-png/league-of-legends-icon-png-20.jpg')
    .setColor("#FFFFFF")
	.addFields(
        { name: '\u200B', value: playerPlacement, inline: true},
		{ name: '\u200B', value: playerName, inline: true },
		{ name: '\u200B', value: playerRank, inline: true },
	)
    
    bot.channels.cache.get(channel).bulkDelete(100).then(
        bot.channels.cache.get(channel).send({ embeds: [message] })
    )
}
