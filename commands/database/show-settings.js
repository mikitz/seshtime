const { SlashCommandBuilder } = require('discord.js');
const Keyv = require('keyv');
const logger = require('../../logger')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('show-settings')
		.setDescription('Replies with all the settings for Sesh Time.'),
	async execute(interaction) {
        const guildId = interaction.guildId
		const keyv = new Keyv(`sqlite:../../mydatabase.sqlite`, {
			table: guildId
		})
		keyv.on('error', err => logger.error(`Connection Error : ${err}`));
        let settings = await keyv.get('settings')
        if (settings === undefined) return await interaction.reply("No settings have been saved! Use `/settings` to set them.")
        settings = JSON.parse(settings)
        let kvList = []
        for (const [key, value] of Object.entries(settings)) {
            kvList.push(`${key}: ${value}`)
        }
        await interaction.reply(kvList.join("\n"))                
    },
};