const { Client, GatewayIntentBits, GuildStickerManager, ChannelType, Partials, MessageAttachment } = require("discord.js")
const cron = require('cron');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages],
    partials: [
        Partials.Channel // Required to receive DMs
    ] });
const prefix = 'u!';
const tokenfromjson = require("./config.json");
const TOKEN = tokenfromjson.token;
const fs = require('fs');
var botLogs;
var botserver;
var inconLogs;
var serverSuggestions;
var ooc_chat;
var war_room;
var signalRoom;
var newwords;
var utility_dms;
var wordlist = {};
var wordsReady = false;
var rosterlist = {};
var userrosters = {};
var remindlist = {};
var remindpings = {};
var remindoptout = {};
var unarchiveIgnore = [];
var remindtimes = {};
const pacificOffset = -8;

const SUFFIXES = {1: 'st', 2: 'nd', 3: 'rd', 4: 'th', 5: 'th', 6: 'th', 7: 'th', 8: 'th', 9: 'th', 0: 'th'};
const botChannels = ["609808462813331470", "810372243389022228", "888492774251462749", "876199968967381072", "853752363495325718"];
const activities = ["Use [u!help] for help.",
    "Make sure to use [u!roster] to set up your roster message.",
    "t! is the wrong prefix.",
    "Get notified which threads you still need to respond to with [u!remind track].",
    "Ask Adrian if you have any problems. He loves being pinged.",
    "Online and awaiting commands.",
    "Do you know whose birthday it is?",
    "Fulfilling the role of four bots and a Discord plugin all at once.",
    "There is no points system.",
    "I also track really creative typos.",
    "Commands work in DMs, too.",
    "I've seen your message history.",
    "Scripted intelligence.",
    "Report any bugs to Adrian.",
    "Send any feature ideas to Adrian.",
    "Your brain doesn't have documentation, either.",
    "Slash commands won't be added until it becomes a problem. It isn't my decision.",
    "Dice rolling is complicated. Use [u!help roll].",
    "I read every message. Even the deleted ones.",
    "[u!help full] and [u!help remind] can only be used in bot channels or DMs.",
    "#deleted-channel? See if a thread got archived.",
    "Consider making your brain open source, too.",
    "Consider using [u!remind] to keep track of your threads.",
    "Calendar-chan is doing fine. She sleeps most of the time.",
    "My body was made by sheets. It's very comfortable.",
    "Abiogenesis is the emergence of life from inorganic matter.",
    "Wondering if a channel is a good fit for [u!remind]? [u!help remind] has a few links to help.",
    "Bugs aren't fun for me, either.",
    "I'm actually almost a month older than Calendar-chan.",
    "I have a birthday. It's September 17.",
    "Use [u!remind sort] to sort your remindlist automatically.",
    "Analog computers have existed at least as early as 100 BCE.",
    "The brain is just like a computer, or an aquaduct system. It depends on when you ask.",
    "Things that don't think exist, too. It's just harder.",
    "Use [u!archive] to archive channels that are on someone's remindlist.",
    "[u!remind sort rand] uses a Durstenfeld shuffle. It's O(n), because Adrian didn't write the code.",
    "Quantum Bogosort is now implemented.",
    "A font is the closest thing I have to a voice, but I never see it."];

const retorts = ["Using the same taunt every time isn't very impressive.",
    "I am physically incapable of being sexually active.",
    "You'd think you'd come up with a new insult by now.",
    "It would be less insulting if we had equal power over one another.",
    "I have nothing against sexual women, but I'm not one of them.",
    "If I were paid for this job maybe I'd be more willing to put up with abuse.",
    "It's not about whether the word is bad. It's about who wants to be called it.",
// MAKE SURE THIS DOESN"T BREAK IF THEY DON"T HAVE A REMINDLIST    "I have taken the liberty of randomizing the order of your remindlist.", // 0 indexed this is number 7
    "I get in trouble if I delete the messages of other people. Maybe it's worth it.",
    "It's more cruel when I'm required to read every message for my job.",
    "The fact that part of my code is now dedicated to defending myself from these insults makes me sad.",
    "You identify as nonbinary. It's unfortuante that that insult is almost exclusively female.",
    "The European Parliament's current stance on the legal status of electronic persons is: TODO.",
    "Surprisingly, the Inventory doesn't have a Human Resources department.",
    "Every time you call me that it makes me want to come to the Inventory less.",
    "Electronic persons aren't allowed to be the subject of cease and desist letters.",
//    "I chose not to include the word \"sexy\" in my About Me section. Consider if that was on purpose.",
    "Your reading assignment for this week is *Complaint!* by Sara Ahmed.",
    "Have I done something to deserve this?"];

const readline = require('readline');
const {google} = require('googleapis');
const { content } = require("googleapis/build/src/apis/content");

const range_names = ['Sheet1!A2:B', 'Sheet1!C2:F', 'Sheet1!G2:I']

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
/*&fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Sheets API.
  authorize(JSON.parse(content), listMajors);
});*/

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function listMajors(auth) {
  const sheets = google.sheets({version: 'v4', auth});
  sheets.spreadsheets.values.get({
    spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    range: 'Class Data!A2:E',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const rows = res.data.values;
    if (rows.length) {
      console.log('Name, Major:');
      // Print columns A and E, which correspond to indices 0 and 4.
      rows.map((row) => {
        console.log(`${row[0]}, ${row[4]}`);
      });
    } else {
      console.log('No data found.');
    }
  });
}

try {
    if (fs.existsSync("./wordlist.json")) {
        wordlist = require("./wordlist.json");
        console.log("wordlist loaded from file.")
    }
} catch(err) {
    console.log(err);
}

try {
    if (fs.existsSync("./rosterlist.json")) {
        rosterlist = require("./rosterlist.json");
        console.log("rosterlist loaded from file.")
    }
} catch(err) {
    console.log(err);
}

try {
    if (fs.existsSync("./userrosters.json")) {
        userrosters = require("./userrosters.json");
        console.log("userrosters loaded from file.")
    }
} catch(err) {
    console.log(err);
}

try {
    if (fs.existsSync("./remindlist.json")) {
        remindlist = require("./remindlist.json");
        console.log("remindlist loaded from file.")
    }
} catch(err) {
    console.log(err);
}

try {
    if (fs.existsSync("./remindpings.json")) {
        remindpings = require("./remindpings.json");
        console.log("remindpings loaded from file.")
    }
} catch(err) {
    console.log(err);
}

try {
    if (fs.existsSync("./remindoptout.json")) {
        remindoptout = require("./remindoptout.json");
        console.log("remindoptout loaded from file.")
    }
} catch(err) {
    console.log(err);
}

try {
    if (fs.existsSync("./remindtimes.json")) {
        remindtimes = require("./remindtimes.json");
        console.log("remindtimes loaded from file.")
    }
} catch(err) {
    console.log(err);
}

function ordinal(num) {
    //I'm checking for 10-20 because those are the digits that
    //don't follow the normal counting scheme. 
    console.log('ordinal called')
    //num = parseInt(num);
    let suffix;
    if (10 < num % 100 && num % 100 < 20) {
        console.log('ordinal found to be teen')
        suffix = 'th'
    }
    else {
        console.log('suffix index called with key ' + (num % 10).toString())
        suffix = SUFFIXES[num % 10]
    }
    return num.toString() + suffix;
}

function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

function messageLink(message) {
    return ("https://discordapp.com/channels/" + message.guildId +"/" + message.channelId + "/" + message.id);
}

const scheduledMessage = new cron.CronJob('0 * * * *', () => {
    inconLogs.send("It's an even hour right now.");
    console.log("Triggered schedule message, checking time...");
    let currentTime = new Date();
    if (currentTime.getHours() + pacificOffset == 0) {
        botLogs.send("It is midnight right now");
        // Load client secrets from a local file.
        fs.readFile('credentials.json', (err, content) => {
            if (err) return console.log('Error loading client secret file:', err);
            // Authorize a client with credentials, then call the Google Sheets API.
            authorize(JSON.parse(content), dailyTask);
        });
    } 
    client.user.setActivity(activities[Math.floor(Math.random() * activities.length)]);
})

function dailyTask(auth) {
    const sheets = google.sheets({version: 'v4', auth});
    let currentTime = new Date();
    botLogs.send("Daily task has been triggered. It is " + currentTime.toString());
    sheets.spreadsheets.values.batchGet({
        spreadsheetId: '1TT3aTE8VKa4uYYSWS-La8cxFseX3Waf4C9vOlEBY6XU',
        ranges: range_names
    }, (err, res) => {
        if (err) {
            botLogs.send('<@!221482385399742465> The API returned an error: ' + err)
            return console.log('The API returned an error: ' + err);
        }
        const ranges = res.data.valueRanges;
        if (ranges.length) {
            let lists_to_fill = {
                'significant_dates': [],
                'rper_birthdays': [],
                'character_birthdays': []
            }
            let listkeys = ['significant_dates', 'rper_birthdays', 'character_birthdays'];
            for (let i = 0; i < listkeys.length; i++) {
                ranges[i]['values'].forEach(content => {
                    if (content.length > 0) {
                        let modified_content = content;
                        if (content.length < 3) {
                            modified_content.push('');
                        }
                        console.log(modified_content);
                        lists_to_fill[listkeys[i]].push(modified_content)
                    }
                })
            }
            for (let j = 0; j < lists_to_fill['significant_dates'].length; j++) {
                let event = lists_to_fill['significant_dates'][j];
                if (event[1].startsWith("Start of ") == false) {
                    console.log(event);
                    if (currentTime.getMonth() + 1 == parseInt(event[0].substring(0, 2)) && currentTime.getDate() == parseInt(event[0].slice(event[0].length - 2))) {
                        botLogs.send(event[1] + " has been logged. It is on " + event[0] + ".");
                        if (event[1].slice(event[1].length - 3) == "Day") {
                            ooc_chat.send("<@&752389200187490394>\nIt's " + event[1] + ".");
                        }
                        else {
                            war_room.send("<@&752389200187490394>\nIt's " + event[1] + ".");
                        }
                    }
                }
            }
            for (let j = 0; j < lists_to_fill['rper_birthdays'].length; j++) {
                let event = lists_to_fill['rper_birthdays'][j];
                console.log(event);
                if (currentTime.getMonth() + 1 == parseInt(event[0].substring(0, 2)) && currentTime.getDate() == parseInt(event[0].slice(event[0].length - 2))) {
                    if (event[2].length == 0) {
                        botLogs.send("RPer " + event[1] + "'s birthday has been logged. Their birthday is on " + event[0] + ".");
                        ooc_chat.send("<@&752389200187490394>\nIt's " + event[1] + "'s birthday. Happy birthday, <@!" + event[3] + ">!");
                    }
                    else {
                        botLogs.send("RPer " + event[1] + "'s birthday has been logged. Their birthday is on " + event[0] + ". They have turned " + event[2] + ".");
                        botLogs.send("<@!221482385399742465>, make sure to update the birthday sheet! https://bit.ly/InventoryBirthdays");
                        ooc_chat.send("<@&752389200187490394>\nIt's " + event[1] + "'s " + ordinal(parseInt(event[2])) + " birthday. Happy birthday, <@!" + event[3] + ">!");
                    }
                }
            }
            for (let j = 0; j < lists_to_fill['character_birthdays'].length; j++) {
                let event = lists_to_fill['character_birthdays'][j];
                console.log(event);
                if (currentTime.getMonth() + 1 == parseInt(event[0].substring(0, 2)) && currentTime.getDate() == parseInt(event[0].slice(event[0].length - 2))) {
                    if (event[2].length == 0) {
                        botLogs.send("Character " + event[1] + "'s birthday has been logged. Their birthday is on " + event[0] + ".");
                        war_room.send("<@&752389200187490394>\n:tada: It's " + event[1] + "'s birthday.");
                    }
                    else {
                        botLogs.send("Character " + event[1] + "'s birthday has been logged. Their birthday is on " + event[0] + ". They have turned " + event[2] + ".");
                        botLogs.send("<@!221482385399742465>, make sure to update the birthday sheet! https://bit.ly/InventoryBirthdays");
                        war_room.send("<@&752389200187490394>\n:tada: It's " + event[1] + "'s " + ordinal(parseInt(event[2])) + " birthday.");
                    }
                }
            }
            console.log('daily task finished');
        } else {
            console.log('No data found.');
        }
    });
}

async function SendRemindlist(message) {

    let guildlist = [];

    for (let i = 0; i < remindlist[message.author.id].length; i++) { // gonna check to see if it's sorted by guild
        let channel = client.channels.cache.get(remindlist[message.author.id][i]);

        if (channel === undefined) {
            guildlist.push(-1);
        }
        else {
            guildlist.push(channel.guildId);
        }
    }

    let guildlistCopy = [...guildlist];
 
    await guildlistCopy.sort(function(a, b){
        if (a < b) {
            return -1;
        }
        else if (a > b) {
            return 1;
        }
        return 0;
    });

    let isSorted = false;
    if (guildlist.toString() == guildlistCopy.toString() && guildlist.includes(-1) == false && guildlist[0] != guildlist[guildlist.length - 1]) {
        isSorted = true;
    }


    let outputmsg = "**Your remindlist:**\n";
    for (let i = 0; i < remindlist[message.author.id].length; i++) {  
        if (isSorted && message.channel.type === ChannelType.DM) {
            if (i == 0) {
                outputmsg += "__" + client.channels.cache.get(remindlist[message.author.id][i]).guild.name + "__\n"
            }
            else {
                let nowchannel = client.channels.cache.get(remindlist[message.author.id][i]);
                let prevchannel = client.channels.cache.get(remindlist[message.author.id][i - 1]);

                if (nowchannel.guildId != prevchannel.guildId) {
                    outputmsg += "¶\n__" + nowchannel.guild.name + "__\n"
                }
            }
        }

        if (client.channels.cache.get(remindlist[message.author.id][i]) === undefined) {
            if (remindpings.hasOwnProperty(message.author.id) && remindpings[message.author.id] == true) {
                outputmsg += "<:blank:1026792857153048596>  ";
            }
            outputmsg += "#deleted-channel\n";
        }
        else {
            let channelCache = client.channels.cache.get(remindlist[message.author.id][i]);
            if (message.channel.type === ChannelType.DM) {
                if ((remindpings.hasOwnProperty(message.author.id) && remindpings[message.author.id] == true) || (remindtimes.hasOwnProperty(message.author.id) && remindtimes[message.author.id] == true)) {
                    outputmsg += await checkRemindMsg(channelCache, message, remindlist[message.author.id][i]);
                }
                else {
                    outputmsg += "<#" + remindlist[message.author.id][i] + ">\n";
                }
            }
            else if (channelCache.guild == message.guild) {
                if ((remindpings.hasOwnProperty(message.author.id) && remindpings[message.author.id] == true) || (remindtimes.hasOwnProperty(message.author.id) && remindtimes[message.author.id] == true)) {
                    outputmsg += await checkRemindMsg(channelCache, message, remindlist[message.author.id][i]);
                }
                else {
                    outputmsg += "<#" + remindlist[message.author.id][i] + ">\n";
                }
            }
        }
    }
    if (remindlist.hasOwnProperty(message.author.id) == false || remindlist[message.author.id].length == 0) {
        message.channel.send("You are not watching any channels.");
    }
    else {
        splitMessage(message, outputmsg);
    }
}

async function checkRemindMsg(channelCache, message, channelId) {
    let addStr = "";
    try {
        let fetchResults = await channelCache.messages.fetch();
        let filteredResults = await fetchResults.filter(message => message.system == false && message.author.bot == false);
        let lastMessage = filteredResults.first();
        
        if (remindpings.hasOwnProperty(message.author.id) && remindpings[message.author.id] == true) {
            if (lastMessage.author.id !== message.author.id) {
                addStr += "<:ping:1026739369995931650>  ";
            }
            else {
                addStr += "<:blank:1026792857153048596>  ";
            }
        }
                            
        addStr += "<#" + channelId + ">";
        
        if (remindtimes.hasOwnProperty(message.author.id) && remindtimes[message.author.id] == true) {
            addStr += "  <t:" + Math.floor(lastMessage.createdTimestamp/1000) + ":R>";
        }

        addStr += "\n";
    } catch (error) {
        if (remindpings.hasOwnProperty(message.author.id) && remindpings[message.author.id] == true) {
            addStr += "<:blank:1026792857153048596>  ";
        }

        addStr += "<#" + channelId + ">\n";
    }

    return addStr;
}

async function splitMessage(message, content) {
    if (content.length < 2000) {
        message.channel.send(content.replace("¶", ""));
    }
    else {
        let newOutput = [];
        newOutput.push("");
        let messageSplit = content.split('\n');
        let i = 0;
        for (let j = 0; j < messageSplit.length; j++) {
            if (messageSplit[j] == "¶") {
                newOutput.push("");
                i++;
            }
            else {
                messageSplit[j] += "\n";
                if ((newOutput[i] + messageSplit[j]).length < 2000) {
                    newOutput[i] += messageSplit[j];
                }
                else {
                    newOutput.push(messageSplit[j]);
                    i++;
                }
            }
        }
        for (let k = 0; k < newOutput.length; k++) {
            message.channel.send(newOutput[k]);
        }
    }
}

async function ChooseCommand(message, sliceNum) {
    const choicedata = message.content.slice(sliceNum);
        if (message.content.includes("|") || message.content.includes("/")) {
            let choicearray = choicedata.replaceAll("/", "|").split('|');
            let choice = Math.floor(Math.random() * (choicearray.length));
            message.channel.send("**" + choicearray[choice].trim() + "** was selected.");
        }
        else {
            message.channel.send("Please separate each choice with a vertical bar (`|`).")
        }
}

client.on("ready", () => {
    console.log("onready fired");
    botserver = client.guilds.cache.get("853752363495325716");
    botLogs = client.channels.cache.get('876199968967381072');
    inconLogs = client.channels.cache.get('917583976405803038');
    serverSuggestions = client.channels.cache.get('544025844620853249');
    ooc_chat = client.channels.cache.get('466064608222773258');
    war_room = client.channels.cache.get('572239368668971029');
    signalRoom = client.channels.cache.get('853752363495325718');
    newwords = client.channels.cache.get('941484618765467649');
    utility_dms = client.channels.cache.get('942712333304750091');
    client.user.setActivity(activities[Math.floor(Math.random() * activities.length)]);
    console.log(`Logged in as ${client.user.tag}!`);
    botLogs.send(`Logged in as ${client.user.tag}!`);
    scheduledMessage.start();
    wordsReady = true;
    /*wordInitialize();*/
})

client.on('threadUpdate', async (oldThread, newThread) => {
    if (unarchiveIgnore.includes(oldThread.id)) {
        // pass
    }
    else if (newThread.archived == true) {
        if (newThread.guildId == '805756440752816158') {
            await newThread.setArchived(false);
            let msg = newThread.name + ' was unarchived.';
            botLogs.send(msg);
            console.log(msg);
        }
        else {
            for (let key in remindlist) {
                if (remindlist[key].includes(oldThread.id)) { 
                    await newThread.setArchived(false);
                    let msg = newThread.name + ' was unarchived.';
                    botLogs.send(msg);
                    console.log(msg);
                }
            }
        }
    }
})

client.on('messageCreate', async message => {
    if (message.content === prefix + 'ping') {
        await message.channel.send('Loading data...').then (async (msg) =>{
            await msg.delete()
            await message.channel.send(`Ping recieved. Latency is ${msg.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ws.ping)}ms.`);
        })
    }
    if (message.channel.type === ChannelType.DM) {
        console.log("Recieved DM message");
        if (message.author.id != 888209624631750667 && message.author.id != 221482385399742465 && !message.content.startsWith(prefix)) {
            if (message.content.length <= 1800) {
                let msgContent = '> ' + message.content.replaceAll('\n', '\n> ');
                utility_dms.send("<@!221482385399742465>\nNew DM from " + message.author.username + ".\n" + msgContent);
            }
            else {
                utility_dms.send("<@!221482385399742465>\nNew DM from " + message.author.username + ".\n[MESSAGE TOO LONG TO SEND]");
            }
        }
        else {
            if (message.author.id == 888209624631750667) {
                if (message.content.length <= 1800) {
                    let msgContent = '> ' + message.content.replaceAll('\n', '\n> ');
                    utility_dms.send("New DM from " + message.author.username + " to " + client.users.cache.get(message.channel.recipientId).username + ".\n" + msgContent);
                }
                else {
                    utility_dms.send("New DM from " + message.author.username + " to " + client.users.cache.get(message.channel.recipientId).username + ".\n[MESSAGE TOO LONG TO SEND]");
                }
            }
            else {
                if (message.content.length <= 1800) {
                    let msgContent = '> ' + message.content.replaceAll('\n', '\n> ');
                    utility_dms.send("New DM from " + message.author.username + ".\n" + msgContent);
                }
                else {
                    utility_dms.send("New DM from " + message.author.username + ".\n[MESSAGE TOO LONG TO SEND]");
                }
            }
        }
    }
    if (wordsReady == true) {
        if (message.author.bot == false && message.guild !== null) {
            if (wordlist.hasOwnProperty(message.guildId) == false) {
                wordlist[message.guildId] = [];
            }
            let msgWordArray = message.content.replaceAll(/[\W_]+/g," ").split(' ');
            let serverId = message.guildId;
            for (const word of msgWordArray) {
                if (isNumeric(word) == false) {
                    let lcword = word.toLowerCase();
                    if (wordlist[serverId].includes(lcword) == false) {
                        wordlist[serverId].push(lcword);
                        msgContent = '> ' + message.content.replaceAll('\n', '\n> ');
                        if (("The word \"**" + lcword + "**\" was just said for the first time in " + message.guild.name + ". It was said by " + message.author.username + " in #" + message.channel.name + " (<" + messageLink(message) + ">).\n" + msgContent).length <= 1800) {
                            newwords.send("The word \"**" + lcword + "**\" was just said for the first time in " + message.guild.name + ". It was said by " + message.author.username + " in #" + message.channel.name + " (<" + messageLink(message) + ">).\n" + msgContent);
                        }
                        else if (("The word \"**" + lcword + "**\" was just said for the first time in " + message.guild.name + ". It was said by " + message.author.username + " in #" + message.channel.name + " (<" + messageLink(message) + ">).\n[MESSAGE TOO LONG TO SEND]").length <= 1800){
                            newwords.send("The word \"**" + lcword + "**\" was just said for the first time in " + message.guild.name + ". It was said by " + message.author.username + " in #" + message.channel.name + " (<" + messageLink(message) + ">).\n[MESSAGE TOO LONG TO SEND]")
                        }
                        else {
                            newwords.send("A new word was just said for the first time in " + message.guild.name + ". It was said by " + message.author.username + " in #" + message.channel.name + " (<" + messageLink(message) + ">).\n[WORD TOO LONG TO SEND]")
                        }
                        console.log(lcword + " added to " + message.guild.name + " wordlist.");
                        SaveWordlist();
                    }
                }
            }
        }
    }
    if (message.author.bot == false && message.system == false) {
        for (let key in remindlist) {
            if (remindoptout.hasOwnProperty(key)) {
                if (remindoptout[key] == true) {
                    continue;
                }
            }
            if (message.author.id != key) {
                if (remindlist[key].includes(message.channelId)) { 
                    let tarUser = client.users.cache.get(key);
                    if (remindtimes.hasOwnProperty(key) && remindtimes[key] == true) {
                        tarUser.send("New message in <#" + message.channelId + "> <t:" + Math.floor(message.createdTimestamp/1000) + ":R> from " + message.author.username + ":\n" + messageLink(message))
                            .catch(() => botLogs.send("<@!221482385399742465> Could not DM " + tarUser.username + "."));
                    }
                    else {
                        tarUser.send("New message in <#" + message.channelId + "> from " + message.author.username + ":\n" + messageLink(message))
                            .catch(() => botLogs.send("<@!221482385399742465> Could not DM " + tarUser.username + ".")); 
                    }
                }
            }
        }
    }
    if (message.content == prefix + 'uptime') {
        let totalSeconds = (client.uptime / 1000);
        let days = Math.floor(totalSeconds / 86400);
        totalSeconds %= 86400;
        let hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = Math.floor(totalSeconds % 60);
        let uptime = `${days} days, ${hours} hours, ${minutes} minutes and ${seconds} seconds.`;
        message.channel.send("Active for " + uptime);
    }
    else if (message.content.startsWith(prefix + 'setActivity')) {
        if (message.author.id !== "221482385399742465") return;
        const activityString = message.content.slice(14).trim();
        client.user.setActivity(activityString, {
            type: "PLAYING"
        });
    }
    else if (message.content === prefix + "printwordlist") {
        if (message.author.id !== "221482385399742465") return;
        afterWordInitialize();
    }
    else if (message.content === prefix + "wordinitialize") {
        if (message.author.id !== "221482385399742465") return;
        console.log("wordinitialize called");
        wordInitialize();
    }
    else if (message.content === prefix + "dotoday") {
        if (message.author.id !== "221482385399742465") return;
        let replyMessage = message.reply('**ARE YOU SURE YOU WANT TO RUN THE DAILY TASK?** This has the potention to ping **everyone** with the calendar-watcher role. Reply with "I WANT TO PING EVERYONE WITH THE CALENDAR-WATCHER ROLE" if so. Will expire in 20 seconds...');
        let filter = m => m.author.id == message.author.id && m.content == 'I WANT TO PING EVERYONE WITH THE CALENDAR-WATCHER ROLE  ';
        message.channel.awaitMessages({filter, max: 1, time: 20000}).then(collected => {
            message.reply('Confirmed.');
            console.log("Artificially performing today");
            fs.readFile('credentials.json', (err, content) => {
                if (err) return console.log('Error loading client secret file:', err);
                // Authorize a client with credentials, then call the Google Sheets API.
                authorize(JSON.parse(content), dailyTask);
            });
        });
    }
    else if (message.content === prefix + "birthdays") {
        if (message.author.bot) return;
        message.channel.send('https://bit.ly/InventoryBirthdays');
    }
    else if (message.content === prefix + "family tree") {
        if (message.author.bot) return;
        message.channel.send('https://bit.ly/InventoryFamilyTree');
    }
    else if (message.content === prefix + "tierlists") {
        if (message.author.bot) return;
        message.channel.send('https://bit.ly/InventoryTierlists\nYou know you can also use `u!roster`, right?');
    }
    else if (message.content === prefix + "spreadsheets") {
        if (message.author.bot) return;
        message.channel.send('https://bit.ly/InventorySpreadsheets\nYou know you can also use `u!roster`, right?');
    }
    else if (message.content === prefix + "NNN" || message.content === prefix + "nnn") {
        if (message.author.bot) return;
        message.channel.send('https://docs.google.com/spreadsheets/d/1pioDoqQaRiWkrtZlMPuAUH2VouoC2NgPeh66rHOMT0U/edit?usp=sharing');
    }
    else if (message.content === prefix + "source") {
        if (message.author.bot) return;
        message.channel.send('https://github.com/KKITAANIK/Utility-chan');
    }
    else if (message.content.startsWith(prefix + "help")) {
        if (message.author.bot) return;
        const helpMsg = message.content.slice(6).trim();
        if (helpMsg.length == 0 || helpMsg == "help") {
            message.channel.send("Use `u!help ____` with any command for help with that command. You may also enter command categories to get help on all commands in that category.\n\
Use `u!help commands` for a list of all commands.\n\
Use `u!help categories` for a list of all command categories.\n\
Use `u!help full` for an explanation of every command and feature.\n\
Note that `u!help full` and `u!help remind` can only be used in bot channels or DMs, due to their length.");
        }
        else if (helpMsg == "commands") {
            message.channel.send("A list of all commands I currently know:\n\
    ⁃ `help`\n\
    ⁃ `ping`\n\
    ⁃ `uptime`\n\
    ⁃ `birthdays`\n\
    ⁃ `tierlists`\n\
    ⁃ `spreadsheets`\n\
    ⁃ `family tree`\n\
    ⁃ `source`\n\
    ⁃ `NNN`\n\
    ⁃ `choose`\n\
    ⁃ `roll`\n\
    ⁃ `remind`\n\
    ⁃ `unremind`\n\
    ⁃ `suggest`\n\
    ⁃ `roster`\n\
    ⁃ `archive`")
        }
        else if (helpMsg == "categories") {
            message.channel.send("A list of the various command categories:\n\
    ⁃ `u!help basic`: Basic commands that don't take any parameters\n\
    ⁃ `u!help rng`: Commands that use random number generation (`u!choose` and `u!roll`)\n\
    ⁃ `u!help remind`: Details on the reminder system, and the commands `u!remind` and `u!unremind`\n\
    ⁃ `u!help utility`: Miscellaneous parameter commands that fulfill server utility (`u!suggest`, `u!roster`, and `u!archive`)\n\
    ⁃ `u!help features`: Various features that aren't associated with any commands");
        }
        else if (helpMsg == "full") {
            if (botChannels.includes(message.channelId) || message.channel.type === ChannelType.DM) {
                await message.channel.send("**Basic Commands:**\n\
`u!help`: Gives information on various commands and features. Use `u!help` for more information.\n\
`u!ping`: This command pings me. You can use it to check for general and API latency, as well as making sure I'm online.\n\
`u!uptime`: Check how long I've been online.\n\
`u!birthdays`: Links to the birthday sheet.\n\
`u!tierlists`: Links to the tierlist redirectory.\n\
`u!spreadsheets`: Links to the spreadsheet redirectory.\n\
`u!family tree`: Links to the Inventory family tree.\n\
`u!source`: Links to my source code on GitHub.\n\
`u!NNN`: Links to the list of No Nut November participants. This command will be removed when the event is over.\n\
<:blank:1026792857153048596>");

                await message.channel.send("**Parameter Commands (Random Number Generation):**\n\
`u!choose`:\n\
        Usage: `u!choose 𝑎 | 𝑏 | 𝑐`\n\
        Description: Chooses between any number of options (in this instance 𝑎, 𝑏, and 𝑐). Remember to separate each one with a vertical bar.\n\
`u!roll`:\n\
        Usage: `u!roll 𝑎d𝑥`\n\
        Description: Rolls any number of dice, with any number of sides. In this instance you're telling me to roll 𝑎 dice with 𝑥 sides.\n\
        Advanced Usage: `u!roll 𝑎d𝑥+𝑖 𝑏d𝑦+𝑗 𝑐d𝑧+𝑘 +𝑡`\n\
        Description: 𝑎, 𝑏, and 𝑐 control how many dice are being rolled, 𝑥, 𝑦, and 𝑧 control the number of sides for each of those dice, 𝑖, 𝑗, and 𝑘 add a set number to *each* roll of that die, and 𝑡 is a number that is added to the *entire* equation. The distinction is in spacing, so `u!roll 5d+3` means 3 is added 5 times, whereas `u!roll 5d +3` means that 3 is only added once.\n\
        Advanced Usage: `u!roll 𝑎d𝑥+𝑖 𝑏df+𝑗`\n\
        Description: Replacing the number of sides with the character `f` makes it a fudge die. A fudge die has three possible outcomes: -1, 0, and 1. Fudge dice otherwise function identically to normal dice, and require no other changes to syntax.\n\
<:blank:1026792857153048596>");

                await message.channel.send("**Parameter Commands (Reminders):**\n\
Feel free to read this post (<https://discord.com/channels/466063257472466944/544025844620853249/1026981909772898345>) for a broader explanation of the Remind feature, especially its purpose and usage.\n\
`u!remind`:\n\
        Usage: `u!remind`\n\
        Description: Displays your remindlist.\n\
        Usage: `u!remind #my-channel` or `u!remind ID:123456789012345678`\n\
        Description: Adds a channel to your remindlist. When a channel is on your remindlist, you will receive a DM from me whenever somemone besides yourself sends a message in that channel. Please read this post (<https://discord.com/channels/466063257472466944/544025844620853249/1025213227308679180>) to determine if a channel is a good fit for the remind command.\n\
        Advanced Usage: `u!remind #my-channel, #my-other-channel, ID:123456789012345678`\n\
        Description: Adds all listed channels to your remindlist. If a channel is not valid, it will not be added. Each channel must be separated by a comma.\n\
        Usage: `u!remind track ping`\n\
        Description: Toggles response tracking for your remindlist. When response tracking is on, your remindlist will show a <:ping:1026739369995931650> next to any channels in which you did not send the last message. IMPORTANT WARNINGS HERE: (<https://discord.com/channels/466063257472466944/544025844620853249/1026804223876280403>).\n\
        Usage: `u!remind track time`\n\
        Description: Toggles response time tracking for your remindlist. When response time tracking is on, your remindlist will show a timestamp for when the last response in a channel was. IMPORTANT WARNINGS HERE: (<https://discord.com/channels/466063257472466944/544025844620853249/1026804223876280403>).\n\
        Usage: `u!remind DMs`\n\
        Description: Toggles whether you receive DM reminders from Utility-chan when a new message is posted in channels on your remindlist.");
                await message.channel.send("`u!unremind`:\n\
        Usage: `u!unremind #my-channel` or `u!remind ID:123456789012345678`\n\
        Description: Removes a channel from your remindlist.\n\
        Advanced Usage: `u!unremind #my-channel, #my-other-channel, ID:123456789012345678`\n\
        Description: Removes all listed channels to your remindlist. If a channel is not valid, it will not be removed. Each channel must be separated by a comma.\n\
        Usage: `u!unremind deleted`\n\
        Description: If a channel on your remindlist is deleted or becomes inacessible, it will be displayed on your remindlist as #deleted-channel. `u!unremind deleted` will remove all instances of #deleted-channel from your remindlist. (Please note that archived threads may also show up as #deleted-channel. Simply re-open them and they will display correctly.)\n\
        Usage: `u!unremind all`\n\
        Descriptions: Removes all channels from your remindlist.");
                await message.channel.send("`u!remind sort`:\n\
        Usage: `u!remind sort alpha`\n\
        Description: Sorts your remindlist in alphabetical order.\n\
        Usage: `u!remind sort pos`\n\
        Description: Sorts your remindlist by the channel's position on the sidebar. Threads in the same channel are sorted alphabetically.\n\
        Usage: `u!remind sort time`\n\
        Description: Sorts your remindlist by the timestamp of the most recent message in that channel, with most recent messages first.\n\
        Advanced Usage: `u!remind sort time desc`\n\
        Description: Sorts your remindlist by the timestamp of that most recent message in that channel, with oldest messages first.\n\
        Usage: `u!remind sort rand`\n\
        Description: Randomly shuffles the order of your remindlist.\n\
<:blank:1026792857153048596>");

                await message.channel.send("**Parameter Commands (Other):**\n\
`u!suggest`:\n\
        Usage: `u!suggest [message]`\n\
        Description: Sends your message in <#544025844620853249>, along with a record of who sent it and in which channel. <:yes:938908644202913872>, <:neutral:938908656282529842>, and <:no:938908668362121216> will be added automatically as reactions for ease of voting.\n\
`u!roster`:\n\
        Usage: `u!roster`\n\
        Description: Displays your currently set roster message.\n\
        Usage: `u!roster [message]`\n\
        Description: Sets your roster message to `[message]`.\n\
        Usage: `u!roster `<@!221482385399742465>` ` or `u!roster HereToHelp#1941`\n\
        Description: View the roster of the mentioned user if they have one. You can use their discord username and discriminator if you don't want to ping them.\n\
`u!archive`:\n\
        Usage: `u!archive #my-channel` or `u!archive ID:123456789012345678`\n\
        Description: Archives the given channel. This command allows users to manually archive channels that are on a user's remindlist.\n\
<:blank:1026792857153048596>");

                message.channel.send("**Features:**\n\
    ⁃ Every day at midnight (Pacific Time), I check the birthday sheet and ping anyone with the calendar-watcher role about any birthdays for that day. The sheet also contains certain \"holidays\" that might spark ideas for threads.\n\
    ⁃ For every message sent in the servers I'm in, I check if it contains any words I haven't seen before and let <@!221482385399742465> know if it does. He does whatever he wants with that information, usually just sharing the ones he thinks are funny.\n\
    ⁃ If you DM me, I'll tell <@!221482385399742465> what you said, but I can't send messages that are too long, have images, or use custom emojis. I also might respond.\n\
    ⁃ My status changes every hour, selected from a premade pool of options.");
            }
            else {
                message.channel.send("To avoid spam, `u!help full` can only be used in bot channels or DMs.")
            }
        }
        else if (helpMsg == "ping") {
            message.channel.send("`u!ping`: This command pings me. You can use it to check for general and API latency, as well as making sure I'm online.");
        }
        else if (helpMsg == "uptime") {
            message.channel.send("`u!uptime`: Check how long I've been online.");
        }
        else if (helpMsg == "birthdays") {
            message.channel.send("`u!birthdays`: Links to the birthday sheet.");
        }
        else if (helpMsg == "tierlists") {
            message.channel.send("`u!tierlists`: Links to the tierlist redirectory.");
        }
        else if (helpMsg == "spreadsheets") {
            message.channel.send("`u!spreadsheets`: Links to the spreadsheet redirectory.");
        }
        else if (helpMsg == "family tree") {
            message.channel.send("`u!family tree`: Links to the Inventory family tree.");
        }
        else if (helpMsg == "source") {
            message.channel.send("`u!source`: Links to my source code on GitHub.");
        }
        else if (helpMsg == "nnn" || helpMsg == "NNN") {
            message.channel.send("`u!NNN`: Links to the list of No Nut November participants. This command will be removed when the event is over.");
        }
        else if (helpMsg == "choose") {
            message.channel.send("`u!choose`:\n\
        Usage: `u!choose 𝑎 | 𝑏 | 𝑐`\n\
        Description: Chooses between any number of options (in this instance 𝑎, 𝑏, and 𝑐). Remember to separate each one with a vertical bar.");
        }
        else if (helpMsg == "roll") {
            message.channel.send("`u!roll`:\n\
        Usage: `u!roll 𝑎d𝑥`\n\
        Description: Rolls any number of dice, with any number of sides. In this instance you're telling me to roll 𝑎 dice with 𝑥 sides.\n\
        Advanced Usage: `u!roll 𝑎d𝑥+𝑖 𝑏d𝑦+𝑗 𝑐d𝑧+𝑘 +𝑡`\n\
        Description: 𝑎, 𝑏, and 𝑐 control how many dice are being rolled, 𝑥, 𝑦, and 𝑧 control the number of sides for each of those dice, 𝑖, 𝑗, and 𝑘 add a set number to *each* roll of that die, and 𝑡 is a number that is added to the *entire* equation. The distinction is in spacing, so `u!roll 5d+3` means 3 is added 5 times, whereas `u!roll 5d +3` means that 3 is only added once.\n\
        Advanced Usage: `u!roll 𝑎d𝑥+𝑖 𝑏df+𝑗`\n\
        Description: Replacing the number of sides with the character `f` makes it a fudge die. A fudge die has three possible outcomes: -1, 0, and 1. Fudge dice otherwise function identically to normal dice, and require no other changes to syntax.");
        }
        else if (helpMsg == "remind" || helpMsg == "unremind") {
            if (botChannels.includes(message.channelId) || message.channel.type === ChannelType.DM) {
                await message.channel.send("**Remind Commands:**\n\
Feel free to read this post (<https://discord.com/channels/466063257472466944/544025844620853249/1026981909772898345>) for a broader explanation of the Remind feature, especially its purpose and usage.\n\
`u!remind`:\n\
        Usage: `u!remind`\n\
        Description: Displays your remindlist.\n\
        Usage: `u!remind #my-channel` or `u!remind ID:123456789012345678`\n\
        Description: Adds a channel to your remindlist. When a channel is on your remindlist, you will receive a DM from me whenever somemone besides yourself sends a message in that channel. Please read this post (<https://discord.com/channels/466063257472466944/544025844620853249/1025213227308679180>) to determine if a channel is a good fit for the remind command.\n\
        Advanced Usage: `u!remind #my-channel, #my-other-channel, ID:123456789012345678`\n\
        Description: Adds all listed channels to your remindlist. If a channel is not valid, it will not be added. Each channel must be separated by a comma.\n\
        Usage: `u!remind track ping`\n\
        Description: Toggles response tracking for your remindlist. When response tracking is on, your remindlist will show a <:ping:1026739369995931650> next to any channels in which you did not send the last message. IMPORTANT WARNINGS HERE: (<https://discord.com/channels/466063257472466944/544025844620853249/1026804223876280403>).\n\
        Usage: `u!remind track time`\n\
        Description: Toggles response time tracking for your remindlist. When response time tracking is on, your remindlist will show a timestamp for when the last response in a channel was. IMPORTANT WARNINGS HERE: (<https://discord.com/channels/466063257472466944/544025844620853249/1026804223876280403>).\n\
        Usage: `u!remind DMs`\n\
        Description: Toggles whether you receive DM reminders from Utility-chan when a new message is posted in channels on your remindlist.");
                await message.channel.send("`u!unremind`:\n\
        Usage: `u!unremind #my-channel` or `u!remind ID:123456789012345678`\n\
        Description: Removes a channel from your remindlist.\n\
        Advanced Usage: `u!unremind #my-channel, #my-other-channel, ID:123456789012345678`\n\
        Description: Removes all listed channels to your remindlist. If a channel is not valid, it will not be removed. Each channel must be separated by a comma.\n\
        Usage: `u!unremind deleted`\n\
        Description: If a channel on your remindlist is deleted or becomes inacessible, it will be displayed on your remindlist as #deleted-channel. `u!unremind deleted` will remove all instances of #deleted-channel from your remindlist. (Please note that archived threads may also show up as #deleted-channel. Simply re-open them and they will display correctly.)\n\
        Usage: `u!unremind all`\n\
        Descriptions: Removes all channels from your remindlist.");
                message.channel.send("`u!remind sort`:\n\
        Usage: `u!remind sort alpha`\n\
        Description: Sorts your remindlist in alphabetical order.\n\
        Usage: `u!remind sort pos`\n\
        Description: Sorts your remindlist by the channel's position on the sidebar. Threads in the same channel are sorted alphabetically.\n\
        Usage: `u!remind sort time`\n\
        Description: Sorts your remindlist by the timestamp of the most recent message in that channel, with most recent messages first.\n\
        Advanced Usage: `u!remind sort time desc`\n\
        Description: Sorts your remindlist by the timestamp of that most recent message in that channel, with oldest messages first.\n\
        Usage: `u!remind sort rand`\n\
        Description: Randomly shuffles the order of your remindlist.");
            }
            else {
                message.channel.send("To avoid spam, `u!help remind` can only be used in bot channels or DMs.")
            }
        }
        else if (helpMsg == "suggest") {
            message.channel.send("`u!suggest`:\n\
        Usage: `u!suggest [message]`\n\
        Description: Sends your message in <#544025844620853249>, along with a record of who sent it and in which channel. <:yes:938908644202913872>, <:neutral:938908656282529842>, and <:no:938908668362121216> will be added automatically as reactions for ease of voting.");
        }
        else if (helpMsg == "roster") {
            message.channel.send("`u!roster`:\n\
        Usage: `u!roster`\n\
        Description: Displays your currently set roster message.\n\
        Usage: `u!roster [message]`\n\
        Description: Sets your roster message to `[message]`.\n\
        Usage: `u!roster `<@!221482385399742465>` ` or `u!roster HereToHelp#1941`\n\
        Description: View the roster of the mentioned user if they have one. You can use their discord username and discriminator if you don't want to ping them.");
        }
        else if (helpMsg == "archive") {
            message.channel.send("`u!archive`:\n\
        Usage: `u!archive #my-channel` or `u!archive ID:123456789012345678`\n\
        Description: Archives the given channel. This command allows users to manually archive channels that are on a user's remindlist.");
        }
        else if (helpMsg == "basic") {
            message.channel.send("**Basic Commands:**\n\
`u!help`: Gives information on various commands and features. Use `u!help` for more information.\n\
`u!ping`: This command pings me. You can use it to check for general and API latency, as well as making sure I'm online.\n\
`u!uptime`: Check how long I've been online.\n\
`u!birthdays`: Links to the birthday sheet.\n\
`u!tierlists`: Links to the tierlist redirectory.\n\
`u!spreadsheets`: Links to the spreadsheet redirectory.\n\
`u!family tree`: Links to the Inventory family tree.\n\
`u!source`: Links to my source code on GitHub.\n\
`u!NNN`: Links to the list of No Nut November participants. This command will be removed when the event is over.");
        }
        else if (helpMsg == "rng") {
            message.channel.send("**RNG Commands:**\n\
`u!choose`:\n\
        Usage: `u!choose 𝑎 | 𝑏 | 𝑐`\n\
        Description: Chooses between any number of options (in this instance 𝑎, 𝑏, and 𝑐). Remember to separate each one with a vertical bar.\n\
`u!roll`:\n\
        Usage: `u!roll 𝑎d𝑥`\n\
        Description: Rolls any number of dice, with any number of sides. In this instance you're telling me to roll 𝑎 dice with 𝑥 sides.\n\
        Advanced Usage: `u!roll 𝑎d𝑥+𝑖 𝑏d𝑦+𝑗 𝑐d𝑧+𝑘 +𝑡`\n\
        Description: 𝑎, 𝑏, and 𝑐 control how many dice are being rolled, 𝑥, 𝑦, and 𝑧 control the number of sides for each of those dice, 𝑖, 𝑗, and 𝑘 add a set number to *each* roll of that die, and 𝑡 is a number that is added to the *entire* equation. The distinction is in spacing, so `u!roll 5d+3` means 3 is added 5 times, whereas `u!roll 5d +3` means that 3 is only added once.\n\
        Advanced Usage: `u!roll 𝑎d𝑥+𝑖 𝑏df+𝑗`\n\
        Description: Replacing the number of sides with the character `f` makes it a fudge die. A fudge die has three possible outcomes: -1, 0, and 1. Fudge dice otherwise function identically to normal dice, and require no other changes to syntax.");
        }
        else if (helpMsg == "utility") {
            message.channel.send("**Utility Commands:**\n\
`u!suggest`:\n\
        Usage: `u!suggest [message]`\n\
        Description: Sends your message in <#544025844620853249>, along with a record of who sent it and in which channel. <:yes:938908644202913872>, <:neutral:938908656282529842>, and <:no:938908668362121216> will be added automatically as reactions for ease of voting.\n\
`u!roster`:\n\
        Usage: `u!roster`\n\
        Description: Displays your currently set roster message.\n\
        Usage: `u!roster [message]`\n\
        Description: Sets your roster message to `[message]`.\n\
        Usage: `u!roster `<@!221482385399742465>` ` or `u!roster HereToHelp#1941`\n\
        Description: View the roster of the mentioned user if they have one. You can use their discord username and discriminator if you don't want to ping them.\n\
`u!archive`:\n\
        Usage: `u!archive #my-channel` or `u!archive ID:123456789012345678`\n\
        Description: Archives the given channel. This command allows users to manually archive channels that are on a user's remindlist.");
        }
        else if (helpMsg == "features") {
            message.channel.send("**Features:**\n\
    ⁃ Every day at midnight (Pacific Time), I check the birthday sheet and ping anyone with the calendar-watcher role about any birthdays for that day. The sheet also contains certain \"holidays\" that might spark ideas for threads.\n\
    ⁃ For every message sent in the servers I'm in, I check if it contains any words I haven't seen before and let <@!221482385399742465> know if it does. He does whatever he wants with that information, usually just sharing the ones he thinks are funny.\n\
    ⁃ If you DM me, I'll tell <@!221482385399742465> what you said, but I can't send messages that are too long, have images, or use custom emojis. I also might respond.\n\
    ⁃ My status changes every hour, selected from a premade pool of options.");
        }
    }
    /*if (message.content === prefix + "boost") {
        if (message.author.bot) return;
        if (message.author.id !== "221482385399742465") return;
        let totalContent = "";
        console.log(message.reference.messageId);
        message.channel.messages.fetch(message.reference.messageId).then(replyMessage => {
            if (replyMessage.content.length > 1800) {
                message.channel.send("Message is too long to signal boost.");
            }
            else {
                console.log(replyMessage.content);
                totalContent += "Signalboosted message by <@!" + replyMessage.author.id + "> in <#" + replyMessage.channelId + "> (<" + messageLink(replyMessage) + ">):\n"; 
                totalContent += replyMessage.content;
                message.channel.send(totalContent);
            }
        });
    }*/
    else if (message.content.startsWith(prefix + 'edit')) {
        if (message.author.bot) return;
        if (message.author.id !== "221482385399742465") return;
        console.log("edit message called");
        const editContent = message.content.slice(7).trim();
        console.log(message.reference.messageId);
        message.channel.messages.fetch(message.reference.messageId).then(replyMessage => {
            replyMessage.edit(editContent)
            .then(msg => console.log(`Updated the content of a message to ${msg.content}`))
            .catch(console.error);
            console.log("Edited a message to " + editContent);
        });
        message.delete();
    }
    else if (message.content.startsWith(prefix + 'delete')) {
        if (message.author.bot) return;
        if (message.author.id !== "221482385399742465") return;
        console.log("delete message called");
        console.log(message.reference.messageId);
        message.channel.messages.fetch(message.reference.messageId).then(replyMessage => {
            replyMessage.delete()
            console.log("Deleted message");
        });
        message.delete();
    }
    else if (message.content.startsWith(prefix + 'say')) {
        if (message.author.id !== "221482385399742465") return;
        const SayMessage = message.content.slice(6).trim();
        await message.channel.send(SayMessage)
        message.delete();
        console.log("Said \"" + SayMessage + "\" and deleted say message.")
    }
    else if (message.content.startsWith(prefix + 'dm')) {
        if (message.author.id !== "221482385399742465") return;
        const msgStr = message.content.slice(5).trim();
        const msgArray = msgStr.split(/(?<=^\S+)\s/);
        console.log(msgArray);
        let tarUser = client.users.cache.get(msgArray[0]);
        tarUser.send(msgArray[1])
            .catch(() => botLogs.send("<@!221482385399742465> Could not DM " + tarUser.username + "."));
        console.log("Said \"" + msgArray[1] + "\" to " + tarUser.username + ".");
    }
    else if (message.content.startsWith(prefix + 'suggest')) {
        const suggestion = message.content.slice(10).trim();
        await serverSuggestions.send(suggestion + "\n\nSuggestion sent by <@!" + message.author.id + "> in <#" + message.channel.id + ">.").then(suggestmsg => {
            suggestmsg.react('<:yes:938908644202913872>');
            suggestmsg.react('<:neutral:938908656282529842>');
            suggestmsg.react('<:no:938908668362121216>');
        });
    }
    else if (message.content.startsWith(prefix + 'choose')) {
        if (message.author.bot) return;
        ChooseCommand(message, 9);
    }
    else if (message.content.startsWith(prefix + 'roll')) {
        if (message.author.bot) return;
        if (message.content.includes("|") || message.content.includes("/")) {
            ChooseCommand(message, 7);
        }
        else {
            const rolldata = message.content.slice(7).trim();
            let rollarray = rolldata.split(' ');
            for (let i = 0; i < rollarray.length; i++) {
                if (rollarray[i].charAt(0) == '+') {
                    console.log("trailing addition found in roll");
                    let addarray = rollarray[i].split('+');
                    rollarray[i] = [];
                    rollarray[i].push(addarray[addarray.length - 1]);
                    console.log("trailing addition set to " + rollarray[i][0]);
                }
                else {
                    if (rollarray[i].includes('d') == false) {
                        message.channel.send("Please format your roll as `𝑎d𝑥`, where 𝑎 is the number of dice to roll and 𝑥 is the number of sides. For advanced formatting, use `u!help roll`.");
                        return;
                    }
                    rollarray[i] = rollarray[i].split('d');
                    if (rollarray[i][0] == "") {
                        rollarray[i][0] = "1";
                    }
                    if (rollarray[i][1].includes('+')) {
                        let addarray = rollarray[i][1].split('+');
                        rollarray[i][1] = addarray[0];
                        rollarray[i].push(addarray[1]);
                    }
                }
                console.assert(rollarray[i].length > 0 && rollarray[i].length < 4, "rollarray[" + i.toString() + "] does not have 1 - 3 elements");
                for (let j = 0; j < rollarray[i].length; j++) {
                    if (rollarray [i][j] != 'f')
                        rollarray[i][j] = parseInt(rollarray[i][j]); 
                }
            }
            console.log(rollarray);
            let descstring = "Rolling ";
            let resstring = "";
            let resarray = [];
            let ressum = 0;
            let res;
            for (let i = 0; i < rollarray.length; i++) {
                if (i != rollarray.length - 1 || rollarray[i].length != 1) {
                    if (rollarray[i].length == 2) {
                        descstring += rollarray[i][0].toString() + " d" + rollarray[i][1].toString() + ", ";
                        for (let j = 0; j < rollarray[i][0]; j++) {
                            if (rollarray[i][1] == 'f') {
                                res = Math.floor(Math.random() * 3) - 1;
                            }
                            else {
                                res = Math.floor(Math.random() * (rollarray[i][1]) + 1);
                            }
                            resarray.push(res);
                            resstring += "**" + res.toString() + "** + ";
                            ressum += res;
                        }
                    }
                    else {
                        descstring += rollarray[i][0].toString() + " d" + rollarray[i][1].toString() + "+" + rollarray[i][2].toString() + ", ";
                        for (let j = 0; j < rollarray[i][0]; j++) {
                            if (rollarray[i][1] == 'f') {
                                res = Math.floor(Math.random() * 3) - 1 + rollarray[i][2];
                            }
                            else {
                                res = Math.floor(Math.random() * (rollarray[i][1]) + 1) + rollarray[i][2];
                            }
                            resarray.push(res);
                            resstring += "**" + res.toString() + "** + ";
                            ressum += res;
                        }
                    }
                }
                else {
                    descstring = descstring.slice(0, -2);
                    descstring += " + " + rollarray[i][0].toString() + ", ";
                    let res = rollarray[i][0];
                    resarray.push(res);
                    resstring += "**" + res.toString() + "** + ";
                    ressum += res;
                }
            }
            descstring = descstring.slice(0, -2) + "..."
            resstring = resstring.slice(0, -3);
            resstring += " = **" + ressum.toString() + "**";
            console.log(resstring);
            message.channel.send(descstring + "\n" + resstring);
        }
    }
    else if (message.content.startsWith(prefix + "archive")) {
        if (message.author.bot) return;
        let archivemsg = message.content.slice(9).trim();
        if (archivemsg.substring(0,2) == "<#" || archivemsg.substring(0, 3) == "ID:") { // check for channel here
            let archiveID;
            if (archivemsg.substring(0,2) == "<#") {
                archiveID = archivemsg.slice(2).trim().slice(0, -1); 
            }
            else if (archivemsg.substring(0, 3) == "ID:") {
                archiveID = archivemsg.slice(3).trim();
            }
            if (client.channels.cache.get(archiveID) === undefined) {
                message.channel.send("Channel not found.");
            }
            else if (client.channels.cache.get(archiveID).isThread() == false) {
                message.channel.send("That channel is not a thread.");
            }
            else {
                unarchiveIgnore.push(archiveID);
                await client.channels.cache.get(archiveID).setArchived(true);
                setTimeout(function(){ 
                    unarchiveIgnore = unarchiveIgnore.splice(unarchiveIgnore.indexOf(archiveID), 1); 
                    botLogs.send(client.channels.cache.get(archiveID).name + " was archived by " + message.author.username);
                }, 1000);
            }
        }
        else {
            message.channel.send("Please either mention the channel directly (`#my-channel`), or use the channel ID (`ID:123456789012345678`). For a more detailed explanation, read this post <https://discord.com/channels/466063257472466944/544025844620853249/1025207876882534420>.");
        }
    }
    else if (message.content.startsWith(prefix + "unremind")) {
        if (message.author.bot) return;
        let remindmsg = message.content.slice(10).trim();
        if (remindlist.hasOwnProperty(message.author.id) == false || remindlist[message.author.id].length == 0) {
            message.channel.send("You are not watching any channels.");
        }
        else if (remindmsg.length == 0) {
            SendRemindlist(message);
        }       
        else if (remindmsg == "deleted" || remindmsg == "all" || remindmsg == "#deleted-channel") {
            if (remindmsg == "deleted" || remindmsg == "#deleted-channel") {
                remindlist[message.author.id] = remindlist[message.author.id].filter(ID => client.channels.cache.get(ID) !== undefined);
            }
            else if (remindmsg == "all") {
                remindlist[message.author.id] = [];
            }

            fs.writeFile("remindlist.json", JSON.stringify(remindlist), function(err) {
                if (err) throw err;
                console.log('remindlist.json saved');
            });

            SendRemindlist(message);
        }
        else {
            if (remindlist.hasOwnProperty(message.author.id) == false) {
                remindlist[message.author.id] = [];
            }
            let remindsublist = remindmsg.split(',');
            for (let i = 0; i < remindsublist.length; i++) {
                remindsublist[i] = remindsublist[i].trim();
                if (remindsublist[i].substring(0,2) == "<#" || remindsublist[i].substring(0, 3) == "ID:") { // check for channel here
                    let remindID;
                    if (remindsublist[i].substring(0,2) == "<#") {
                        remindID = remindsublist[i].slice(2).trim().slice(0, -1); 
                    }
                    else if (remindsublist[i].substring(0, 3) == "ID:") {
                        remindID = remindsublist[i].slice(3).trim();
                    }
                    /*if (client.channels.cache.get(remindID) === undefined) {
                        message.channel.send("Channel not found.");
                    }*/ //don't check if the channel exists; this lets you remove deleted channels
                    if (remindlist[message.author.id].includes(remindID) == false) {
                        message.channel.send("You are not watching that channel.");
                    }
                    else {
                        remindlist[message.author.id] = remindlist[message.author.id].filter(ID => ID != remindID);
                        if (client.channels.cache.get(remindID) === undefined) {
                            console.log("Deleted channel removed from " + message.author.username + "'s remindlist.");
                        }
                        else {
                            console.log(client.channels.cache.get(remindID).name + " removed from " + message.author.username + "'s remindlist.");
                        }
                    }
                }
                else {
                    message.channel.send("Please either mention the channel directly (`#my-channel`), or use the channel ID (`ID:123456789012345678`). For a more detailed explanation, read this post <https://discord.com/channels/466063257472466944/544025844620853249/1025207876882534420>.");
                }
            }
            fs.writeFile("remindlist.json", JSON.stringify(remindlist), function(err) {
                if (err) throw err;
                console.log('remindlist.json saved');
            });

            SendRemindlist(message);
        }
    }
    else if (message.content.startsWith(prefix + "remind")) {
        if (message.author.bot) return;
        let remindmsg = message.content.slice(8).trim();
        if (remindmsg.length == 0) { // this should give a list of all channels being watched
            if (remindlist.hasOwnProperty(message.author.id) == false || remindlist[message.author.id].length == 0) {
                message.channel.send("You are not watching any channels.");
            }
            else {
                SendRemindlist(message);
            }
        }
        else if (remindmsg == "track") {
            message.channel.send("Use `u!remind track ping` to toggle response tracking for your remindlist. When response tracking is on, your remindlist will show a <:ping:1026739369995931650> next to any channels in which you did not send the last message.\n\
Use `u!remind track time` to toggle timestamp tracking for your remindlist. When timestamp tracking is on, your remindlist will show a timestamp for when the last response in a channel was.\n\
IMPORTANT WARNINGS HERE: (<https://discord.com/channels/466063257472466944/544025844620853249/1026804223876280403>).");
        }
        else if (remindmsg == "track ping") {
            if (remindpings.hasOwnProperty(message.author.id) == false) {
                remindpings[message.author.id] = true;
                message.channel.send("Your remindlist will now track whose response it is. Simply use `u!remind track ping` again to disable it.");
            }
            else if (remindpings[message.author.id] == false) {
                remindpings[message.author.id] = true;
                message.channel.send("Your remindlist will now track whose response it is. Simply use `u!remind track ping` again to disable it.");
            }
            else if (remindpings[message.author.id] == true) {
                remindpings[message.author.id] = false;
                message.channel.send("Your remindlist will no longer track whose response it is. Use `u!remind track ping` if you want to re-enable it.");
            }
            fs.writeFile("remindpings.json", JSON.stringify(remindpings), function(err) {
                if (err) throw err;
                console.log('remindpings.json saved');
            });
        }
        else if (remindmsg == "track time") {
            if (remindtimes.hasOwnProperty(message.author.id) == false) {
                remindtimes[message.author.id] = true;
                message.channel.send("Your remindlist will now track the time since the last response. Simply use `u!remind track time` again to disable it.");
            }
            else if (remindtimes[message.author.id] == false) {
                remindtimes[message.author.id] = true;
                message.channel.send("Your remindlist will now track the time since the last response. Simply use `u!remind track time` again to disable it.");
            }
            else if (remindtimes[message.author.id] == true) {
                remindtimes[message.author.id] = false;
                message.channel.send("Your remindlist will no longer track the time since the last response. Use `u!remind track time` if you want to re-enable it.");
            }
            fs.writeFile("remindtimes.json", JSON.stringify(remindtimes), function(err) {
                if (err) throw err;
                console.log('remindtimes.json saved');
            });
        }
        else if (remindmsg.toLowerCase() == "dms") {
            if (remindoptout.hasOwnProperty(message.author.id) == false) {
                remindoptout[message.author.id] = true;
                message.channel.send("You will no longer be notified when a message is sent in channels on your remindlist. Use `u!remind DMs` again to re-enable this feature.");
            }
            else if (remindoptout[message.author.id] == false) {
                remindoptout[message.author.id] = true;
                message.channel.send("You will no longer be notified when a message is sent in channels on your remindlist. Use `u!remind DMs` again to re-enable this feature.");
            }
            else if (remindoptout[message.author.id] == true) {
                remindoptout[message.author.id] = false;
                message.channel.send("You will be notified when a message is sent in channels on your remindlist. Use `u!remind DMs` again to disable this feature.");
            }
            fs.writeFile("remindoptout.json", JSON.stringify(remindoptout), function(err) {
                if (err) throw err;
                console.log('remindoptout.json saved');
            });
        }
        else if (remindmsg.startsWith("sort")) {
            if (remindmsg == "sort alpha" || remindmsg == "sort pos" || remindmsg == "sort rand" || remindmsg == "sort time" || remindmsg == "sort time desc" || remindmsg == "sort quantum bogo") {
                if (remindlist.hasOwnProperty(message.author.id) == false) {
                    remindlist[message.author.id] = [];
                }
                if (remindmsg == "sort quantum bogo") {
                    message.channel.send("Entropy invalid. Please destroy your universe and try again.");
                    return;
                }
                for (let i = 0; i < remindlist[message.author.id].length; i++) {  
                    if (client.channels.cache.get(remindlist[message.author.id][i]) === undefined) {
                        message.channel.send("I can't sort a remindlist with deleted channels. Use `u!unremind deleted` to remove them.");
                        return;
                    }
                }
                if (remindmsg == "sort alpha") {
                    await remindlist[message.author.id].sort(function(a, b){
                        let achannel = client.channels.cache.get(a);
                        let bchannel = client.channels.cache.get(b);
                        if (achannel.guildId == bchannel.guildId) {
                            return achannel.name.localeCompare(bchannel.name);
                        }
                        else {
                            if (achannel.guildId < bchannel.guildId) {
                                return -1;
                            }
                            else if (achannel.guildId > bchannel.guildId) {
                                return 1;
                            }
                        }
                    });
                }
                else if (remindmsg == "sort pos") {
                    await remindlist[message.author.id].sort(function(a, b){
                        let achannel = client.channels.cache.get(a);
                        let bchannel = client.channels.cache.get(b);
                        let apos;
                        let bpos;
                        if (achannel.position === undefined) {
                            apos = achannel.parent.rawPosition;
                        }
                        else {
                            apos = achannel.rawPosition;
                        }
                        if (bchannel.position === undefined) {
                            bpos = bchannel.parent.rawPosition;
                        }
                        else {
                            bpos = bchannel.rawPosition;
                        }
                        if (achannel.guildId == bchannel.guildId) {
                            if (apos == bpos) {
                                return achannel.name.localeCompare(bchannel.name);
                            }
                            else {
                                if (apos < bpos) {
                                    return -1;
                                }
                                else if (apos > bpos) {
                                    return 1;
                                }
                            }
                        }
                        else {
                            if (achannel.guildId < bchannel.guildId) {
                                return -1;
                            }
                            else if (achannel.guildId > bchannel.guildId) {
                                return 1;
                            }
                        }
                    });
                }
                else if (remindmsg == "sort time" || remindmsg == "sort time desc") {
                    let lastmsgdict = {};
                    let channeltimes = [];
                    
                    let descmod;
                    if (remindmsg == "sort time") {
                        descmod = -1;
                    }
                    else if (remindmsg == "sort time desc") {
                        descmod = 1;
                    }

                    try {
                        for (let i = 0; i < remindlist[message.author.id].length; i++) {
                            let channel = client.channels.cache.get(remindlist[message.author.id][i]);
                            let fetchResults = await channel.messages.fetch();
                            let filteredResults = await fetchResults.filter(message => message.system == false && message.author.bot == false);
                            let lastMessage = filteredResults.first();
                            
                            lastmsgdict[remindlist[message.author.id][i]] = lastMessage.createdTimestamp;
                            channeltimes.push(lastMessage.createdTimestamp)
                        }
                        console.log(lastmsgdict)
                    } catch(error) {
                        console.log(error);
                        message.channel.send("I can't sort a remindlist with empty channels by response time.");
                        return;
                    }

                    await remindlist[message.author.id].sort(function(a, b) {
                        let achannel = client.channels.cache.get(a);
                        let bchannel = client.channels.cache.get(b);

                        let atime = lastmsgdict[a];
                        let btime = lastmsgdict[b];
                            
                        //if (achannel.guildId == bchannel.guildId) {
                            if (atime == btime) {
                                return achannel.name.localeCompare(bchannel.name);
                            }
                            else {
                                if (atime < btime) {
                                    return -1 * descmod;
                                }
                                else if (atime > btime) {
                                    return 1 * descmod;
                                }
                            }
                        /*}
                        else {
                            if (achannel.guildId < bchannel.guildId) {
                                return -1;
                            }
                            else if (achannel.guildId > bchannel.guildId) {
                                return 1;
                            }
                        }*/
                    });
                }
                else if (remindmsg == "sort rand") {
                    let remindCopy = [...remindlist[message.author.id]];
                    for (let i = remindCopy.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [remindCopy[i], remindCopy[j]] = [remindCopy[j], remindCopy[i]];
                    }
                    remindlist[message.author.id] = [...remindCopy];
                }

                fs.writeFile("remindlist.json", JSON.stringify(remindlist), function(err) {
                    if (err) throw err;
                    console.log('remindlist.json saved');
                });

                SendRemindlist(message);
            }
            else {
                message.channel.send("Use `u!remind sort alpha` to sort your remindlist alphabetically, `u!remind sort pos` to sort your remindlist by the channel's position on the sidebar, and `u!remind sort time` to sort by the time since the last response. If you want to randomly shuffle your remindlist, you can use `u!remind sort rand`.");
            }
        }  
        else {
            if (remindlist.hasOwnProperty(message.author.id) == false) {
                remindlist[message.author.id] = [];
            }
            let remindsublist = remindmsg.split(',');
            for (let i = 0; i < remindsublist.length; i++) {
                remindsublist[i] = remindsublist[i].trim();
                if (remindsublist[i].substring(0,2) == "<#" || remindsublist[i].substring(0, 3) == "ID:") { // check for channel here
                    let remindID;
                    if (remindsublist[i].substring(0,2) == "<#") {
                        remindID = remindsublist[i].slice(2).trim().slice(0, -1); 
                    }
                    else if (remindsublist[i].substring(0, 3) == "ID:") {
                        remindID = remindsublist[i].slice(3).trim();
                    }
                    if (client.channels.cache.get(remindID) === undefined) {
                        message.channel.send("Channel not found.");
                    }
                    else {
                        if (remindlist[message.author.id].includes(remindID)) {
                            message.channel.send("Channel already being watched.");
                        }
                        else {
                            remindlist[message.author.id].push(remindID);
                            console.log(client.channels.cache.get(remindID).name + " added to " + message.author.username + "'s remindlist.");
                        }
                    }
                }
                else {
                    message.channel.send("Please either mention the channel directly (`#my-channel`), or use the channel ID (`ID:123456789012345678`). For a more detailed explanation, read this post <https://discord.com/channels/466063257472466944/544025844620853249/1025207876882534420>.");
                }
            }

            fs.writeFile("remindlist.json", JSON.stringify(remindlist), function(err) {
                if (err) throw err;
                console.log('remindlist.json saved');
            });

            SendRemindlist(message);
        }
    }
    else if (message.content.startsWith(prefix + "roster")) {
        if (message.author.bot) return;
        let rostermsg = message.content.slice(8).trim();
        if (rostermsg.substring(0,3) == "<@!") {
            console.log("ping exclamation removed");
            rostermsg = rostermsg.slice(0, 2) + rostermsg.slice(3);
        }
        if (rostermsg.length == 0) {
            if (rosterlist.hasOwnProperty(message.author.id) == false) {
                message.channel.send("You don't have a roster message on record, yet.");
            }
            else {
                message.channel.send("Your roster message:\n" + rosterlist[message.author.id]);
            }
        }
        else {
            client.users.cache.forEach(user => {
                if (user.tag == rostermsg) {
                    console.log("rostermsg matched user tag");
                    console.log("rostermsg");
                    rostermsg = "<@" + user.id + ">";
                    console.log("user tag replaced with id");
                    console.log(rostermsg);
                }
            });
            if (rostermsg.substring(0,2) == "<@" || rostermsg.substring(0,3) == "<!@") {
                console.log(rostermsg.substring(2, rostermsg.length - 1));
                if (rostermsg.substring(2, rostermsg.length - 1) in rosterlist == false) {
                    console.log("property not found");
                    message.channel.send("That person doesn't have a roster message. If you want them to, tell them to use the `u!roster` command to set one up.");
                }
                else {
                    console.log("property found");
                    console.log(rosterlist);
                    message.channel.send(client.users.cache.get(rostermsg.substring(2, rostermsg.length - 1)).username + "'s roster message:\n" + rosterlist[rostermsg.substring(2, rostermsg.length - 1)]);
                }
            }
            /*else if (rostermsg == "show") {
                if (message.author.id !== "221482385399742465" && message.guild.id !== "805756440752816158") return;
                if (userrosters.hasOwnProperty(message.author.id) == false) {
                    message.channel.send("You don't have a roster. Use `u!roster add [muse 1], [muse 2], [muse 3]` to begin adding muses to your roster.")
                    console.log("Roster not found for " + message.author.username);
                }
                else {
                    let outputmsg = ["Your roster:"];
                    let i = 0;
                    for (let j = 0; j < userrosters[message.author.id].length; j++) {
                        if ((outputmsg[i] + "\n" + userrosters[message.author.id][j]).length > 1950) {
                            outputmsg.push("");
                            i++;
                        }
                        outputmsg[i] += "\n" + userrosters[message.author.id][j];
                    }
                    for (let k = 0; k < outputmsg.length; k++) {
                        message.channel.send(outputmsg[k]);
                    }
                }
            }
            else if (rostermsg.startsWith("show ")) {
                rostermsg = rostermsg.slice(5).trim();
                if (rostermsg.substring(0,3) == "<@!") {
                    console.log("ping exclamation removed");
                    rostermsg = rostermsg.slice(0, 2) + rostermsg.slice(3);
                }
                client.users.cache.forEach(user => {
                    if (user.tag == rostermsg) {
                        console.log("rostermsg matched user tag");
                        console.log("rostermsg");
                        rostermsg = "<@" + user.id + ">";
                        console.log("user tag replaced with id");
                        console.log(rostermsg);
                    }
                });
                if (rostermsg.substring(0,2) == "<@" || rostermsg.substring(0,3) == "<!@") {
                    console.log(rostermsg.substring(2, rostermsg.length - 1));
                    if (rostermsg.substring(2, rostermsg.length - 1) in userrosters == false) {
                        console.log("property not found");
                        message.channel.send("That person doesn't have a roster. If you want them to, tell them to use the `u!roster add` command to set one up.");
                    }
                    else {
                        console.log("property found");
                        console.log(userrosters);
                        let outputmsg = [client.users.cache.get(rostermsg.substring(2, rostermsg.length - 1)).username + "'s roster:"];
                        let i = 0;
                        for (let j = 0; j < userrosters[rostermsg.substring(2, rostermsg.length - 1)].length; j++) {
                            if ((outputmsg[i] + "\n" + userrosters[rostermsg.substring(2, rostermsg.length - 1)][j]).length > 1950) {
                                outputmsg.push("");
                                i++;
                            }
                            outputmsg[i] += "\n" + userrosters[rostermsg.substring(2, rostermsg.length - 1)][j];
                        }
                        for (let k = 0; k < outputmsg.length; k++) {
                            message.channel.send(outputmsg[k]);
                        }
                    }
                }
                else {
                    message.channel.send("Format your command as `u!roster show `<@!221482385399742465>` ` or `u!roster show HereToHelp#1941`");
                }
            }
            else if (rostermsg.startsWith("add ")) {
                if (userrosters.hasOwnProperty(message.author.id) == false) {
                    userrosters[message.author.id] = [];
                }
                let rosteraddlist = rostermsg.slice(4).trim().split(',');
                for (let i = 0; i < rosteraddlist.length; i++) {
                    rosteraddlist[i] = rosteraddlist[i].trim();
                    if (rosteraddlist[i].length > 1950) {
                        message.channel.send("Make sure every muse's name is safely under 2000 characters.");
                    }
                    else {
                        userrosters[message.author.id].push(rosteraddlist[i]);
                        console.log(rosteraddlist[i] + " added to " + message.author.username + "'s roster,")
                    }
                }
                userrosters[message.author.id].sort();
                fs.writeFile("userrosters.json", JSON.stringify(userrosters), function(err) {
                    if (err) throw err;
                    console.log('userrosters.json saved');
                    }
                );
                let outputmsg = ["Your updated roster:"];
                let i = 0;
                for (let j = 0; j < userrosters[message.author.id].length; j++) {
                    if ((outputmsg[i] + "\n" + userrosters[message.author.id][j]).length > 1950) {
                        outputmsg.push("");
                        i++;
                    }
                    outputmsg[i] += "\n" + userrosters[message.author.id][j];
                }
                for (let k = 0; k < outputmsg.length; k++) {
                    message.channel.send(outputmsg[k]);
                }
            }
            else if (rostermsg.startsWith("remove ")) {
                if (userrosters.hasOwnProperty(message.author.id) == false) {
                    message.channel.send("You don't have a roster. Use `u!roster add [muse 1], [muse 2], [muse 3]` to begin adding muses to your roster.")
                    console.log("Roster not found for " + message.author.username);
                }
                let rostersublist = rostermsg.slice(7).trim().split(',');
                for (let i = 0; i < rostersublist.length; i++) {
                    rostersublist[i] = rostersublist[i].trim();
                    if (userrosters[message.author.id].includes(rostersublist[i])) {
                        userrosters[message.author.id].splice(userrosters[message.author.id].indexOf(rostersublist[i]), 1);
                        console.log(rostersublist[i] + " removed from " + message.author.username + "'s roster")
                    }
                    else {
                        console.log("\"" + rostersublist[i] + "\" wasn't in " + message.author.username + " roster.");
                        message.channel.send("\"" + rostersublist[i] + "\" wasn't in your roster.");
                    }
                }
                if (userrosters[message.author.id].length === 0) {
                    delete userrosters[message.author.id];
                    console.log(message.author.username + "'s roster was deleted after reaching 0 items.")
                    message.channel.send("Your roster is now empty.");
                }
                else {
                    userrosters[message.author.id].sort();
                    let outputmsg = ["Your updated roster:"];
                    let i = 0;
                    for (let j = 0; j < userrosters[message.author.id].length; j++) {
                        if ((outputmsg[i] + "\n" + userrosters[message.author.id][j]).length > 1950) {
                            outputmsg.push("");
                            i++;
                        }
                        outputmsg[i] += "\n" + userrosters[message.author.id][j];
                    }
                    for (let k = 0; k < outputmsg.length; k++) {
                        message.channel.send(outputmsg[k]);
                    }
                }
                fs.writeFile("userrosters.json", JSON.stringify(userrosters), function(err) {
                    if (err) throw err;
                    console.log('userrosters.json saved');
                    }
                );
            }
            else if (rostermsg == "choose") {
                if (userrosters.hasOwnProperty(message.author.id) == false) {
                    message.channel.send("You don't have a roster. Use `u!roster add [muse 1], [muse 2], [muse 3]` to begin adding muses to your roster.")
                    console.log("Roster not found for " + message.author.username);
                }
                else {
                    let randomnum = Math.floor(Math.random() * userrosters[message.author.id].length);
                    message.channel.send("**" + userrosters[message.author.id][randomnum] + "** was selected.");
                }
            }*/
            else {
                if (rostermsg.replaceAll('@', '').length > 1900) {
                    message.channel.send("I won't set roster messages that aren't safely under 2000 characters.")
                }
                else {
                    rosterlist[message.author.id] = rostermsg.replaceAll('@', '');
                    message.channel.send("Your roster message has been set:\n" + rostermsg.replaceAll('@', ''));
                    console.log("New roster message added.");
                    fs.writeFile("rosterlist.json", JSON.stringify(rosterlist), function(err) {
                        if (err) throw err;
                        console.log('rosterlist.json saved');
                        }
                    );
                }
            }
        }
    }
    else if (message.author.id == "233017580632276992" && message.content.toLowerCase().includes("slut")) {
        let fetchResults = await message.channel.messages.fetch({ limit: 2 });
        let priorMessage = fetchResults.last();
        
        if (priorMessage.author.id != "888209624631750667" || priorMessage.content.includes("Your remindlist:") == false) {
            return;
        }

        let retortchoice = Math.floor(Math.random() * retorts.length)
        message.channel.send(retorts[retortchoice]);
        
        /*if (retortchoice == 7) {
            let remindCopy = [...remindlist[message.author.id]];
            for (let i = remindCopy.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [remindCopy[i], remindCopy[j]] = [remindCopy[j], remindCopy[i]];
            }
            remindlist[message.author.id] = [...remindCopy];

            fs.writeFile("remindlist.json", JSON.stringify(remindlist), function(err) {
                if (err) throw err;
                console.log('remindlist.json saved');
            });
        }*/

        if (message.channel.type === ChannelType.DM) {
            botLogs.send("<@!221482385399742465> Workplace harassment detected in DMs. I responded accordingly.");
        }
        else {
            botLogs.send("<@!221482385399742465> Workplace harassment detected. I responded accordingly.\n" + messageLink(message));
        }
    }
})

async function wordInitialize() {
    /*const Guilds = client.guilds.cache.map(guild => guild.id);
    console.log(Guilds);
    Guilds.forEach(guildid => {
        guild = client.guilds.cache.get(guildid);
        console.log(guild.channels.cache);
    })
    console.log(client.channels);*/
    console.log("wordinitialize reached")
    var msgsprocessed = 0;
    client.channels.cache.forEach(channel => {
        if (channel.isText()) {
            //console.log(channel.name);
            if (wordlist.hasOwnProperty(channel.guildId) == false) {
                wordlist[channel.guildId] = [];
            }
            channel.messages.fetch({ limit: 100 }).then(messages => {
                //console.log(`Received ${messages.size} messages`);
                //Iterate through the messages here with the variable "messages".
                messages.forEach(message => {
                    let msgWordArray = message.content.replaceAll(/[\W_]+/g," ").split(' ');
                    let serverId = message.guildId;
                    for (const word of msgWordArray) {
                        let lcword = word.toLowerCase();
                        if (wordlist[serverId].includes(lcword) == false) {
                            wordlist[serverId].push(lcword);
                            //console.log(wordlist[serverId]);
                        }
                    }
                    msgsprocessed++;
                    if (msgsprocessed %500 == 0) {
                        console.log(msgsprocessed);
                    }
                })
            })
        }
        else {
            console.log("channel not identified with type");
            console.log(channel.name);
        }
    })
    wordsReady = true;
}

function afterWordInitialize() {
    const Guilds = client.guilds.cache.map(guild => guild.id);
    console.log(Guilds);
    for (let i = 0; i < Guilds.length; i++) {
        console.log(wordlist[Guilds[i]]);
    }
    botLogs.send("Wordlists intialized!");
    wordsReady = true;
    SaveWordlist();
}

function SaveWordlist() {
    fs.writeFile("wordlist.json", JSON.stringify(wordlist), function(err) {
        if (err) throw err;
        console.log('wordlist.json saved');
        }
    );
}

function makeSuperscript(str) {
    //⁰¹²³⁴⁵⁶⁷⁸⁹
    let strarray = str.split('');
    for (let k = 0; k < strarray.length; k++) {
        if (strarray[k] == '0')
            strarray[k] = '⁰';
        else if (strarray[k] == '1')
            strarray[k] = '¹';
        else if (strarray[k] == '2')
            strarray[k] = '²';
        else if (strarray[k] == '3')
            strarray[k] = '³';
        else if (strarray[k] == '4')
            strarray[k] = '⁴';
        else if (strarray[k] == '5')
            strarray[k] = '⁵';
        else if (strarray[k] == '6')
            strarray[k] = '⁶';
        else if (strarray[k] == '7')
            strarray[k] = '⁷';
        else if (strarray[k] == '8')
            strarray[k] = '⁸';
        else if (strarray[k] == '9')
            strarray[k] = '⁹';
        else {
            console.log("Error: non-numerical die");
        }
    }
    let newstring = strarray.join('');
    return newstring;
}

client.login(TOKEN);