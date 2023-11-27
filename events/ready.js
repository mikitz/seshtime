const SESHTIME_ASCII_ART = `
		███████╗███████╗███████╗██╗  ██╗████████╗██╗███╗   ███╗███████╗
		██╔════╝██╔════╝██╔════╝██║  ██║╚══██╔══╝██║████╗ ████║██╔════╝
		███████╗█████╗  ███████╗███████║   ██║   ██║██╔████╔██║█████╗  
		╚════██║██╔══╝  ╚════██║██╔══██║   ██║   ██║██║╚██╔╝██║██╔══╝  
		███████║███████╗███████║██║  ██║   ██║   ██║██║ ╚═╝ ██║███████╗
		╚══════╝╚══════╝╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝╚═╝     ╚═╝╚══════╝`
const MINUTE_IN_MILLISECONDS = 60000
const HOUR_IN_MILLISECONDS = 3600000
const DAY_IN_MILLISECONDS = 86400000
const { DateTime } = require("luxon");
const { Events } = require('discord.js');
const { Client, GatewayIntentBits } = require('discord.js');
const { token } = require('../config.json');
const Keyv = require('keyv');
const { sleep, sendDirectMessage, sendMessageToChannel } = require('../helpers.js')
const { updateEvent } = require('../database.js')

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		console.log(SESHTIME_ASCII_ART)
		console.log(`${client.user.tag} is online!`)

		// Ensure that the intervals are set at the top of the hour
		const now = new Date()
		const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0)
		const delay = nextHour - now
		console.log(`~~~ Sleeping until the top of the hour ~~~`)
		// await sleep(delay) // TODO: Uncomment this for deploy

		const keyv = new Keyv(`sqlite:../../mydatabase.sqlite`, { table: 'keyv' })
		keyv.on('error', err => console.log('Connection Error', err))

		let guilds = await keyv.get('guilds')
		if (guilds === undefined) guilds = []
		else guilds = JSON.parse(guilds)
		console.log("🚀 ~ file: ready.js:36 ~ execute ~ guilds:", guilds)

		for (let index = 0; index < guilds.length; index++) {
			const guild = guilds[index];
			
			const dbGuild = new Keyv(`sqlite:../../mydatabase.sqlite`, { table: guild })
			dbGuild.on('error', err => console.log('Connection Error', err))
			
			let events = await dbGuild.get('events')
			if (events === undefined) events = []
			else events = JSON.parse(events)
			
			let settings = await dbGuild.get('settings')
			if (settings === undefined) settings = { reminderFrequency: 2 }
			else settings = JSON.parse(settings)
			const reminderFrequency = settings.reminderFrequency
			if (reminderFrequency == undefined) continue
			const reminderChannel = settings.reminderChannel
			
			console.log(`INTERVALS -- Setting up intervals for Guild ${guild}`)
			// Auto-cancel Events
			console.log(`---- INTERVALS -- Setting up Auto-cancel Events interval...`)
			setInterval( async function() {
				let now = DateTime.now()
				console.log(`[${now.toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}] AUTO-CANCELING -- Guild ${guild} : Auto-canceling events...`)
				let canceledEvents = 0
				for (let index = 0; index < events.length; index++) {
					const event = events[index]
					console.log("🚀 ~ file: ready.js:68 ~ setInterval ~ event:", event)
					const datetime = event.datetime
					const status = event.status
					const rsvpDeadline = event.rsvpDeadline
					if (now >= rsvpDeadline || rsvpDeadline == undefined) {
						if (status && status.includes('canceled')) continue
						// Cancel Event
						event.status = 'canceled due to insufficient ATTENDING players'
						console.log(`[${now.toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}] ----- UPDATING EVENT -- Guild ${guild} : Event ${event.messageId}`)
						await updateEvent(guild, event, null, null)
						const messageContent = (`<@&${settings.playerRoleId}> <@&${settings.gamemasterRoleId}> \n **SESSION CANCELED** -- **${event.title}** on **${event.date}** is now *CANCELED* due to insufficient ATTENDING players prior to the RSVP deadline.`)
						console.log(`[${now.toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}] ----- SENDING MESSAGE -- Guild ${guild} : Event ${event.messageId}`)
						await sendMessageToChannel(client, event.channelId, messageContent)
						canceledEvents ++
					}
				}
				now = DateTime.now()
				console.log(`[${now.toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}] AUTO-CANCELING -- Guild ${guild} : Canceled ${canceledEvents} events.`)
			}, MINUTE_IN_MILLISECONDS) // TODO: Change this to HOUR_IN_MILLISECONDS for deploy
			// Remind Players
			console.log(`---- INTERVALS -- Setting up Remind Players interval...`)
			if (reminderFrequency) {
				setInterval( async function() {
					let now = DateTime.now()
					console.log(`[${now.toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}] REMINDING -- Guild ${guild} : Reminding players...`)
					let remindedPlayers = 0
					for (let index = 0; index < events.length; index++) {
						const event = events[index];
						const RSVPs = eventObject.RSVPs
						const nicknameIdMap = eventObject.nicknameIdMap
						let attending = RSVPs.attending
						let notAttending = RSVPs.notAttending
						let maybe = RSVPs.maybe
						let pending = RSVPs.pending
						if (maybe.length > 0 || pending.length > 0)	{
							const link = `https://discord.com/channels/${guild}/${event.channelId}/${event.messageId}`
							const messageContent = `Hail and well met, <@${userId}>! This is a reminder to RSVP for **${event.title}** on *${event.datetime.toLocaleString(DateTime.DATETIME_MED)}*. Here's the link to the message: ${link}`
							const maybePending = [...pending, ...maybe]
							// Remind Players
							for (let index = 0; index < maybePending.length; index++) {
								remindedPlayers ++
								const member = maybePending[index];
								const userId = nicknameIdMap.find(i => i.nickname === member).userId
								const directMessage = await sendDirectMessage(client, userId, messageContent)
								if (directMessage === 'error') await sendMessageToChannel(client, reminderChannel, messageContent)
							}
						}
					}
					now = DateTime.now()
					console.log(`[${now.toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}] REMINDING -- Guild ${guild} : Reminded ${remindedPlayers} players.`)
				}, DAY_IN_MILLISECONDS * reminderFrequency)
			}
		}
	},
};