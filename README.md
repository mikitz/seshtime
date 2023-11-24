# Sesh Time
A Discord bot that helps me to schedule and manage the sessions I DM for DnD 5e.

## TO-DO List
- [ ] Buttons
    - [ ] - Buttons properly handle all event status changes
- [ ] Reminders
    - [ ] Remind *Pending* and *Maybe* players to RSVP every day
- [ ] Recurring Sessions
    - [ ] Weekly
    - [ ] Bi-weekly
    - [ ] Monthly

## 🐛 BUGS
- [ ] `database.js` - TTL needs 1,700,564,000,000ms subtracted from it to work
    - If this is subtracted, the KV pair gets deleted on `Keyv.get()` in 

## Features


## Dependencies
1. [Node.js](https://nodejs.org/en/)
2. [Discord.js](https://discord.js.org/#/)
3. [Keyv](https://keyv.org/)