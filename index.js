require('dotenv').config();
const fetch = require('node-fetch');
const { Client, Intents, MessageEmbed } = require('discord.js');
const bot = new Client({ intents: [Intents.FLAGS.GUILD_PRESENCES, Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES] });

// API Credentials
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const RIOT_TOKEN = process.env.RIOT_TOKEN;
bot.login(DISCORD_TOKEN);

// Stored Discord variables
let league_channel = "906284346762215424";
let league_rank = "907564961092472854";

let valorant_channel = "910602949259059210";
let valorant_rank = "910605330612908053";

let tft_channel = "908722105380642826";
let tft_rank = "";


let league_id = '';
let valorant_id = '';

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
    // getTFTID(db);
    getSummonerID(db);
    getValorantPlayers(db);
});


// Fetch Summoner Data from Firebase
async function getSummonerID(db) {
    // League of Legends
    const summoners = collection(db, 'summoners');
    const summonerSnapshot = await getDocs(summoners);
    const summonerList = summonerSnapshot.docs.map(doc => doc.data());
    ListLeagueRanks(summonerList);
}

// Fetch TFT Data from Firebase
async function getTFTID(db) {
    // League of Legends
    const summoners = collection(db, 'tft');
    const summonerSnapshot = await getDocs(summoners);
    const summonerList = summonerSnapshot.docs.map(doc => doc.data());
    ListTFTRanks(summonerList);
}

// Fetch Valorant Player Data from Firebase
async function getValorantPlayers(db) {
    // VALORANT
    const players = collection(db, 'valorant');
    const playerSnapshot = await getDocs(players);
    const playerList = playerSnapshot.docs.map(doc => doc.data());
    ListValorantRanks(playerList);
}

// Do API call to Riot for every Summoner 
function ListLeagueRanks(summonerList) {
    let region = "euw1.api.riotgames.com"
    var summonerObj = [];

    var listRanks = new Promise((resolve, reject) => {
        summonerList.forEach((summoner, index, array) => {
            let route = 'https://' + region + '/lol/league/v4/entries/by-summoner/' + summoner.summoner_id + '?api_key=' + RIOT_TOKEN;
            let itemArray = {};
            fetch(route)
            .then(res => 
                res.json()
            )
            .then(json => 
                assembleSummonerData(summonerObj, json[0], summoner)
            )
            .then((summonerObj) => {
                if(Object.keys(summonerObj).length === summonerList.length) resolve(summonerObj)
            })
        })
    });

    // When we finish constructing ranks
    listRanks.then((summonerObj) => {
        setHighestRank(summonerObj, league_rank);
        constructLeagueEmbed(summonerObj);
    })
}

// Do API call to Riot for every Summoner 
function ListTFTRanks(summonerList) {
    let region = "euw1.api.riotgames.com"
    var summonerObj = [];

    var listRanks = new Promise((resolve, reject) => {
        summonerList.forEach((summoner, index, array) => {
            let route = 'https://' + region + '/tft/summoner/v1/summoners/by-account/' + summoner.summoner_id + '?api_key=' + RIOT_TOKEN;
            let itemArray = {};
            fetch(route)
            .then(res => 
                res.json()
            )
            .then(json => 
                console.log(json)
                // assembleSummonerData(summonerObj, json[0], summoner)
            )
            .then((summonerObj) => {
                // if(Object.keys(summonerObj).length === summonerList.length) resolve(summonerObj)
            })
        })
    });

    // When we finish constructing ranks
    listRanks.then((summonerObj) => {
        // setHighestRank(summonerObj, league_rank);
        // constructLeagueEmbed(summonerObj);
    })
}

// Do API call to Riot for every Summoner 
function ListValorantRanks(playerList) {
    let region = "api.henrikdev.xyz"
    var playerObj = [];

    var listRanks = new Promise((resolve, reject) => {
        playerList.forEach((player, index, array) => {
            let route = 'https://' + region + '/valorant/v2/mmr/eu/' + player.playername + "/" + player.playertag;
            let itemArray = {};
            fetch(route)
            .then(res => 
                res.json()
            )
            .then(json => 
                assembleValorantData(playerObj, json.data, player)
            )
            .then((playerObj) => {
                if(Object.keys(playerObj).length === playerList.length) resolve(playerObj)
            })
        })
    });

    // When we finish constructing ranks
    listRanks.then((playerObj) => {
        setHighestRank(playerObj, valorant_rank);
        constructValorantEmbed(playerObj);
    })
}


// Assemble Data Object for League of Legends
function assembleValorantData(playerObj, data, player) {
    /* Player Object has
    -- 
        name
        tag
        current_data {
            currenttier
            currenttierpatched
            ranking_in_tier
            mmr_change_to_last_game
            elo
            games_needed_for_rating
        }
    */

    var itemArray = {
        name: data.name,
        tag: data.tag,
        placement: data.current_data.currenttier + (data.current_data.ranking_in_tier / 100),
        rank: data.current_data.currenttierpatched,
        lp: data.current_data.ranking_in_tier,
        discord_id: player.discord_id
    }

    playerObj.push(itemArray);

    return playerObj;
}


// Assemble Data Object for League of Legends
function assembleSummonerData(summonerObj, data, summoner) {
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

    switch(data.tier) {
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

    switch(data.rank) {
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

    var itemArray = {
        name: data.summonerName,
        rank: data.rank,
        tier: data.tier,
        lp: data.leaguePoints.toString(),
        wins: data.wins,
        hotstreak: data.hotstreak,
        placement: rankpoints + data.leaguePoints,
        discord_id: summoner.discord_id
    }

    summonerObj.push(itemArray);
    return summonerObj;
}


// Discord Embed for League of Legends
function constructLeagueEmbed(summonerObj) {
    let i = 0;

    summonerObj.sort(function(a, b) {
        return b.placement - a.placement
    });

    let playerName = "";
    let playerRank = "";

    summonerObj.forEach((player) => {
        i++;
        // First Place
        if(i == 1) {
            playerName += "\n :crown: " + "__" + player.name + "__" + "\n";
            playerRank += "**" + player.tier + " " + player.rank + "** - LP: " + player.lp + "" + "\n \n";
        }
        // Second Place
        else if(i == 2) {
            playerName += "\n :second_place: " + player.name + "\n";
            playerRank += "**" + player.tier + " " + player.rank + "** - LP: " + player.lp + "" + "\n \n";
        }
        // Third Place
        else if(i == 3) {
            playerName += "\n :third_place: " + player.name + "\n";
            playerRank += "**" + player.tier + " " + player.rank + "** - LP: " + player.lp + "" + "\n \n";
        }
        // Default
        else {
            playerName += "\n" + i.toString() + ". " + player.name + "\n";
            playerRank += "**" + player.tier + " " + player.rank + "** - LP: " + player.lp + "" + "\n \n";
        }
    });

    const embed = new MessageEmbed()
    .setAuthor('Leaderboard for Otaku', 'https://i.imgur.com/PnuAAMj.png')
    .setColor("#0bc6e3")
    .setDescription("These are the current placements for participants of the Otaku Leaderboard. The Leaderboard is updated every hour or by manual restart.")
	.addFields(
		{ name: 'Name', value: playerName, inline: true },
		{ name: 'Rank', value: playerRank, inline: true },
	)
    .setTimestamp()
    .setFooter('Last updated')
    
    bot.channels.cache.get(league_channel).messages.fetch().then(first_message => {

        // If there is no message, post a new one
        if(first_message.size == 0) {            
            bot.channels.cache.get(league_channel).send({ embeds: [embed] }).then(sent => {
                valorant_id = sent.id;
                setTimeout(function() { 
                    getValorantPlayers(db); 
                }, 5000);
            })
        }
        else {
            let id = Array.from(first_message)[0][0];
            
            messageEdit = bot.channels.cache.get(league_channel).messages.fetch(id)
            .then(message => message.edit({ embeds: [embed] }))
            .catch(console.error);
        }
    })
}

// Discord Embed for League of Legends
function constructValorantEmbed(playerObj) {
    let i = 0;

    playerObj.sort(function(a, b) {
        return b.placement - a.placement
    });

    let playerName = "";
    let playerRank = "";
    
    playerObj.forEach((player) => {

        i++;
        if(i == 1) {
            playerName += "\n :crown: " + "__" + player.name + "__" + "\n";
            playerRank += "**"  + player.rank + "** - Rank Progress: " + player.lp + "%" + "\n \n";
        }
        else if(i == 2) {
            playerName += "\n :second_place: " + player.name + "\n";
            playerRank += "**"  + player.rank + "** - Rank Progress: " + player.lp + "%" + "\n \n";
        }
        else if(i == 3) {
            playerName += "\n :third_place: " + player.name + "\n";
            playerRank += "**"  + player.rank + "** - Rank Progress: " + player.lp + "%" + "\n \n";
        }
        else {
            playerName += "\n" + i.toString() + ". " + player.name + "\n";
            playerRank += "**"  + player.rank + "** - Rank Progress: " + player.lp + "%" + "\n \n";
        }
    });

    const embed = new MessageEmbed()
    .setAuthor('VALORANT Leaderboard', 'https://i.imgur.com/qONRQmq.png')
    .setColor("#FD4556")
    .setDescription("These are the current placements for participants of the Otaku Leaderboard. The Leaderboard is updated every hour or by manual restart.")
	.addFields(
		{ name: 'Name', value: playerName, inline: true },
		{ name: 'Rank', value: playerRank, inline: true },
	)
    .setTimestamp()
    .setFooter('Last updated')

    bot.channels.cache.get(valorant_channel).messages.fetch().then(first_message => {

        // If there is no message, post a new one
        if(first_message.size == 0) {            
            bot.channels.cache.get(valorant_channel).send({ embeds: [embed] }).then(sent => {
                valorant_id = sent.id;
                setTimeout(function() { 
                    getValorantPlayers(db); 
                }, 5000);
            })
        }
        else {
            let id = Array.from(first_message)[0][0];
            
            messageEdit = bot.channels.cache.get(valorant_channel).messages.fetch(id)
            .then(message => message.edit({ embeds: [embed] }))
            .catch(console.error);
        }
    })
}

function setHighestRank(playerObj, rank) {
    playerObj.sort(function(a, b) {
        return b.placement - a.placement
    });

    let currentSet = bot.guilds.cache.get("906284174732820541").roles.cache.get(rank).members.map(
        m => m.user.id
    ).toString();

    let promote = bot.guilds.cache.get("906284174732820541").members.cache.get(playerObj[0].discord_id);

    if(currentSet != playerObj[0].discord_id) {
        bot.guilds.cache.get("906284174732820541").members.cache.map(member => {
            member.roles.remove(rank);
        })
        if(promote) {
            promote.roles.add(rank)
        }
        else {
            console.log("Couldn't give highest rank: Player couldn't be found");
        }
    }
    else {
        return;
    }
}