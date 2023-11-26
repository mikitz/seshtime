# Sesh Time
A Discord bot that helps me to schedule and manage the sessions I DM for DnD 5e.

## TO-DO List


## 🐛 BUGS
- `database.js` - TTL needs 1,700,564,000,000ms subtracted from it to work
    - If this is subtracted, the KV pair gets deleted on `Keyv.get()` in 
    - [BAND-AID FIX] All events for the current guild are scanned upon event creation in `create-session.js`.

## Features

### Settings
- **Game Master Role ID** `gameMasterRoleId` = The role of the game master for an event. 
    - This is used to cancel an event if the event author has this role and RSVPs as *Not Attending*.
- **Player Role ID** `playerRoleId` = The role of the players.
    - This is used to determine the group size. The group size is used to determine when a session must be automatically canceled due to having to many *Not Attending* players using `notAttending > groupSize - minPlayers`.
- **Minimum Players** `minPlayers` = The minimum number of players in order to have a session.
- **Maximum Players** `maxPlayers` = The maximum number of players for a session.
- **RSVP Deadline** `rsvpDeadline` = The number of days prior to the session datetime that players must RSVP by.
    - This is used to automatically cancel a session if **Minimum Players** is not satisfied by the specified date.
- **Reminder Frequency** `reminderFrequency` = The number of days between reminders for players who are *Pending* or *Maybe*.
- **Time Zone** `timezone` = The time zone in which to schedule the sessions.

## Dependencies
1. [Node.js](https://nodejs.org/en/)
2. [Discord.js](https://discord.js.org/#/)
3. [Keyv](https://keyv.org/)