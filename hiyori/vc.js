require('dotenv').config();
const { QuickDB } = require('quick.db'); //dammit I can't move this down
const db = new QuickDB();
const fs = require('fs');
const fetch = require('node-fetch');
const { getAiResponse } = require('../index.js');
const Transcriber = require('discord-speech-to-text');
const transcriber = new Transcriber(process.env.WITKEY);
const {
	joinVoiceChannel,
	createAudioPlayer,
	createAudioResource,
} = require('@discordjs/voice');

module.exports = {
	runCommand: '.jn',
	aliases: ['.connect'],
	async run(m, args) {
		args = '';
		const prefixes = [this.runCommand, ...(this.aliases || [])];
		prefixes.forEach((prefix) => {
			if (m.content.startsWith(prefix)) {
				args = m.content.slice(prefix.length);
			}
		});

		if (args.trim() == 'wipe') {
			db.deleteAll();
			m.reply('memory wiped');
			return;
		}

		const voiceChannel = m.member.voice.channel;
		if (!voiceChannel) {
			await m.reply('no');
			return;
		}
		const connection = joinVoiceChannel({
			channelId: m.member.voice.channel.id,
			guildId: m.guild.id,
			adapterCreator: m.guild.voiceAdapterCreator,
			selfDeaf: false,
		});

		const player = createAudioPlayer();
		connection.subscribe(player);
		const receiver = connection.receiver;
		const userId = m.member.id;
		let txt = '';

		m.react('👍');

		receiver.speaking.on('start', async () => {
			transcriber.listen(receiver, userId).then(async (data) => {
				let prevScr = await db.get(`prevScr`);
				if (!prevScr) {
					prevScr = '';
				}
				if (data && data.transcript && data.transcript.text) {
					txt = data.transcript.text;
					if (txt == prevScr && prevScr) {
						return;
					} else {
						db.set('prevScr', data.transcript.text);
					}
				}

				if (txt == prevScr || txt == '' || prevScr.includes(txt)) {
					return;
				} else {
					console.log(txt);
					m.channel.send(`あなた：${txt}`);
					await m.channel.sendTyping();

					let previousContext = await db.get(
						`${m.author.id}-hiContext`
					);
					if (!previousContext) {
						previousContext = '';
					}

					let inst = `
						Act as Hiyori.
					`;

					const prompt = `
						Instructions: [
							${inst}
						]
						Prompt: ["${txt}"].
						Previous context: ["${previousContext}"] (use this as context for your next response) [NO MATTER WHAT, DO NOT REPEAT MY PREVIOUS DIALOGUE]
						Response format: [Hiyori: (output)] [DO NOT ADD UNNECESSARY SYMBOLS AT THE START OF YOUR RESPONSES LIKE NEWLINES OR PERIODS].
					`;

					let aiResponse = await getAiResponse(prompt);
					db.set(
						`${m.author.id}-hiContext`,
						`Me: ${txt}${aiResponse}`
					);

					aiResponse = aiResponse
						.trim()
						.replace('Hiyori:', '')
						.replace(/^Response:\s*/i, '')
						.replace(/^Hiyori:\s*/i, '');
					console.log(aiResponse.trim());

					console.log(`current context {\n${previousContext}\n}`);

					const url = 'https://api.su-shiki.com/v2/voicevox/audio/';
					const apiKey = process.env.VOXKEY;
					const speakerId = 8;
					const pitch = 0;
					const intonationScale = 1;
					const speed = 1;
					const params = new URLSearchParams({
						key: apiKey,
						text: aiResponse,
						speaker: speakerId,
						pitch: pitch,
						intonationScale: intonationScale,
						speed: speed,
					});
					const apiUrl = `${url}?${params}`;

					fetch(apiUrl)
						.then((response) => response.buffer())
						.then((buffer) => {
							fs.writeFile('audio.wav', buffer, (err) => {
								if (err) throw err;
								console.log('Audio saved!');

								const resource =
									createAudioResource('audio.wav');
								try {
									player.play(resource);
									console.log('playing');
								} catch (e) {
									console.log(e);
								}
							});
						})
						.catch((error) => console.error(error));

					m.channel.send(`日和：${aiResponse}`);
				}
			});
		});
	},
};
