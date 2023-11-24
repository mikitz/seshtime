const { SlashCommandBuilder } = require('discord.js');
const Keyv = require('keyv');

const DEFAULT_MINIMUM_PLAYERS = 3
const DEFAULT_MAXIMUM_PLAYERS = 6
const DEFAULT_RSVP_DEADLINE = 3 // Days prior to event start
const DEFAULT_REMINDER_FREQUENCY = 2 // Days

module.exports = {
	data: new SlashCommandBuilder()
		.setName('settings')
		.setDescription("Edit Sesh Time's settings")
		.addStringOption(option => 
			option
				.setName('timezone')
				.setDescription('The timezone to schedule sessions in.')
				.addChoices(
					{name: "WST", value: "America/Los_Angeles"},
					{name: "MST", value: "America/Denver"},
					{name: "CST", value: "America/Chicago"},
					{name: "EST", value: "America/New_York"},
					{name: "China", value: "Asia/Beijing"},
					{name: "Korea", value: "Asia/Seoul"},
					{name: "Japan", value: "Asia/Tokyo"},
				)
				.setRequired(true)
			)
		.addRoleOption(option =>
			option
				.setName('gamemaster-role')
				.setDescription('Input the role name of the Gamemaster. Default: "Game Master"')
				.setRequired(true)
			)
		.addRoleOption(option =>
			option
				.setName('player-role')
				.setDescription('Input the role name of the players. Default: "Player"')
				.setRequired(true)
			)
		.addIntegerOption(option => 
			option
				.setName('minimum-players')
				.setDescription('The minimum number of players required to have a session. Default: 3')
				.setMinValue(1)
			)
		.addIntegerOption(option => 
			option
				.setName('maximum-players')
				.setDescription('The maximum number of players allowed to participate in the session. Default: 6')
				.setMinValue(1)
			)
		.addIntegerOption(option => 
			option
				.setName('rsvp-deadline')
				.setDescription('The number of days preceding the session by which players must confirm their attendance. Default: 3')
			)
		.addIntegerOption(option => 
			option
				.setName('reminder-frequency')
				.setDescription('The frequency in days *pending* and *maybe* players will be reminded to RSVP. Default: 2')
			)
		,
	async execute(interaction) {
		const guildId = interaction.guildId
		const keyv = new Keyv(`sqlite:../../mydatabase.sqlite`, { table: guildId })
		keyv.on('error', err => console.log('Connection Error', err));

		let gamemasterRole = (interaction.options.getRole('gamemaster-role')).id
		let playerRole = (interaction.options.getRole('player-role')).id
		let minPlayers = interaction.options.getInteger('minimum-players') ?? DEFAULT_MINIMUM_PLAYERS
		let maxPlayers = interaction.options.getInteger('maximum-players') ?? DEFAULT_MAXIMUM_PLAYERS
		let RSVPDeadline = interaction.options.getInteger('rsvp-deadline') ?? DEFAULT_RSVP_DEADLINE
		let reminderFrequency = interaction.options.getInteger('reminder-frequency') ?? DEFAULT_REMINDER_FREQUENCY
		const timezone = interaction.options.getString('timezone')
		
		let settingsData = await keyv.get('settings')
		settingsData = JSON.parse(settingsData)
		if (settingsData.minPlayers) minPlayers = settingsData.minPlayers
		if (settingsData.maxPlayers) maxPlayers = settingsData.maxPlayers
		if (settingsData.rsvpDeadline) RSVPDeadline = settingsData.rsvpDeadline
		if (settingsData.reminderFrequency) reminderFrequency = settingsData.reminderFrequency

		const settings = {
			gamemasterRoleId: gamemasterRole,
			playerRoleId: playerRole,
			minPlayers: minPlayers,
			maxPlayers: maxPlayers,
			rsvpDeadline: RSVPDeadline,
			reminderFrequency: reminderFrequency,
			timezone: timezone
		}
		await keyv.set('settings', JSON.stringify(settings))
		await interaction.reply('Settings saved!');
    },
};