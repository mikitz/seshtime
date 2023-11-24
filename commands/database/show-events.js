const { SlashCommandBuilder } = require('discord.js');
const Keyv = require('keyv');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('show-events')
		.setDescription('Replies with all the events in the database as JSON.'),
	async execute(interaction) {
        const guildId = interaction.guildId
		const keyv = new Keyv(`sqlite:../../mydatabase.sqlite`, { table: guildId })
		keyv.on('error', err => console.log('Connection Error', err));

        let events = await keyv.get('events')
        if (events === undefined) return await interaction.reply("There are no events in the database.")
        events = JSON.parse(events)
        const eventsFinal = []
        for (let index = 0; index < events.length; index++) {
            const element = events[index]
            eventsFinal.push(JSON.stringify(element))
        }
        if (events.length > 0) await interaction.reply(eventsFinal.join("\n\n"))
    },
};