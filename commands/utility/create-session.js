// Defaults
// --Only change the numbers to the right of the equal signs.
const RSVP_DEADLINE = 4 // The number of days before the session starts that players must RSVP by, else the session may be automatically canceled if insufficient players
const MINIMUM_PLAYERS = 3
const MAXIMUM_PLAYERS = 6
const GROUP_SIZE = 6
const GAMEMASTER_ROLE_NAME = "Game Master"
const PLAYER_ROLE_NAME = "Player"
const OFFSET_DAYS = 2 // Events are deleted this many days after they occur.
// Begin Code
// --Do not change unless you know what you're doing.
const DAY_IN_MILLISECONDS = 86400000
const TLL_OFFSET = DAY_IN_MILLISECONDS * OFFSET_DAYS
const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const { token } = require('../../config.json');
const { DateTime } = require("luxon");
const { calculateTTL } = require('../../helpers.js')
const { addEvent } = require('../../database.js')
const Keyv = require('keyv');
const keyv = new Keyv(`sqlite:../../mydatabase.sqlite`)
keyv.on('error', err => console.log('Connection Error', err));

module.exports = {
	data: new SlashCommandBuilder()
		.setName('create-session')
		.setDescription('Create an event.')
		.addStringOption(option => 
			option
				.setName('title')
				.setDescription('Session title')
				.setRequired(true)
			)
		.addStringOption(option => 
			option
				.setName('date')
				.setDescription('Session date: MM/DD/YYYY or MM-DD-YYYY')
				.setRequired(true)
			)
		.addStringOption(option => 
			option
				.setName('time')
				.setDescription('Session time: 4pm or 1600')
				.setRequired(true)
			)
		.addStringOption(option => 
			option
				.setName('timezone')
				.setDescription('Session timezone')
				.setRequired(true)
				.addChoices(
					{name: "CST", value: "America/Chicago"},
					{name: "KST", value: "Asia/Seoul"},
				)
			)
		// .addBooleanOption(option => 
		// 	option
		// 		.setName('recurring')
		// 		.setDescription('Is this a recurring event?')
		// 		.setRequired(true)
		// 	)
		.addStringOption(option => 
			option
				.setName('description')
				.setDescription('Add a session description, perhaps a one-sentence recap, plus a session hook.')
				.setRequired(true)
			)
		.addIntegerOption(option => 
			option
				.setName('minimum-players')
				.setDescription('The minimum number of players required to have the session')
				.setMinValue(1)
			)
		.addIntegerOption(option => 
			option
				.setName('maximum-players')
				.setDescription('The maximum number of players allowed to participate in the session')
				.setMinValue(1)
			)
		.addIntegerOption(option => 
			option
				.setName('rsvp-deadline')
				.setDescription('The specified number of days preceding the session by which players must confirm their attendance.')
			)
		,
	async execute(interaction) {
		const guildId = interaction.guildId
		const createdAt = interaction.createdAt
		const timestamp = interaction.createdTimestamp
		const title = interaction.options.getString('title')
		const date = interaction.options.getString('date')
		const time = interaction.options.getString('time')
		const timezone = interaction.options.getString('timezone')
		const userRSVP_DEADLINE = interaction.options.getInteger('rsvp-deadline') ?? RSVP_DEADLINE
		const minPlayers = interaction.options.getInteger('minimum players') ?? MINIMUM_PLAYERS
		const maxPlayers = interaction.options.getInteger('maximum players') ?? MAXIMUM_PLAYERS
		const description = interaction.options.getString('description') ?? null
		// const recurring = interaction.options.getBoolean('recurring')

		client.login(token);
		let guildData = await client.guilds.fetch(guildId)
		const roleGameMasterId = (guildData.roles.cache).find(i => i.name == GAMEMASTER_ROLE_NAME).id
		const rolePlayerId = (guildData.roles.cache).find(i => i.name == PLAYER_ROLE_NAME).id

		const sessionTimeData = calculateTTL(date, time, timezone)
		const datetime = sessionTimeData.sessionDateTime
		const ttl = sessionTimeData.TTL + TLL_OFFSET
		const RSVPDeadline = datetime.minus( {days:RSVP_DEADLINE} )

		const embedSessionInfo = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle(title)
			.setDescription(description)
			.addFields(
				{ name: 'Date', value: `${date}`, inline: true},
				{ name: 'Time', value: `${time}` , inline: true },
				{ name: 'Min. Players', value: `${minPlayers}`, inline: true }
			)
		const embedSessionAttendance = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle(`${title} Attendance`)
			.setDescription('See the attendance status for all players')
			.addFields(
				{ name: 'Session Status', value: "Pending"},
				{ name: 'Attending', value: "------------", inline: true},
				{ name: 'Not Attending', value: "------------" , inline: true },
				{ name: 'Maybe', value: "------------", inline: true },
				{ name: 'Pending', value: "------------", inline: true }
			)
			.setFooter({ text: `RSVP by ${RSVPDeadline.toLocaleString(DateTime.DATETIME_MED)}` });

		const attending = new ButtonBuilder()
			.setCustomId('attending')
			.setLabel('Attending')
			.setStyle(ButtonStyle.Success)
			.setEmoji('✔️')

		const notAttending = new ButtonBuilder()
			.setCustomId('not-attending')
			.setLabel('Not Attending')
			.setStyle(ButtonStyle.Danger)
			.setEmoji('✖️')

		const maybe = new ButtonBuilder()
			.setCustomId('maybe')
			.setLabel('Maybe')
			.setStyle(ButtonStyle.Secondary)
			.setEmoji('❔')

		const buttonsAttendanceStatus = new ActionRowBuilder()
			.addComponents(attending, notAttending, maybe);

		await interaction.reply(
			{
				content: `<@&${rolePlayerId}> <@&${roleGameMasterId}>`,
				embeds: [embedSessionInfo, embedSessionAttendance],
				components: [buttonsAttendanceStatus], // Action Buttons
			}
		);

		const reply = await interaction.fetchReply()
		const messageId = reply.id
		
		const eventObject = {
			title: title,
			datetime: datetime,
			timezone: timezone,
			description: description,
			minPlayers: minPlayers,
			maxPlayers: maxPlayers,
			// recurring: recurring, // Boolean
			RSVP_DEADLINE: userRSVP_DEADLINE,
			messageId: messageId,
			expires: ttl,
			RSVPs: {
				going: [],
				notGoing: [],
				maybe: []
			}
		}

		console.log("🚀 ~ file: create-session.js:100 ~ execute ~ ttl:", ttl)
		await addEvent(guildId, eventObject, ttl)
	},
};