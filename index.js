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
let league_channel = "912883650905923614";
let league_rank = "929402150436610068";

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

// Debug
/*
let timer = 5000;
*/

let timer = 3600000;


// Firebase APIs
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc } = require('firebase/firestore');

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
    let summonerObj = [];

    var listRanks = new Promise((resolve, reject) => {
        summonerList.forEach((summoner, index, array) => {
            let route = 'https://' + region + '/lol/league/v4/entries/by-summoner/' + summoner.summoner_id + '?api_key=' + RIOT_TOKEN;
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
        setHighestRank(summonerObj, league_rank);
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
        if(item.queueType == 'RANKED_TFT' || item.queueType == 'RANKED_SOLO_5x5') {
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

            let combined_rank = item.tier + " " + item.rank;

            switch(combined_rank) {
                case 'IRON I':
                    badge = '<:RANK_LEAGUE_IRON1:915721302206201867>';
                break;
                case 'IRON II':
                    badge = '<:RANK_LEAGUE_IRON2:915721315732840458>';
                break;
                case 'IRON III':
                    badge = '<:RANK_LEAGUE_IRON3:915721330521939978>';
                break;
                case 'IRON IV':
                    badge = '<:RANK_LEAGUE_IRON4:915721343037747230>';
                break;
                case 'BRONZE I':
                    badge = '<:RANK_LEAGUE_BRONZE1:915721084874137600>';
                break;
                case 'BRONZE II':
                    badge = '<:RANK_LEAGUE_BRONZE2:915721099927502889>';
                break;
                case 'BRONZE III':
                    badge = '<:RANK_LEAGUE_BRONZE3:915721145280520252>';
                break;
                case 'BRONZE IV':
                    badge = '<:RANK_LEAGUE_BRONZE4:915721161130770453>';
                break;
                case 'SILVER I':
                    badge = '<:RANK_LEAGUE_SILVER1:915721416253513758>';
                break;
                case 'SILVER II':
                    badge = '<:RANK_LEAGUE_SILVER2:915721429503320095>';
                break;
                case 'SILVER III':
                    badge = '<:RANK_LEAGUE_SILVER3:915721441352228924>';
                break;
                case 'SILVER IV':
                    badge = '<:RANK_LEAGUE_SILVER4:915721455499632660>';
                break;
                case 'GOLD I':
                    badge = '<:RANK_LEAGUE_GOLD1:915721242248618054>';
                break;
                case 'GOLD II':
                    badge = '<:RANK_LEAGUE_GOLD2:915721255703953499>';
                break;
                case 'GOLD III':
                    badge = '<:RANK_LEAGUE_GOLD3:915721270702800916>';
                break;
                case 'GOLD IV':
                    badge = '<:RANK_LEAGUE_GOLD4:915721285538050068>';
                break;
                case 'PLATINUM I':
                    badge = '<:RANK_LEAGUE_PLAT1:915721356644085830>';
                break;
                case 'PLATINUM II':
                    badge = '<:RANK_LEAGUE_PLAT2:915721369856118785>';
                break;
                case 'PLATINUM III':
                    badge = '<:RANK_LEAGUE_PLAT3:915721386658529360>';
                break;
                case 'PLATINUM IV':
                    badge = '<:RANK_LEAGUE_PLAT4:915721402273914891>';
                break;
                case 'DIAMOND I':
                    badge = '<:RANK_LEAGUE_DIAMOND1:915721180181307393>';
                break;
                case 'DIAMOND II':
                    badge = '<:RANK_LEAGUE_DIAMOND2:915721195700244570>';
                break;
                case 'DIAMOND III':
                    badge = '<:RANK_LEAGUE_DIAMOND3:915721211810549770>';
                break;
                case 'DIAMOND IV':
                    badge = '<:RANK_LEAGUE_DIAMOND4:915721227153342515>';
                break;
                case 'MASTER':
                    badge = '<:RANK_LEAGUE_MASTER:915721473547698196>';
                break;
                default: 
                    badge = '';
                break;
            }

            var itemArray = {
                name: item.summonerName,
                rank: item.rank,
                tier: item.tier,
                lp: item.leaguePoints.toString(),
                wins: item.wins,
                placement: rankpoints + item.leaguePoints,
                discord_id: summoner.discord_id,
                icon: badge
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
            playerRank += player.icon + " **" + player.tier + " " + player.rank + "** • LP: " + player.lp + " • 1st Places: " + player.wins + "\n \n";
        }
        // Second Place
        else if(i == 2) {
            playerName += "\n :second_place: " + player.name + "\n";
            playerRank += player.icon + " **" + player.tier + " " + player.rank + "** • LP: " + player.lp + " • 1st Places: " + player.wins + "\n \n";
        }
        // Third Place
        else if(i == 3) {
            playerName += "\n :third_place: " + player.name + "\n";
            playerRank += player.icon + " **" + player.tier + " " + player.rank + "** • LP: " + player.lp + " • 1st Places: " + player.wins + "\n \n";
        }
        // Default
        else {
            playerName += "\n" + i.toString() + ". " + player.name + "\n";
            playerRank += player.icon + " **" + player.tier + " " + player.rank + "** • LP: " + player.lp + " • 1st Places: " + player.wins + "\n \n";
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

    bot.channels.cache.get(league_channel).messages.fetch().then(first_message => {

        // If there is no message, post a new one
        if(first_message.size == 0) {            
            bot.channels.cache.get(league_channel).send({ embeds: [embed] }).then(sent => {
                league_id = sent.id;

                clearInterval();
                setInterval(function() { 
                    getTFTID(db); 
                }, timer);
            })
        }
        else {
            let id = Array.from(first_message)[0][0];
            let date = new Date();
            console.log("Updating League Leaderboard - Time: " + date.getHours() + ":" + date.getMinutes())
            
            messageEdit = bot.channels.cache.get(league_channel).messages.fetch(id)
            .then(message => message.edit({ embeds: [embed] }))
            .catch(console.error);

            
            clearInterval();
            setInterval(function() { 
                getSummonerID(db); 
            }, timer);
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
            playerRank += player.icon + " **" + player.tier + " " + player.rank + "** • LP: " + player.lp + " • 1st Places: " + player.wins + "\n \n";
        }
        // Second Place
        else if(i == 2) {
            playerName += "\n :second_place: " + player.name + "\n";
            playerRank += player.icon + " **" + player.tier + " " + player.rank + "** • LP: " + player.lp + " • 1st Places: " + player.wins + "\n \n";
        }
        // Third Place
        else if(i == 3) {
            playerName += "\n :third_place: " + player.name + "\n";
            playerRank += player.icon + " **" + player.tier + " " + player.rank + "** • LP: " + player.lp + " • 1st Places: " + player.wins + "\n \n";
        }
        // Default
        else {
            playerName += "\n" + i.toString() + ". " + player.name + "\n";
            playerRank += player.icon + " **" + player.tier + " " + player.rank + "** • LP: " + player.lp + " • 1st Places: " + player.wins + "\n \n";
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
                }, timer);
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
                getTFTID(db); 
            }, timer);
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
                }, timer);
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
            }, timer);
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