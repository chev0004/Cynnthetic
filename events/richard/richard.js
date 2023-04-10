const { getAiResponse } = require('../../index.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
module.exports = {
	name: 'messageCreate',
	async execute(m) {
		if (m.channel.id != '1088218130289012766' || m.author.bot) return;
		let previousContext = await db.get(`${m.author.id}-riContext`);
		if (!previousContext) {
			previousContext = '';
		}
		await m.channel.sendTyping();
		let inst = `
			Act as Richard. 
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
						'Richard',
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
					Prompt: ["Me: I just wiped your memories. what do you say"].
					Previous context: ["${previousContext}"] (use this as context for your next response) [NO MATTER WHAT, DO NOT REPEAT MY PREVIOUS DIALOGUE]
					Response format: [Richard: (output)] [DO NOT ADD UNNECESSARY SYMBOLS AT THE START OF YOUR RESPONSES LIKE NEWLINES OR PERIODS].
    			`;
			const aiResponse = await getAiResponse(prompt);
			let reply = removeLastCharIfDot(aiResponse)
				.toLocaleString()
				.trim()
				.replace(/^(richard:|response:)\s*/i, '');
			m.reply(
				decapitalize(reply.replace(/^(richard:|response:)\s*/i, ''))
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
			Response format: [Richard: (output)] [DO NOT ADD UNNECESSARY SYMBOLS AT THE START OF YOUR RESPONSES LIKE NEWLINES OR PERIODS].
		`;
		const aiResponse = await getAiResponse(prompt);
		const reply = removeLastCharIfDot(aiResponse)
			.toLocaleString()
			.trim()
			.replace(/^(richard:|response:)\s*/i, '');
		db.set(
			`${m.author.id}-riContext`,
			`Me: ${m.content}\nRichard: ${reply.replace(/\n/g, '')}`
		);
		setTimeout(() => {
			db.deleteAll();
		}, 120000);
		m.channel.send(
			decapitalize(reply.replace(/^(richard:|response:)\s*/i, ''))
		);
	},
	codeName: 'richard',
};
