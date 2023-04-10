const fs = require('fs');
require('dotenv').config();
const fetch = require('node-fetch');
const {
	joinVoiceChannel,
	createAudioPlayer,
	createAudioResource,
} = require('@discordjs/voice');

module.exports = {
	runCommand: '.speak ',
	aliases: [],
	async run(m, args) {
		try {
			await m.channel.sendTyping();
			const prefix = this.runCommand;
			args = m.content.slice(prefix.length);
			const voiceChannel = m.member.voice.channel;
			if (!voiceChannel) {
				return m.reply('no');
			}

			const connection = joinVoiceChannel({
				channelId: m.member.voice.channel.id,
				guildId: m.guild.id,
				adapterCreator: m.guild.voiceAdapterCreator,
				selfDeaf: false,
			});

			const player = createAudioPlayer();
			connection.subscribe(player);

			const url = 'https://api.su-shiki.com/v2/voicevox/audio/';
			const apiKey = process.env.VOXKEY;
			const speakerId = 8;
			const pitch = 0;
			const intonationScale = 1;
			const speed = 1;

			const params = new URLSearchParams({
				key: apiKey,
				text: args,
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
						const resource = createAudioResource('audio.wav');
						player.play(resource);
					});
				})
				.catch((error) => console.error(error));
		} catch (err) {
			console.log(err);
		}
	},
};
