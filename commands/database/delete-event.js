const { SlashCommandBuilder } = require("discord.js");
const Keyv = require("keyv");
const logger = require("../../logger");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("delete-event")
        .setDescription(
            "Deletes a single event by messageId. Get the messageId for the event to delete from /show-events."
        )
        .addStringOption((option) =>
            option
                .setName("message-id")
                .setDescription("The messageId of the event to delete.")
                .setRequired(true)
        ),
    async execute(interaction) {
        const guildId = interaction.guildId;
        const messageId = interaction.options.getString("messageId");
        const keyv = new Keyv(`sqlite:../../mydatabase.sqlite`, {
            table: guildId,
        });
        keyv.on("error", (err) => logger.error(`Connection Error : ${err}`));

        let events = await keyv.get("events");

        const eventToDeleteIndex = events.findIndex(
            (event) => event.messageId === messageId
        );

        events.splice(eventToDeleteIndex, 1);

        await keyv.set("events", JSON.stringify(events));
        await interaction.reply(
            "All events have been deleted from the database."
        );
    },
};
