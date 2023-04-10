const fs = require('fs');
require('dotenv').config();
const discord = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({
	apiKey: process.env.APIKEY,
});

const ricDir = './richard';
const cynnDir = './cynthia';
const hiyoDir = './hiyori';
const rizDir = './rizzette';

function loadCommands(client, directory, no) {
	fs.readdir(directory, (err, files) => {
		if (err) {
			console.error(`oopsies ${err}`);
			return;
		}

		for (const file of files) {
			const fullPath = `${directory}/${file}`;
			if (!file.endsWith('.js') || fs.statSync(fullPath).isDirectory()) {
				if (fs.statSync(fullPath).isDirectory()) {
					loadCommands(client, fullPath, no);
				}
				continue;
			}

			const commandName = file.slice(0, -3);
			const commandModule = require(fullPath);
			client.commands.set(commandName, commandModule);
		}

		console.log(`client${no} loaded ${client.commands.size} commands`);
	});
}

async function getAiResponse(topic) {
	try {
		const openai = new OpenAIApi(configuration);
		const completion = await openai.createCompletion({
			model: 'text-davinci-003',
			prompt: topic,
			max_tokens: 400,
			n: 1,
			stop: null,
			temperature: 0,
		});
		return completion.data.choices[0].text;
	} catch (error) {
		console.error(error);
	}
}

module.exports = { getAiResponse };

function getIntents() {
	return [
		'GUILDS',
		'GUILD_MESSAGES',
		'GUILD_MEMBERS',
		'GUILD_VOICE_STATES',
		'GUILD_EMOJIS_AND_STICKERS',
		'GUILD_MESSAGE_REACTIONS',
		'DIRECT_MESSAGES',
		'DIRECT_MESSAGE_REACTIONS',
	];
}

function crogin(token) {
	const client = new discord.Client({ intents: getIntents() });
	client.on('ready', () => {
		console.log(`${client.user.tag} has awoken`);
	});
	client.login(token);
	return client;
}

const client = crogin(process.env.TOKEN);
const client2 = crogin(process.env.TOKEN2);
const client3 = crogin(process.env.TOKEN3);
const client4 = crogin(process.env.TOKEN4);

loadCommands(client, ricDir, 1);
loadCommands(client2, cynnDir, 2);
loadCommands(client3, hiyoDir, 3);
loadCommands(client4, rizDir, 4);

client.commands = new discord.Collection();
client2.commands = new discord.Collection();
client3.commands = new discord.Collection();
client4.commands = new discord.Collection();

function handleMessage(client) {
	client.on('messageCreate', async (m) => {
		if (m.author.bot) return;
		const args = m.content.trim().split(/ +/);
		const command = client.commands.find((cmd) => {
			const prefixes = [cmd.runCommand, ...(cmd.aliases || [])];
			return prefixes.some((prefix) => m.content.startsWith(prefix));
		});
		if (!command) return;

		try {
			command.run(m, args);
		} catch (error) {
			console.error(error);
			m.reply(`oops`);
		}
	});
}

async function loadEvents(client, folder) {
	const events = await Promise.allSettled(
		fs
			.readdirSync(`./events/${folder}`)
			.map((file) => import(`./events/${folder}/${file}`))
	);

	for (const event of events) {
		if (event.status === 'fulfilled') {
			const { name, once, execute, codeName } = event.value.default;
			if (once) {
				client.once(name, (...args) => execute(...args));
			} else {
				client.on(name, (...args) => execute(...args));
			}
			console.log(`${codeName} done`);
		} else {
			console.error(`oopsies ${event.reason}`);
		}
	}
}

loadEvents(client, 'richard');
loadEvents(client2, 'cynthia');
loadEvents(client3, 'hiyori');
loadEvents(client4, 'rizzette');

handleMessage(client);
handleMessage(client2);
handleMessage(client3);
handleMessage(client4);
