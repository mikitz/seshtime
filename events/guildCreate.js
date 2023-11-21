const { Events } = require('discord.js');
const Keyv = require('keyv');
const keyv = new Keyv(`sqlite:../../mydatabase.sqlite`)
keyv.on('error', err => console.log('Connection Error', err));

module.exports = {
	name: Events.GuildCreate,
	once: true,
	async execute(guild) {
		await keyv.set(guild.id, '[]') // Create a new array to store this guild's events by Message ID 
	},
};