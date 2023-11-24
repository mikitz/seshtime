const { Events } = require('discord.js');
const Keyv = require('keyv');


module.exports = {
	name: Events.GuildCreate,
	once: true,
	async execute(guild) {
		const keyv = new Keyv(`sqlite:../../mydatabase.sqlite`, {
			table: guild.id
		})
		keyv.on('error', err => console.log('Connection Error', err));
		await keyv.set('settings', '[]')
		console.log(`Settings table for Guild ID ${guild.id} created successfully!`)
		await keyv.set('events', '[]')
		console.log(`Events table for Guild ID ${guild.id} created successfully!`)
	},
};