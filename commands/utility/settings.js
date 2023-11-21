const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('settings')
		.setDescription("Edit Sesh Time's settings"),
	async execute(interaction) {

		await interaction.reply('Pong!');
	
        
    },
};