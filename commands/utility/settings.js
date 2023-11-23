const { SlashCommandBuilder } = require('discord.js');
const Keyv = require('keyv');
const keyv = new Keyv(`sqlite:../../mydatabase.sqlite`)
keyv.on('error', err => console.log('Connection Error', err));

module.exports = {
	data: new SlashCommandBuilder()
		.setName('settings')
		.setDescription("Edit Sesh Time's settings")
		.addRoleOption(option =>
			option
				.setName('gamemaster-role')
				.setDescription('Input the role name of the Gamemaster.')
				.setRequired(true)
			)
		.addRoleOption(option =>
			option
				.setName('player-role')
				.setDescription('Input the role name of the players.')
				.setRequired(true)
			)
		.addIntegerOption(option => 
			option
				.setName('minimum-players')
				.setDescription('The minimum number of players required to have a session.')
				.setMinValue(1)
				.setRequired(true)
			)
		.addIntegerOption(option => 
			option
				.setName('maximum-players')
				.setDescription('The maximum number of players allowed to participate in the session.')
				.setMinValue(1)
				.setRequired(true)
			)
		.addIntegerOption(option => 
			option
				.setName('rsvp-deadline')
				.setDescription('The specified number of days preceding the session by which players must confirm their attendance.')
				.setRequired(true)
			)
		.addIntegerOption(option => 
			option
				.setName('ttl-offset')
				.setDescription('Session data will be deleted this many days after the sessions.')
				.setRequired(true)
			)
		.addIntegerOption(option => 
			option
				.setName('reminder-frequency')
				.setDescription('The frequency in days *pending* and *maybe* players will be reminded to RSVP.')
				.setRequired(true)
			)
		.addStringOption(option => 
			option
				.setName('timezone')
				.setDescription('The timezone to schedule sessions in.')
				.setRequired(true)
				.addChoices(
					{name: "CST", value: "America/Chicago"},
					{name: "KST", value: "Asia/Seoul"},
				)
			)
		,
	async execute(interaction) {
		const gamemasterRole = interaction.options.getRole('gamemaster-role').id
		const playerRole = interaction.options.getRole('player-role').id
		const minPlayers = interaction.options.getInteger('minimum-players')
		const maxPlayers = interaction.options.getInteger('maximum-players')
		const RSVPDeadline = interaction.options.getInteger('rsvp-deadline')
		const ttlOffset = interaction.options.getInteger('ttl-offset')
		const reminderFrequency = interaction.options.getInteger('reminder-frequency')
		const timezone = interaction.options.getString('timezone')

		const settings = {
			gamemasterRoleId: gamemasterRole,
			playerRoleId: playerRole,
			minPlayers: minPlayers,
			maxPlayers: maxPlayers,
			rsvpDeadline: RSVPDeadline,
			ttlOffset: ttlOffset,
			reminderFrequency: reminderFrequency,
			timezone: timezone
		}

		await keyv.set('settings', JSON.stringify(settings))

		await interaction.reply('Settings saved!');
	
        
    },
};