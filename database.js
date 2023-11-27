const TTL_OFFSET = 0
// const TTL_OFFSET = 1700564000000
const { sql_path } = require('./config.json');
const { DateTime } = require("luxon");
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
async function addEvent(guildId, eventObject){
    const keyv = new Keyv(`sqlite:../../mydatabase.sqlite`, { table: guildId })
    keyv.on('error', err => console.log('Connection Error', err));
    let events = await keyv.get('events')
    if (events === undefined) events = []
    else events = JSON.parse(events)
    events.push(eventObject)
    await keyv.set('events', JSON.stringify(events))
    console.log(`CREATED -- Guild ${guildId} : Event ${eventObject.messageId} added successfully!`)
}
async function updateEvent(guildId, eventObject, attendanceStatus, memberNickname){
    if (!attendanceStatus) attendanceStatus = 'null'
    if (!memberNickname) memberNickname = 'null'
    const keyv = new Keyv(`sqlite:../../mydatabase.sqlite`, { table: guildId })
    keyv.on('error', err => console.log('Connection Error', err))
    let events = await keyv.get('events')
    events = JSON.parse(events)
    const messageId = eventObject.messageId
    const eventIndex = events.findIndex(obj => obj.messageId === messageId)
    events[eventIndex] = eventObject
    await keyv.set('events', JSON.stringify(events))
    console.log(`UPDATED -- Guild ${guildId} : Event ${messageId} updated successfully! ${memberNickname} is now ${attendanceStatus}.`)
}
async function deleteExpiredEvents(guildId){
    const keyv = new Keyv(`sqlite:../../mydatabase.sqlite`, { table: guildId })
    keyv.on('error', err => console.log('Connection Error', err));
    let events = await keyv.get('events')
    events = JSON.parse(events)
    console.log(`DELETING -- Guild ${guildId} : Scanning ${events.length} events for possible deletion...`)
    let eventsToKeep = []
    for (let i = 0; i < events.length; i++) {
        const event = events[i]
        const datetime = DateTime.fromISO(event.datetime)
        const now = DateTime.now()
        if (datetime > now) eventsToKeep.unshift(i)
    }
    await keyv.set('events', JSON.stringify(eventsToKeep))
    console.log(`DELETING -- Guild ${guildId} : Deleted ${events.length - eventsToKeep.length} event(s)`)
}
module.exports = { getGuildData, addEvent, deleteExpiredEvents, updateEvent }