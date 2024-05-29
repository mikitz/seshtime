# Sesh Time

A Discord bot that helps me to schedule and manage the sessions I DM for DnD 5e.

## Ideas

-   _Maybe_ players should only be notified ~24 hours prior to deadline instead of as the **Reminder Frequency** dictates?
-   Add a button to each session to reschedule with a new date. This would copy all data from the session except the date, which would require user input.

## Features

### Settings

-   **Game Master Role ID** `gameMasterRoleId` = The role of the game master for an event.
    -   This is used to cancel an event if the event author has this role and RSVPs as _Not Attending_.
-   **Player Role ID** `playerRoleId` = The role of the players.
    -   This is used to determine the group size. The group size is used to determine when a session must be automatically canceled due to having to many _Not Attending_ players using `notAttending > groupSize - minPlayers`.
-   **Minimum Players** `minPlayers` = The minimum number of players in order to have a session.
-   **Maximum Players** `maxPlayers` = The maximum number of players for a session.
-   **RSVP Deadline** `rsvpDeadline` = The number of days prior to the session datetime that players must RSVP by.
    -   This is used to automatically cancel a session if **Minimum Players** is not satisfied by the specified date.
-   **Reminder Frequency** `reminderFrequency` = The number of days between reminders for players who are _Pending_ or _Maybe_.
-   **Time Zone** `timezone` = The time zone in which to schedule the sessions.

## Dependencies

1. [Node.js](https://nodejs.org/en/)
2. [Discord.js](https://discord.js.org/#/)
3. [Keyv](https://keyv.org/)

## Known Issues

-   `database.js` - TTL needs 1,700,564,000,000ms subtracted from it to work
    -   If this is subtracted, the KV pair gets deleted on `Keyv.get()`
    -   [BAND-AID FIX] All events for the current guild are scanned upon event creation in `create-session.js`.

## Change Log

-   todo
    -   RSVP Frequency is now respected
    -
-   2024/05/02
    -   added: when a player attempts to confirm their attendance, max players will be checked and if it is exceeded, the player will alerted that they cannot join because the session is full.
    -   fixed: bot no longer reminds players to RSVP for sessions that have already happened
    -   added: can now delete all events for the guild
    -   added: can now delete a events by its message ID
-   2023/11/30 - `logger.js` - added console.log/warn/error to all logger calls.
-   2023/11/29 - `logger.js` - Moved logs to /logs and now a new file is created every time the bot is started.
-   2023/11/29 - `ready.js` - Fixed "unknown interaction" bug caused by a missing `await` before updateEvent() in interactionCreate.js:107.
-   2023/11/26 - `ready.js` - Added reminder in case the direct message fails.
-   2023/11/26 - `settings.js` - Added `reminderChannel` to settings.
-   2023/11/26 - `ready.js` - Added _Auto-cancel Events_ interval and _Remind Players_ interval. These need to be tested.
-   2023/11/26 - `interactionCreate.js` & `helpers.js` - Buttons now correctly change an event's status and send the appropriate message.
-   2023/11/25 - `create-session.js` - Reworked embeds to show Game Master to handle multiple GMs per server in teh future if needed.
-   2023/11/24 - `create-session.js` - Group Size now properly gets the number of members with the specified player role
-   2023/11/24 - Database - Refactored to create a new table for each Guild, which has only two keys: settings and events.
-   2023/11/24 - Settings - Added DEFAULTS for all of the above in `settings.js`
-   2023/11/24 - Settings - When setting the settings, if an option is left blank, it will load the saved data from the database instead of the default if there is data saved.
-   2023/11/23 - Buttons - Buttons now update database and the embed
-   2023/11/23 - Settings - Added `/settings` command with the following options: - Time Zone: _required_ - Game Master Role: _required_ - Player Role: _required_ - Minimum Players - Maximum Players - RSVP Deadline - TTL Offset - Reminder Frequency
