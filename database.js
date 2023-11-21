const { sql_path } = require('./config.json');
const Keyv = require('keyv');
const keyv = new Keyv(`sqlite:../../mydatabase.sqlite`)
keyv.on('error', err => console.log('Connection Error', err));

async function getGuildData(guildId){
    let guilds = await keyv.get('guilds')
    guilds = JSON.parse(guilds)
    const guildInDatabase = guilds.includes(guildId) ? true : false
    if (guildInDatabase){
        let guildData = await keyv.get(guildId)
        return JSON.parse(guildData)
    } else {
        guilds.push(guildId)
        await keyv.set('guilds', JSON.stringify(guilds))
        return []
    }
}

async function addEvent(guildId, eventObject, ttl){
    let guildEvents = await keyv.get(guildId)
    if (guildEvents === undefined) guildEvents = []
    else guildEvents = JSON.parse(guildEvents)
    guildEvents.push(eventObject.messageId)
    await keyv.set(guildId, JSON.stringify(guildEvents))
    console.log("🚀 ~ file: database.js:21 ~ addEvent ~ ttl:", ttl)
    await keyv.set(`${guildId}-${eventObject.messageId}`, JSON.stringify(eventObject), ttl - 1700564000000)
}

module.exports = { getGuildData, addEvent }