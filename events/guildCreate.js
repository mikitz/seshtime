const { Events, PermissionsBitField, ChannelType, Client, GatewayIntentBits  } = require('discord.js');
const client = new Client({ intents: [
	GatewayIntentBits.Guilds, 
	GatewayIntentBits.GuildMembers, 
	GatewayIntentBits.GuildMessages, 
	GatewayIntentBits.GuildPresences] });
const { token } = require('../config.json');
const Keyv = require('keyv');
const logger = require('../logger.js')

module.exports = {
	name: Events.GuildCreate,
	once: true,
	async execute(guild) {
		const guildId = guild.id
		client.login(token)	

		// Add this Guild to the list of Guilds
		logger.info(`JOINED -- Guild ${guild.name}-${guildId} : Adding to guilds...`)
		const keyv = new Keyv(`sqlite:../../mydatabase.sqlite`, { table: 'keyv' })
		keyv.on('error', err => logger.error(`Connection Error : ${err}`));
		let guilds = await keyv.get('guilds')
		if (guilds === undefined) guilds = []
		else guilds = JSON.parse(guilds)
		if (guilds.includes(guildId)) return
		guilds.push(guildId)
		await keyv.set('guilds', JSON.stringify(guilds))
		logger.info(`JOINED -- Guild ${guild.name}-${guildId} : Added to guilds successfully!`)
		
		// Create new Table for this Guild
		logger.info(`JOINED -- Guild ${guild.name}-${guildId} : Creating ${guildId} table...`)
		const dbGuild = new Keyv(`sqlite:../../mydatabase.sqlite`, { table: guildId })
		dbGuild.on('error', err => logger.error(`Connection Error : ${err}`));
		await dbGuild.set('settings', '[]')
		logger.info(`----- JOINED -- Guild ${guild.name}-${guildId} : Settings key created successfully!`)
		await dbGuild.set('events', '[]')
		logger.info(`----- JOINED -- Guild ${guild.name}-${guildId} : Events key created successfully!`)

		// Send a welcome message
		logger.info(`JOINED -- Guild ${guild.name}-${guildId} : Sending welcome message...`)
		let defaultChannel = ""
		guild.channels.cache.forEach((channel) => {
			if(channel.type == ChannelType.GuildText && defaultChannel == "") {
				if(channel.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.SendMessages)) {
					defaultChannel = channel;
				}
			}
		})
		if(defaultChannel != "") {
			defaultChannel.send("Welcome to Sesh Time! Your first order of business is to set up your settings, so type `/settings` to do so! Get on it!");
			logger.info(`----- JOINED -- Guild ${guild.name}-${guildId} : Welcome message sent successfully!`)
		}
	},
};