const { SlashCommandBuilder } = require("discord.js");
const Keyv = require("keyv");
const logger = require("../../logger");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("delete-all-events")
        .setDescription("Deletes all the events in the database."),
    async execute(interaction) {
        const guildId = interaction.guildId;
        const keyv = new Keyv(`sqlite:../../mydatabase.sqlite`, {
            table: guildId,
        });
        keyv.on("error", (err) => logger.error(`Connection Error : ${err}`));

        let events = await keyv.get("events");
        events = [];
        await keyv.set("events", JSON.stringify(events));
        await interaction.reply(
            "All events have been deleted from the database."
        );
    },
};
