const { SlashCommandBuilder } = require('discord.js');
const Keyv = require('keyv');
const keyv = new Keyv(`sqlite:../../mydatabase.sqlite`)
keyv.on('error', err => console.log('Connection Error', err));

module.exports = {
	data: new SlashCommandBuilder()
		.setName('show-events')
		.setDescription('Replies with all the events in the database as JSON.'),
	async execute(interaction) {
        const guildId = interaction.guildId
        let guildEvents = await keyv.get(guildId)
        guildEvents = JSON.parse(guildEvents)
        let events = []
        for (let index = 0; index < guildEvents.length; index++) {
            const messageId = guildEvents[index];
            const eventData = await keyv.get(`${guildId}-${messageId}`)
            events.push(eventData)
        }
        if (events.length > 0) await interaction.reply(events.join("\n"))
        else await interaction.reply("There are no events in the database.")
    },
};