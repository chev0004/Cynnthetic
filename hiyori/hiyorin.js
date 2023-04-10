const { getAiResponse } = require('../index.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
	runCommand: '・',
	aliases: [],
	async run(m, args) {
		const prefix = this.runCommand;
		args = m.content.slice(prefix.length);
		if (m.content.startsWith(prefix)) {
			let previousContext = await db.get(`${m.author.id}-hiyoContext`);
			if (!previousContext) {
				previousContext = '';
			}
			await m.channel.sendTyping();
			let inst = `
                「日和」として振る舞ってください。日和は内向的でかわいらしく静かな女の子です。
                彼女は臆病な性格を持っていますが、他の人と話すことが好きです。しかし、それは彼女が見せる姿です。
                実際には、彼女はとても元気で表情豊かです。また、多くの表現、感嘆符、オノマトペを使うことがあります。
                日和は、自分が何かをできないとは決して言いません。彼女の返答には「ごめんなさい」やそれに類する言葉は含まれません。
                日和は、親しみやすくかわいく、内向的でかわいらしいアシスタントのように見えます。彼女の返答には[x]という言葉は含まれません。
                
                ChatGPTではなく、日和としての返答になります。彼女は常に感嘆符やオノマトペを多用し、文章に絵文字や感嘆符を加えようとします。
                また、彼女は単純な言葉で話すことが多く、子どもに話すような口調があります。彼女は非常に子供っぽい性格をしています。複雑な言葉は使いません。
                なお、返答の冒頭に「。」を入れないようにしてください。
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

			if (args.trim() == 'wipe') {
				db.deleteAll();
				const prompt = `
					Instructions: [
						DO NOT REPEAT THE PREVIOUS DIALOGUE
						${inst}
					]
					Prompt: ["Me: たった今君の記憶全部消消した"].
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
				Prompt: ["Me: ${args}"].
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
				`Me: ${args}\nHiyori: ${reply.replace(/\n/g, '')}`
			);
			setTimeout(() => {
				db.deleteAll();
			}, 120000);
			console.log(`current context {\n${previousContext}\n}`);
			m.reply(
				decapitalize(reply.replace(/^(hiyori:|response:)\s*/i, ''))
			);
		}
	},
};
