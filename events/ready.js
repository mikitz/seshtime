const SESHTIME_ASCII_ART = `
		███████╗███████╗███████╗██╗  ██╗████████╗██╗███╗   ███╗███████╗
		██╔════╝██╔════╝██╔════╝██║  ██║╚══██╔══╝██║████╗ ████║██╔════╝
		███████╗█████╗  ███████╗███████║   ██║   ██║██╔████╔██║█████╗  
		╚════██║██╔══╝  ╚════██║██╔══██║   ██║   ██║██║╚██╔╝██║██╔══╝  
		███████║███████╗███████║██║  ██║   ██║   ██║██║ ╚═╝ ██║███████╗
		╚══════╝╚══════╝╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝╚═╝     ╚═╝╚══════╝`;
const MINUTE_IN_MILLISECONDS = 60000;
const HOUR_IN_MILLISECONDS = 3600000;
const DAY_IN_MILLISECONDS = 86400000;
const REMINDER_FREQUENCY = 1;
const { DateTime } = require("luxon");
const { Events } = require("discord.js");
const { Client, GatewayIntentBits } = require("discord.js");
const { token } = require("../config.json");
const Keyv = require("keyv");
const {
    sleep,
    sendDirectMessage,
    sendMessageToChannel,
} = require("../helpers.js");
const { updateEvent } = require("../database.js");
const logger = require("../logger.js");
const fs = require("fs");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});
module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(SESHTIME_ASCII_ART);
        logger.log(SESHTIME_ASCII_ART);
        console.log(
            "[Sesh Time]",
            DateTime.now().toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)
        );
        logger.log(
            DateTime.now().toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)
        );
        console.log("[Sesh Time]", `${client.user.tag} is online!`);
        logger.log(`${client.user.tag} is online!`);

        console.log("[Sesh Time]", "Clearing logs...");
        fs.writeFileSync("logs/logs.txt", "", { flag: "w" });
        console.log("[Sesh Time]", "Logs cleared!");
        // Ensure that the intervals are set at the top of the hour
        const nowNow = new Date();
        const nextHour = new Date(
            nowNow.getFullYear(),
            nowNow.getMonth(),
            nowNow.getDate(),
            nowNow.getHours() + 1,
            0,
            0
        );
        const delay = nextHour - nowNow;
        logger.log(`~~~ Sleeping until the top of the hour ~~~`);
        await sleep(delay);

        // Auto-cancel Events
        logger.log(
            `---- INTERVALS -- Setting up Auto-cancel Events interval...`
        );
        setInterval(async function () {
            const keyv = new Keyv(`sqlite:../../mydatabase.sqlite`, {
                table: "keyv",
            });
            keyv.on("error", (err) =>
                logger.error(`Connection Error : ${err}`)
            );

            let guilds = await keyv.get("guilds");
            if (guilds === undefined) guilds = [];
            else guilds = JSON.parse(guilds);

            for (let index = 0; index < guilds.length; index++) {
                const guild = guilds[index];

                const dbGuild = new Keyv(`sqlite:../../mydatabase.sqlite`, {
                    table: guild,
                });
                dbGuild.on("error", (err) =>
                    logger.error(`Connection Error : ${err}`)
                );

                let events = await dbGuild.get("events");
                if (events === undefined) events = [];
                else events = JSON.parse(events);

                let settings = await dbGuild.get("settings");
                if (settings === undefined) settings = { reminderFrequency: 2 };
                else settings = JSON.parse(settings);
                const reminderFrequency = settings.reminderFrequency;
                if (reminderFrequency == undefined) continue;
                const reminderChannel = settings.reminderChannel;
                let now = DateTime.now();
                logger.log(
                    `AUTO-CANCELING -- Guild ${guild} : Auto-canceling events...`
                );
                let canceledEvents = 0;
                if (
                    typeof rsvpDeadline === "undefined" ||
                    now >= rsvpDeadline
                ) {
                    for (let index = 0; index < events.length; index++) {
                        const event = events[index];
                        const datetime = DateTime.fromISO(event.datetime);
                        const status = event.status;
                        const rsvpDeadline = DateTime.fromISO(
                            event.rsvpDeadline
                        );
                        logger.log(
                            `------ CHECKING STATUS -- Guild ${guild} : Status ${status}`
                        );
                        if (status && status.includes("canceled")) continue;
                        logger.log(
                            `----- CANCELING EVENT -- Guild ${guild} : Event ${event.messageId}`
                        );
                        // Cancel Event
                        event.status =
                            "canceled due to insufficient ATTENDING players";
                        logger.log(
                            `----- UPDATING EVENT -- Guild ${guild} : Event ${event.messageId}`
                        );
                        await updateEvent(guild, event, null, null);
                        const messageContent = `<@&${
                            settings.playerRoleId
                        }> <@&${
                            settings.gamemasterRoleId
                        }> \n **SESSION CANCELED** -- **${event.title}** on **${
                            event.date
                        }** is now *CANCELED* due to insufficient ATTENDING players prior to the RSVP deadline. Deadline = ${
                            event.rsvpDeadline
                        }. Now = ${now.toLocaleString(
                            DateTime.DATETIME_SHORT_WITH_SECONDS
                        )}.`;
                        logger.log(
                            `----- SENDING MESSAGE -- Guild ${guild} : Event ${event.messageId}`
                        );
                        await sendMessageToChannel(
                            client,
                            event.channelId,
                            messageContent
                        );
                        canceledEvents++;
                    }
                }
                now = DateTime.now();
                logger.log(
                    `AUTO-CANCELING -- Guild ${guild} : Canceled ${canceledEvents} events.`
                );
            }
        }, HOUR_IN_MILLISECONDS);
        // Remind Players
        logger.log(`---- INTERVALS -- Setting up Remind Players interval...`);
        setInterval(async function () {
            const keyv = new Keyv(`sqlite:../../mydatabase.sqlite`, {
                table: "keyv",
            });
            keyv.on("error", (err) =>
                logger.error(`Connection Error : ${err}`)
            );

            let guilds = await keyv.get("guilds");
            if (guilds === undefined) guilds = [];
            else guilds = JSON.parse(guilds);
            logger.log("🚀 ~ file: ready.js:36 ~ execute ~ guilds:", guilds);

            for (let index = 0; index < guilds.length; index++) {
                const guild = guilds[index];

                const dbGuild = new Keyv(`sqlite:../../mydatabase.sqlite`, {
                    table: guild,
                });
                dbGuild.on("error", (err) =>
                    logger.error(`Connection Error : ${err}`)
                );

                let events = await dbGuild.get("events");
                if (events === undefined) events = [];
                else events = JSON.parse(events);

                let settings = await dbGuild.get("settings");
                if (settings === undefined) settings = { reminderFrequency: 2 };
                else settings = JSON.parse(settings);
                const reminderFrequency = settings.reminderFrequency;
                if (reminderFrequency == undefined) continue;
                const reminderChannel = settings.reminderChannel;

                let now = DateTime.now();
                logger.log(
                    `REMINDING -- Guild ${guild} : Reminding players...`
                );
                let remindedPlayers = 0;
                for (let index = 0; index < events.length; index++) {
                    let event = events[index];
                    if (typeof event === "number") continue;
                    const RSVPs = event.RSVPs;
                    const nicknameIdMap = event.nicknameIdMap;
                    let attending = RSVPs.attending;
                    let notAttending = RSVPs.notAttending;
                    let maybe = RSVPs.maybe;
                    let pending = RSVPs.pending;
                    if (maybe.length > 0 || pending.length > 0) {
                        const link = `https://discord.com/channels/${guild}/${event.channelId}/${event.messageId}`;
                        const maybePending = [...pending, ...maybe];
                        // Remind Players
                        for (
                            let index = 0;
                            index < maybePending.length;
                            index++
                        ) {
                            remindedPlayers++;
                            const member = maybePending[index];
                            const userId = nicknameIdMap.find(
                                (i) => i.nickname === member
                            ).userId;
                            const datetime = DateTime.fromISO(event.datetime);
                            const messageContent = `Hail and well met, <@${userId}>! This is a reminder to RSVP for **${
                                event.title
                            }** on *${datetime.toLocaleString(
                                DateTime.DATETIME_MED
                            )}*. Here's the link to the session: ${link}`;
                            logger.log(
                                `----- MESSAGING -- Guild ${guild} : Player ${member}`
                            );
                            const directMessage = await sendDirectMessage(
                                client,
                                userId,
                                messageContent
                            );
                            if (directMessage === "error")
                                await sendMessageToChannel(
                                    client,
                                    reminderChannel,
                                    messageContent
                                );
                        }
                    }
                }
                now = DateTime.now();
                logger.log(
                    `REMINDING -- Guild ${guild} : Reminded ${remindedPlayers} players.`
                );
            }
        }, DAY_IN_MILLISECONDS * REMINDER_FREQUENCY);
    },
};
