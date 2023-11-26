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
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { token } = require('../config.json');
const Keyv = require('keyv');
const { sleep } = require('../helpers.js')

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
			console.log("🚀 ~ file: ready.js:54 ~ execute ~ reminderFrequency:", reminderFrequency)
			
			console.log(`INTERVALS -- Setting up intervals for Guild ${guild}`)
			// Auto-cancel Events
			console.log(`---- INTERVALS -- Setting up Auto-cancel Events interval...`)
			setInterval( async function() {
				let now = DateTime.now()
				console.log(`[${now.toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}] AUTO-CANCELING -- Guild ${guild} : Auto-canceling events...`)
				for (let index = 0; index < events.length; index++) {
					const event = events[index]
					const datetime = event.datetime
					const rsvpDeadline = event.rsvpDeadline
					let canceledEvents = 0
					if (now >= rsvpDeadline) {
						// Cancel Event
						event.status = 'canceled due to insufficient ATTENDING players'
						await updateEvent(guild, event, attendanceStatus, memberNickname)
						canceledEvents ++
					}
					now = DateTime.now()
					console.log(`[${now.toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}] AUTO-CANCELING -- Guild ${guild} : Canceled ${canceledEvents} events.`)
				}
			}, HOUR_IN_MILLISECONDS) // TODO: Change this to HOUR_IN_MILLISECONDS for deploy
			// Remind Players
			console.log(`---- INTERVALS -- Setting up Remind Players interval...`)
			if (reminderFrequency) {
				setInterval( async function() {
					let now = DateTime.now()
					console.log(`[${now.toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}] REMINDING -- Guild ${guild} : Reminding players...`)
					for (let index = 0; index < events.length; index++) {
						const event = events[index];
						const RSVPs = eventObject.RSVPs
						let attending = RSVPs.attending
						let notAttending = RSVPs.notAttending
						let maybe = RSVPs.maybe
						let pending = RSVPs.pending
						let remindedPlayers = 0
						if (maybe.length > 0 || pending.length > 0)	{
							// Remind Players
							remindedPlayers ++
						}
						let now = DateTime.now()
						console.log(`[${now.toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}] REMINDING -- Guild ${guild} : Reminded ${remindedPlayers} players.`)
					}
				}, DAY_IN_MILLISECONDS * reminderFrequency)
			}
		}
	},
};