const { DateTime } = require("luxon");

function calculateTTL(sessionDate, sessionTime, sessionTimezone) {
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

module.exports = { calculateTTL };