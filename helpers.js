const { DateTime } = require("luxon");
const Keyv = require('keyv');
const logger = require("./logger");

function calculateTTL(sessionDate, sessionTime, sessionTimezone){
    const dateTimeNow = DateTime.local({zone: sessionTimezone})

    let sessionDateSplit
    if (sessionDate.includes("-")) sessionDateSplit = sessionDate.split("-")
    else if (sessionDate.includes("/")) sessionDateSplit = sessionDate.split("/")

    let hourOffset = 0
    if (sessionTime.includes("pm")) hourOffset = 12
    const sessionHour = parseInt(sessionTime.replace("pm","").replace("am","")) + hourOffset
    const sessionDateTime = DateTime.local(
        parseInt(sessionDateSplit[2]), 
        parseInt(sessionDateSplit[0]), 
        parseInt(sessionDateSplit[1]),
        sessionHour, 0, 0, 0,
        {zone: sessionTimezone})
    const sessionTTL = Math.abs(sessionDateTime.toMillis() - dateTimeNow.toMillis())
    return {sessionDateTime: sessionDateTime, TTL: sessionTTL, now: dateTimeNow}
}
function removeMemberFromRSVPList(RSVPList, member){
    const index = RSVPList.indexOf(member);
    if (index !== -1) RSVPList.splice(index, 1);
    return RSVPList
}
async function determineEventStatus(guildId, eventObject, user, buttonId){
    const keyv = new Keyv(`sqlite:../../mydatabase.sqlite`, { table: guildId })
    keyv.on('error', err => logger.error(`Connection Error : ${err}`));

    let settings = await keyv.get('settings')
    settings = JSON.parse(settings)

    const author = eventObject.author
    const minPlayers = eventObject.minPlayers
    const groupSize = eventObject.groupSize
    const RSVPs = eventObject.RSVPs
    let attending = RSVPs.attending.length
    let notAttending = RSVPs.notAttending.length
    let maybe = RSVPs.maybe.length
    let status = eventObject.status
    let sendMessage = false
    // Not Attending Button
    if (buttonId === 'not-attending') {
        // Event author (Game Master) cannot attend
        if (!status.includes('cancel') && author == user) {
            status = 'canceled due to Game Master NOT ATTENDING'
            sendMessage = true
        }
        // Insufficient Players
        else if (!status.includes('cancel') && notAttending > groupSize - minPlayers) {
            status = 'canceled due to too many NOT ATTENDING players' 
            sendMessage = true
        }
        // Unconfirm Session
        else if (!status.includes('pending') && attending < minPlayers) {
            status = `pending due to changes in RSVPs`
            sendMessage = true
        }
    } 
    // Maybe Button
    else if (buttonId === 'maybe') {
        // Un-confirm Session
        if (status.includes('confirmed') && attending < minPlayers) {
            status = `pending due to changes in RSVPs`
            sendMessage = true
        }
        // Un-cancel Session
        else if (status.includes('canceled') && notAttending <= groupSize - minPlayers){
            status = `pending due to changes in RSVPs`
            sendMessage = true
        }
    } 
    // Attending Button
    else if (buttonId === 'attending') {
        // Confirm Session
        if (!status.includes('confirmed') && attending >= minPlayers) {
            status = `confirmed`
            sendMessage = true
        }
        // Un-cancel Session
        else if (status.includes('canceled') && notAttending <= groupSize - minPlayers){
            status = `pending due to changes in RSVPs`
            sendMessage = true
        }
    }
    
    return {status:status, sendMessage:sendMessage}
}
async function getMembersByRole(guildId, roleId, client, authorId){
    const guild = await client.guilds.fetch(guildId);
    if (!guild) return []
    let members
    try { members = await guild.members.fetch() }
    catch(error) { 
        logger.error(error) 
        return
    }
    if (!members) return []
    let gameMaster = members.find(member => member.user.id === authorId)
    gameMaster = gameMaster.nickname || gameMaster.user.globalName || gameMaster.user.username
    members = members.filter(member => member.roles.cache.has(roleId))
    const map = members.map(member => ({ nickname: member.nickname, userId: member.user.id }))
    members = members.map(member => member.nickname || member.user.globalName || member.user.username);

    return { members:members, gameMaster: gameMaster, nicknameIdMap: map }
}
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function sendDirectMessage(client, userId, messageText) {
    try {
        const user = await client.users.fetch(userId);
        await user.send(messageText);
        logger.log(`Message sent to user ${user.tag}`);
    } catch (error) {
        logger.error(`Could not send DM to user with ID ${userId}. Error: ${error}`);
        return 'error'
    }
}
async function sendMessageToChannel(client, channelId, messageText) {
    try {
        const channel = await client.channels.fetch(channelId);
        if (channel.type !== 'GuildText' && channel.type !== 0) {
            logger.error('The channel is not a text channel.');
            return
        }
        await channel.send(messageText);
        logger.log(`Message sent to channel ID ${channelId}`);
    } catch (error) {
        logger.error(`Could not send message to channel ID ${channelId}. Error: ${error}`);
    }
}

module.exports = { calculateTTL, 
    removeMemberFromRSVPList, 
    determineEventStatus, 
    getMembersByRole, 
    sleep,
    sendDirectMessage,
    sendMessageToChannel };