const { Events } = require('discord.js');
const Keyv = require('keyv');


module.exports = {
	name: Events.GuildCreate,
	once: true,
	async execute(guild) {
		const guildId = guild.id

		// Add this Guild to the list of Guilds
		const keyv = new Keyv(`sqlite:../../mydatabase.sqlite`, { table: 'keyv' })
		keyv.on('error', err => console.log('Connection Error', err));
		let guilds = await keyv.get('guilds')
		if (guilds === undefined) guilds = []
		else guilds = JSON.parse(guilds)
		guilds.push(guildId)
		await keyv.set('guilds', JSON.stringify(guilds))

		// Create new Table for this Guild
		const dbGuild = new Keyv(`sqlite:../../mydatabase.sqlite`, { table: guildId })
		dbGuild.on('error', err => console.log('Connection Error', err));
		await dbGuild.set('settings', '[]')
		console.log(`Settings table for Guild ID ${guildId} created successfully!`)
		await dbGuild.set('events', '[]')
		console.log(`Events table for Guild ID ${guildId} created successfully!`)
	},
};