require('dotenv').config();
const fetch = require('node-fetch');
const { Client, Intents, MessageEmbed } = require('discord.js');
const bot = new Client({ intents: [Intents.FLAGS.GUILD_PRESENCES, Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES] });

// API Credentials
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const RIOT_TOKEN = process.env.RIOT_TOKEN;
const RIOT_TFT_TOKEN = process.env.RIOT_TFT_TOKEN;
bot.login(DISCORD_TOKEN);

// Stored Discord variables
let league_channel = "906284346762215424";
let league_rank = "907564961092472854";

// Valorant
let valorant_channel = "910602949259059210";
let valorant_rank = "910605330612908053";

// TFT
let tft_channel = "912879775259971585";
let tft_rank = "912879987504332840";

// Empty variables
let league_id = '';
let valorant_id = '';
let tft_id = '';

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
    getTFTID(db);
    // getSummonerID(db);
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
    // TFT
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
        // setHighestRank(summonerObj, league_rank);
        constructLeagueEmbed(summonerObj);
    })
}

// Do API call to Riot for every Summoner 
function ListTFTRanks(summonerList) {
    let region = "euw1.api.riotgames.com"
    let summonerObj = [];

    var listRanks = new Promise((resolve, reject) => {
        summonerList.forEach((summoner, index, array) => {
            let route = 'https://' + region + '/tft/league/v1/entries/by-summoner/' + summoner.summoner_id + '?api_key=' + RIOT_TFT_TOKEN;
            fetch(route)
            .then(res => 
                res.json()
            )
            .then(json => 
                assembleSummonerData(summonerObj, json, summoner)
            )
            .then((summonerObj) => {
                if(Object.keys(summonerObj).length === summonerList.length) resolve(summonerObj)
            })
        })
    });

    // When we finish constructing ranks
    listRanks.then((summonerObj) => {
        setHighestRank(summonerObj, tft_rank);
        constructTFTEmbed(summonerObj);
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
   let badge = '';

    switch(data.current_data.currenttierpatched) {
        case 'Iron 1':
            badge = '<:RANK_Iron1:912932890151620620>';
        break;
        case 'Iron 2':
            badge = '<:RANK_Iron2:912932906119356456>';
        break;
        case 'Iron 3':
            badge = '<:RANK_Iron3:912932919893454878>';
        break;
        case 'Bronze 1':
            badge = '<:RANK_Bronze1:912932942202937354>';
        break;
        case 'Bronze 2':
            badge = '<:RANK_Bronze2:912932957315026954>';
        break;
        case 'Bronze 3':
            badge = '<:RANK_Bronze3:912932972276109373>';
        break;
        case 'Silver 1':
            badge = '<:RANK_Silver1:912932990248693760>';
        break;
        case 'Silver 2':
            badge = '<:RANK_Silver2:912933004291244063>';
        break;
        case 'Silver 3':
            badge = '<:RANK_Silver3:912933018237280277>';
        break;
        case 'Gold 1':
            badge = '<:RANK_Gold1:912933035756908584>';
        break;
        case 'Gold 2':
            badge = '<:RANK_Gold2:912933052760596502>';
        break;
        case 'Gold 3':
            badge = '<:RANK_Gold3:912933067834945638>';
        break;
        case 'Platinum 1':
            badge = '<:RANK_Plat1:912933083873935360>';
        break;
        case 'Platinum 2':
            badge = '<:RANK_Plat2:912933097924853810>';
        break;
        case 'Platinum 3':
            badge = '<:RANK_Plat3:912933114769199125>';
        break;
        default: 
            badge = '';
        break;
    }

    var itemArray = {
        name: data.name,
        tag: data.tag,
        placement: data.current_data.currenttier + (data.current_data.ranking_in_tier / 100),
        rank: data.current_data.currenttierpatched,
        lp: data.current_data.ranking_in_tier,
        discord_id: player.discord_id,
        icon: badge
    }

    playerObj.push(itemArray);

    return playerObj;
}


// Assemble Data Object for League of Legends
function assembleSummonerData(summonerObj, data, summoner) {
    data.forEach(item => {
        if(item.queueType == 'RANKED_TFT') {
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

            switch(item.tier) {
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

            switch(item.rank) {
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
                name: item.summonerName,
                rank: item.rank,
                tier: item.tier,
                lp: item.leaguePoints.toString(),
                wins: item.wins,
                placement: rankpoints + item.leaguePoints,
                discord_id: summoner.discord_id
            }

            summonerObj.push(itemArray);
        }
        else {
        }
    })
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
            playerRank += "<:RANK_Silver2:912932990248693760>";
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
    .setFooter('Developed by Jes - Last updated')
    
    bot.channels.cache.get('906284346762215424').messages.fetch().then(first_message => {

        // If there is no message, post a new one
        if(first_message.size == 0) {            
            bot.channels.cache.get('906284346762215424').send({ embeds: [embed] }).then(sent => {
                valorant_id = sent.id;

                clearInterval();
                setInterval(function() { 
                    getSummonerID(db); 
                }, 3600000);
            })
        }
        else {
            let id = Array.from(first_message)[0][0];
            let date = new Date();
            console.log("Updating League Leaderboard - Time: " + date.getHours() + ":" + date.getMinutes())
            
            messageEdit = bot.channels.cache.get('906284346762215424').messages.fetch(id)
            .then(message => message.edit({ embeds: [embed] }))
            .catch(console.error);

            
            clearInterval();
            setInterval(function() { 
                getSummonerID(db); 
            }, 3600000);
        }
    })
}



// Discord Embed for League of Legends
function constructTFTEmbed(summonerObj) {
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
            playerRank += "**" + player.tier + " " + player.rank + "** • LP: " + player.lp + " • 1st Places: " + player.wins + "\n \n";
        }
        // Second Place
        else if(i == 2) {
            playerName += "\n :second_place: " + player.name + "\n";
            playerRank += "**" + player.tier + " " + player.rank + "** • LP: " + player.lp + " • 1st Places: " + player.wins + "\n \n";
        }
        // Third Place
        else if(i == 3) {
            playerName += "\n :third_place: " + player.name + "\n";
            playerRank += "**" + player.tier + " " + player.rank + "** • LP: " + player.lp + " • 1st Places: " + player.wins + "\n \n";
        }
        // Default
        else {
            playerName += "\n" + i.toString() + ". " + player.name + "\n";
            playerRank += "**" + player.tier + " " + player.rank + "** • LP: " + player.lp + " • 1st Places: " + player.wins + "\n \n";
        }
    });

    const embed = new MessageEmbed()
    .setAuthor('TFT Leaderboard for Otaku', 'https://i.imgur.com/opRzRkX.png')
    .setColor("#f5af3e")
    .setDescription("These are the current placements for participants of the Otaku Leaderboard. The Leaderboard is updated every hour or by manual restart.")
	.addFields(
		{ name: 'Name', value: playerName, inline: true },
		{ name: 'Rank', value: playerRank, inline: true },
	)
    .setTimestamp()
    .setFooter('Developed by Jes - Last updated')
    
    bot.channels.cache.get(tft_channel).messages.fetch().then(first_message => {

        // If there is no message, post a new one
        if(first_message.size == 0) {            
            bot.channels.cache.get(tft_channel).send({ embeds: [embed] }).then(sent => {
                tft_id = sent.id;

                clearInterval();
                setInterval(function() { 
                    getTFTID(db); 
                }, 3600000);
            })
        }
        else {
            let id = Array.from(first_message)[0][0];
            let date = new Date();
            console.log("Updating TFT Leaderboard - Time: " + date.getHours() + ":" + date.getMinutes())
            
            messageEdit = bot.channels.cache.get(tft_channel).messages.fetch(id)
            .then(message => message.edit({ embeds: [embed] }))
            .catch(console.error);

            
            clearInterval();
            setInterval(function() { 
                getSummonerID(db); 
            }, 3600000);
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
            playerRank += player.icon + "**"  + player.rank + "** - Rank Progress: " + player.lp + "%" + "\n \n";
        }
        else if(i == 2) {
            playerName += "\n :second_place: " + player.name + "\n";
            playerRank += player.icon + "**"  + player.rank + "** - Rank Progress: " + player.lp + "%" + "\n \n";
        }
        else if(i == 3) {
            playerName += "\n :third_place: " + player.name + "\n";
            playerRank += player.icon + "**"  + player.rank + "** - Rank Progress: " + player.lp + "%" + "\n \n";
        }
        else {
            playerName += "\n" + i.toString() + ". " + player.name + "\n";
            playerRank += player.icon + "**"  + player.rank + "** - Rank Progress: " + player.lp + "%" + "\n \n";
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
    .setFooter('Developed by Jes - Last updated')

    bot.channels.cache.get(valorant_channel).messages.fetch().then(first_message => {

        // If there is no message, post a new one
        if(first_message.size == 0) {            
            bot.channels.cache.get(valorant_channel).send({ embeds: [embed] }).then(sent => {
                valorant_id = sent.id;
                clearInterval();
                setInterval(function() { 
                    getValorantPlayers(db); 
                }, 3600000);
            })
        }
        else {
            let id = Array.from(first_message)[0][0];

            
            let date = new Date();
            console.log("Updating Valorant Leaderboard - Time: " + date.getHours() + ":" + date.getMinutes())
            
            messageEdit = bot.channels.cache.get(valorant_channel).messages.fetch(id)
            .then(message => message.edit({ embeds: [embed] }))
            .catch(console.error);

            clearInterval();
            setInterval(function() { 
                getValorantPlayers(db); 
            }, 3600000);
        }
    })
}

async function setHighestRank(playerObj, rank) {
    playerObj.sort(function(a, b) {
        return b.placement - a.placement
    });

    const guild = await bot.guilds.cache.get("547487272124153865");

    let currentSet = guild.roles.cache.get(rank).members.map(
        m => m.user.id
    ).toString();

    let promote = guild.members.cache.get(playerObj[0].discord_id);

    if(currentSet != playerObj[0].discord_id) {
        guild.members.cache.map(member => {
            member.roles.remove(rank).then(
                promote.roles.add(rank)               
            );
        })
    }
    else {
        return;
    }
}