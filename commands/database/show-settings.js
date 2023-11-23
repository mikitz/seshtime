const { SlashCommandBuilder } = require('discord.js');
const Keyv = require('keyv');
const keyv = new Keyv(`sqlite:../../mydatabase.sqlite`)
keyv.on('error', err => console.log('Connection Error', err));

module.exports = {
	data: new SlashCommandBuilder()
		.setName('show-settings')
		.setDescription('Replies with all the settings for Sesh Time.'),
	async execute(interaction) {
        let settings = await keyv.get('settings')
        settings = JSON.parse(settings)
        let kvList = []
        for (const [key, value] of Object.entries(settings)) {
            kvList.push(`${key}: ${value}`)
        }
        await interaction.reply(kvList.join("\n"))                
    },
};