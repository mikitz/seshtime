const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('create-session')
		.setDescription('Create an event.'),
	async execute(interaction) {
		await interaction.reply('Event Created!');
	},
};