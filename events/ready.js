const MINUTE_IN_MILLISECONDS = 60000
const HOUR_IN_MILLISECONDS = 3600000
const DAY_IN_MILLISECONDS = 86400000
const { DateTime } = require("luxon");
const { Events } = require('discord.js');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');
const Keyv = require('keyv');
const { sleep } = require('../helpers.js')

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);

		// Ensure that the intervals are set at the top of the hour
		const now = new Date()
		const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0)
		const delay = nextHour - now
		await sleep(delay)

		// Intervals
		const keyv = new Keyv(`sqlite:../../mydatabase.sqlite`, { table: 'keyv' })
		keyv.on('error', err => console.log('Connection Error', err))
		let guilds = await keyv.get('guilds')
		if (guilds === undefined) guilds = []
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
			
			// Auto-cancel Events
			// TODO: These depend on the start-up time. IE if I start at 1620, then the next interval will run at 1720
			setInterval( async function() {
				for (let index = 0; index < events.length; index++) {
					const event = events[index];
					const rsvpDeadline = event.rsvpDeadline
					const now = DateTime.now()
					if (now >= rsvpDeadline) {
						// Cancel Event

					}
				}
			}, MINUTE_IN_MILLISECONDS) // TODO: Change this to HOUR_IN_MILLISECONDS for deploy
			// Remind Players
			setInterval( async function() {
				for (let index = 0; index < events.length; index++) {
					const event = events[index];
					const RSVPs = eventObject.RSVPs
					let attending = RSVPs.attending
					let notAttending = RSVPs.notAttending
					let maybe = RSVPs.maybe
					let pending = RSVPs.pending
					if (maybe.length > 0 || pending.length > 0)	{
						// Remind Players

					}
				}
			}, DAY_IN_MILLISECONDS * reminderFrequency)
		}
	},
};