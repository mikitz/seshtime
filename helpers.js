const { DateTime } = require("luxon");

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
function determineEventStatus(eventObject){
    const minPlayers = eventObject.minPlayers
    const groupSize = eventObject.groupSize
    const RSVPs = eventObject.RSVPs
    let attending = RSVPs.attending
    let notAttending = RSVPs.notAttending
    let maybe = RSVPs.maybe
    const datetime = eventObject.datetime
    const RSVPDeadline = eventObject.RSVPDeadline
    const now = DateTime.now()

    let status
    // Game Master cannot attend
    if (notAttending > groupSize - minPlayers) status = 'canceled due to too many NOT ATTENDING players' // Insufficient Players
    else if (attending < minPlayers && now > RSVPDeadline) status = 'canceled due to insufficient ATTENDING players prior to the RSVP deadline' // RSVP Deadline lapsed
    // Unconfirm Session
    // Confirm Session

}
module.exports = { calculateTTL, removeMemberFromRSVPList, determineEventStatus };