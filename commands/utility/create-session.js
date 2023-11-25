const GROUP_SIZE = 6
const DAY_IN_MILLISECONDS = 86400000
const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildPresences] });
const { token } = require('../../config.json');
const { DateTime } = require("luxon");
const { calculateTTL, getMembersByRole } = require('../../helpers.js')
const { addEvent, deleteExpiredEvents } = require('../../database.js')
const Keyv = require('keyv');

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
				.setName('description')
				.setDescription('Add a session description, perhaps a one-sentence recap, plus a session hook.')
				.setRequired(true)
			)
		// .addBooleanOption(option => 
			// 	option
			// 		.setName('recurring')
			// 		.setDescription('Is this a recurring event?')
			// 		.setRequired(true)
			// 	)
		,
	async execute(interaction) {
		const guildId = interaction.guildId
		const keyv = new Keyv(`sqlite:../../mydatabase.sqlite`, {
			table: guildId
		})
		keyv.on('error', err => console.log('Connection Error', err));

		const createdAt = interaction.createdAt
		const timestamp = interaction.createdTimestamp
		const title = interaction.options.getString('title')
		const date = interaction.options.getString('date')
		const time = interaction.options.getString('time')
		const description = interaction.options.getString('description') ?? null
		// const recurring = interaction.options.getBoolean('recurring')
		
		let settings = await keyv.get('settings')
		settings = JSON.parse(settings)
		const timezone = settings.timezone
		const rsvpDeadlineDays = settings.rsvpDeadline
		const minPlayers = settings.minPlayers
		const maxPlayers = settings.maxPlayers
		const rolePlayerId = settings.playerRoleId
		const roleGameMasterId = settings.gamemasterRoleId
		
		const author = interaction.user
		
		client.login(token)
		let members = await getMembersByRole(guildId, rolePlayerId, client, author.id)
		let players = members.members
		const gameMaster = members.gameMaster
		const groupSize = players.length

		const sessionTimeData = calculateTTL(date, time, timezone)
		const datetime = sessionTimeData.sessionDateTime
		const rsvpDeadlineDate = datetime.minus( {days:rsvpDeadlineDays} )

		const embedSessionInfo = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle(title)
			.setDescription(description)
			.addFields(
				{ name: 'Date', value: `${date}`, inline: true},
				{ name: 'Time', value: `${time}` , inline: true },
				{ name: 'Time Zone', value: `${timezone}` , inline: true },
				{ name: 'Group Size', value: `${groupSize}`, inline: true },
				{ name: 'Min. Players', value: `${minPlayers}`, inline: true },
				{ name: 'Max. Players', value: `${maxPlayers}`, inline: true }
			)
		const embedSessionAttendance = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle(`${title} Status`)
			.setDescription('pending')
			.addFields(
				{ name: 'Game Master', value: gameMaster, inline: true },
				{ name: 'Pending', value: players.join("\n"), inline: true },
				{ name: '\n', value: '\n' },
				{ name: 'Attending', value: "----------", inline: true},
				{ name: 'Not Attending', value: "----------" , inline: true },
				{ name: 'Maybe', value: "----------", inline: true }
			)
			.setFooter({ text: `RSVP by ${rsvpDeadlineDate.toLocaleString(DateTime.DATETIME_MED)}` });
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
				content: `**${title.toUpperCase()}** \n <@&${rolePlayerId}> <@&${roleGameMasterId}>`,
				embeds: [embedSessionInfo, embedSessionAttendance],
				components: [buttonsAttendanceStatus], // Action Buttons
			}
		);

		const reply = await interaction.fetchReply()
		const messageId = reply.id
		
		const eventObject = {
			title: title,
			date: date,
			time: time,
			datetime: datetime,
			timezone: timezone,
			description: description,
			minPlayers: minPlayers,
			maxPlayers: maxPlayers,
			groupSize: groupSize,
			// recurring: recurring, // Boolean
			rsvpDeadline: rsvpDeadlineDate,
			messageId: messageId,
			status: 'pending',
			author: author.id,
			gameMaster: gameMaster,
			RSVPs: {
				attending: [],
				notAttending: [],
				maybe: [],
				pending: players
			}
		}
		await deleteExpiredEvents(guildId)
		await addEvent(guildId, eventObject)
	},
};