const { Events, EmbedBuilder } = require('discord.js');
const { removeMemberFromRSVPList, determineEventStatus } = require('../helpers.js')
const Keyv = require('keyv');
const { DateTime } = require('luxon');
const { updateEvent } = require('../database.js')


module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		const guildId = interaction.guildId
		const keyv = new Keyv(`sqlite:../../mydatabase.sqlite`, { table: guildId })
		keyv.on('error', err => console.log('Connection Error', err));

		if (interaction.isButton()) {
			const guildId = interaction.guildId
			const buttonId = interaction.customId
			const message = interaction.message
			const messageId = message.id
			let events = await keyv.get('events')
			let event = JSON.parse(events).find(event => event.messageId === messageId)
			const member = interaction.member
			const memberId = member.id
			const memberNickname = member.nickname
			const RSVPs = event.RSVPs
			let attending = RSVPs.attending
			let notAttending = RSVPs.notAttending
			let maybe = RSVPs.maybe
			let pending = RSVPs.pending

			let attendanceStatus = buttonId.toUpperCase().replace("-", " ")

			if (buttonId === "attending") {
				const isAttending = attending.includes(memberNickname)
				if (!isAttending) attending.push(memberNickname)
				notAttending = removeMemberFromRSVPList(notAttending, memberNickname)
				maybe = removeMemberFromRSVPList(maybe, memberNickname)
				pending = removeMemberFromRSVPList(pending, memberNickname)
			}	
			else if (buttonId === 'not-attending') {
				const isNotAttending = notAttending.includes(memberNickname)
				if (!isNotAttending) notAttending.push(memberNickname)
				attending = removeMemberFromRSVPList(attending, memberNickname)
				maybe = removeMemberFromRSVPList(maybe, memberNickname)
				pending = removeMemberFromRSVPList(pending, memberNickname)
			}
			else if (buttonId === 'maybe') {
				const isMaybe = maybe.includes(memberNickname)
				if (!isMaybe) maybe.push(memberNickname)
				attending = removeMemberFromRSVPList(attending, memberNickname)
				notAttending = removeMemberFromRSVPList(notAttending, memberNickname)
				pending = removeMemberFromRSVPList(pending, memberNickname)
			}

			const embedSessionInfo = new EmbedBuilder()
				.setColor(0x0099FF)
				.setTitle(event.title)
				.setDescription(event.description)
				.addFields(
					{ name: 'Date', value: `${event.date}`, inline: true},
					{ name: 'Time', value: `${event.time}` , inline: true },
					{ name: 'Time Zone', value: `${event.timezone}` , inline: true },
					{ name: 'Group Size', value: `${event.groupSize}`, inline: true },
					{ name: 'Min. Players', value: `${event.minPlayers}`, inline: true },
					{ name: 'Max. Players', value: `${event.maxPlayers}`, inline: true }
				)

			const attendingValue = attending.length > 0 ? attending.join("\n") : "------------"
			const notAttendingValue = notAttending.length > 0 ? notAttending.join("\n") : "------------"
			const maybeValue = maybe.length > 0 ? maybe.join("\n") : "------------"
			const pendingValue = pending.length > 0 ? pending.join("\n") : "------------"

			const embedSessionAttendance = new EmbedBuilder()
				.setColor(0x0099FF)
				.setTitle(`${event.title} Status`)
				.setDescription('pending')
				.addFields(
					{ name: 'Attending', value: attendingValue, inline: true},
					{ name: 'Not Attending', value: notAttendingValue , inline: true },
					{ name: 'Maybe', value: maybeValue, inline: true },
					{ name: 'Pending', value: pendingValue, inline: true }
				)
				.setFooter({ text: `RSVP by ${(DateTime.fromISO(event.RSVP_DEADLINE)).toLocaleString(DateTime.DATETIME_MED)}` });

			await interaction.update( { embeds: [embedSessionInfo, embedSessionAttendance] } )

			event.RSVPs = {
				attending: attending,
				notAttending: notAttending,
				maybe: maybe,
				pending: pending
			}
			updateEvent(guildId, event, attendanceStatus, memberNickname)
			// await interaction.reply(`<@${memberId}> is : **${attendanceStatus}**`)
		}
		if (!interaction.isChatInputCommand()) return;
		const command = interaction.client.commands.get(interaction.commandName);
		if (!command) return console.error(`No command matching ${interaction.commandName} was found.`);
		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(`Error executing ${interaction.commandName}`);
			console.error(error);
		}
	},
};