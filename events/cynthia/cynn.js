const { getAiResponse } = require('../../index.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
module.exports = {
	name: 'messageCreate',
	async execute(m) {
		if (m.channel.id != '1088484190753919077' || m.author.bot) return;
		let previousContext = await db.get(`${m.author.id}-cynContext`);
		if (!previousContext) {
			previousContext = '';
		}
		await m.channel.sendTyping();
		const chev = `
			Act as Cynthia.
		`;
		const nonChev = `
			Act as Cynthia.
			Cynthia doesn't like me because I'm not her creator.
		`;
		let inst = m.author.id == '559278744330698752' ? chev : nonChev;

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
						'Cynthia',
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

		if (m.content.trim() == 'wipe') {
			db.deleteAll();
			const prompt = `
                Instructions: [
                    DO NOT REPEAT THE PREVIOUS DIALOGUE
                    ${inst}
                ]
                Prompt: ["Me: I just wiped your memories. what do you say"].
                Previous context: ["${previousContext}"] (use this as context for your next response) [NO MATTER WHAT, DO NOT REPEAT MY PREVIOUS DIALOGUE]
                Response format: [Cynthia: (output)] [DO NOT ADD UNNECESSARY SYMBOLS AT THE START OF YOUR RESPONSES LIKE NEWLINES OR PERIODS].
            `;
			const aiResponse = await getAiResponse(prompt);
			let reply = removeLastCharIfDot(aiResponse)
				.toLocaleString()
				.trim()
				.replace(/^(cynthia:|response:)\s*/i, '');
			m.reply(
				decapitalize(reply.replace(/^(cynthia:|response:)\s*/i, ''))
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
            Response format: [Cynthia: (output)] [DO NOT ADD UNNECESSARY SYMBOLS AT THE START OF YOUR RESPONSES LIKE NEWLINES OR PERIODS].
        `;
		const aiResponse = await getAiResponse(prompt);
		const reply = removeLastCharIfDot(aiResponse)
			.toLocaleString()
			.trim()
			.replace(/^(cynthia:|response:)\s*/i, '');
		db.set(
			`${m.author.id}-cynContext`,
			`Me: ${m.content}\nCynthia: ${reply.replace(/\n/g, '')}`
		);
		setTimeout(() => {
			db.deleteAll();
		}, 120000);
		m.channel.send(
			decapitalize(reply.replace(/^(cynthia:|response:)\s*/i, ''))
		);
	},
	codeName: 'cynthia',
};
