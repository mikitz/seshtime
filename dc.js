const { REST, Routes } = require("discord.js");
const { clientId, token } = require("./config.json");
const fs = require("node:fs");
const path = require("node:path");
const logger = require("./logger");

const commands = [];
// Grab all the command folders from the commands directory you created earlier
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    // Grab all the command files from the commands directory you created earlier
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((file) => file.endsWith(".js"));
    // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ("data" in command && "execute" in command) {
            commands.push(command.data.toJSON());
        } else {
            logger.warn(
                `The command at ${filePath} is missing a required "data" or "execute" property.`
            );
            console.warn(
                `The command at ${filePath} is missing a required "data" or "execute" property.`
            );
        }
    }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// and deploy your commands!
(async () => {
    try {
        const commandNames = commands.map((command) => command.name);

        logger.log(
            `Started refreshing ${
                commands.length
            } application (/) commands: ${commandNames.join(", ")}.`
        );
        console.log(
            `Started refreshing ${
                commands.length
            } application (/) commands: ${commandNames.join(", ")}.`
        );
        // The put method is used to fully refresh all commands with the current set
        const data = await rest.put(Routes.applicationCommands(clientId), {
            body: commands,
        });
        logger.log(
            `Successfully reloaded ${
                data.length
            } application (/) commands: ${commandNames.join(", ")}.`
        );
        console.log(
            `Successfully reloaded ${
                data.length
            } application (/) commands: ${commandNames.join(", ")}.`
        );
    } catch (error) {
        logger.error(`Error loading application (/) commands : ${error}`);
        console.error(`Error loading application (/) commands : ${error}`);
    }
})();
