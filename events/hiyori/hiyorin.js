const { getAiResponse } = require('../../index.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
module.exports = {
	name: 'messageCreate',
	async execute(m) {
		if (m.channel.id != '1088562305924595722' || m.author.bot) return;
		let previousContext = await db.get(`${m.author.id}-hiyoContext`);
		if (!previousContext) {
			previousContext = '';
		}
		await m.channel.sendTyping();
		let inst = `
			gatekeep'd
		`;
		function decapitalize(str) {
			if (str.startsWith('"') && str.endsWith('"')) {
				str = str.slice(1, -1);
			}
			const decapitalizedWords = str.split(' ').map((word) => {
				if (
					[
						"I'll",
						"I'd",
						"I'm",
						"I've",
						'I',
						'AI',
						'Hiyori',
					].includes(word)
				) {
					return word;
				} else {
					return word.toLowerCase();
				}
			});
			return decapitalizedWords.join(' ');
		}

		function removeLastCharIfDot(str) {
			if (str.endsWith('.')) {
				return str.slice(0, -1);
			}
			return str;
		}

		if (m.content.toLowerCase().trim() == 'wipe') {
			db.deleteAll();
			const prompt = `
				Instructions: [
					DO NOT REPEAT THE PREVIOUS DIALOGUE
					${inst}
				]
				Prompt: ["Me: たった今君の記憶全部消した"].
				Previous context: ["${previousContext}"] (use this as context for your next response) [NO MATTER WHAT, DO NOT REPEAT MY PREVIOUS DIALOGUE]
				Response format: [Hiyori: (output)] [DO NOT ADD UNNECESSARY SYMBOLS AT THE START OF YOUR RESPONSES LIKE NEWLINES OR PERIODS].
			`;
			const aiResponse = await getAiResponse(prompt);
			let reply = removeLastCharIfDot(aiResponse)
				.toLocaleString()
				.trim()
				.replace(/^(hiyori:|response:)\s*/i, '');
			m.reply(
				decapitalize(reply.replace(/^(hiyori:|response:)\s*/i, ''))
			);
			return;
		}

		const prompt = `
			Instructions: [
				DO NOT REPEAT THE PREVIOUS DIALOGUE
				${inst}
			]
			Prompt: ["Me: ${m.content}"].
			Previous context: ["${previousContext}"] (use this as context for your next response) [NO MATTER WHAT, DO NOT REPEAT MY PREVIOUS DIALOGUE]
			Response format: [Hiyori: (output)] [DO NOT ADD UNNECESSARY SYMBOLS AT THE START OF YOUR RESPONSES LIKE NEWLINES OR PERIODS].
		`;
		const aiResponse = await getAiResponse(prompt);
		const reply = removeLastCharIfDot(aiResponse)
			.toLocaleString()
			.trim()
			.replace(/^(hiyori:|response:)\s*/i, '');
		db.set(
			`${m.author.id}-hiyoContext`,
			`Me: ${m.content}\nHiyori: ${reply.replace(/\n/g, '')}`
		);
		setTimeout(() => {
			db.deleteAll();
		}, 120000);

		console.log(`current context {\n${previousContext}\n}`);
		m.channel.send(
			decapitalize(reply.replace(/^(hiyori:|response:)\s*/i, ''))
		);
	},
	codeName: 'hiyorin',
};
