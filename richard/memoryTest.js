require('dotenv').config();
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
	runCommand: '.mem ',
	aliases: [],
	async run(m, args) {
		args = '';
		const prefixes = [this.runCommand, ...(this.aliases || [])];
		prefixes.forEach((prefix) => {
			if (m.content.startsWith(prefix)) {
				args = m.content.slice(prefix.length);
			}
		});

		if (args == 'wipe') {
			db.deleteAll();
			m.reply('memory deleted');
			return;
		}
		const importDynamic = new Function(
			'modulePath',
			'return import(modulePath)'
		);
		const { ChatGPTAPI } = await importDynamic('chatgpt');
		const api = new ChatGPTAPI({ apiKey: process.env.APIKEY });

		await m.channel.sendTyping();

		let previousContext = await db.get(`${m.author.id}-testContext`);
		if (!previousContext) {
			previousContext = '';
		}

		let inst = `
            		Act as Riz. 
        	`; //some personality, I deleted the rest

		const prompt = `
            		Instructions: [${inst}],
            		Prompt: [${args}],
        	`;

		//here I'm making it use the instructions if there's nothing stored in the db, and following-up if there is something in it;
		
		if (previousContext == '') {
			let res = await api.sendMessage(prompt);
			m.reply(res.text);
			console.log(res.detail.choices, 1);
			try {
				await db.set(`${m.author.id}-testContext`, res);
			} catch (error) {
				console.error(error);
			}

			// if I hardcode the follow-up message:

			// res = await api.sendMessage('follow-up message', {
			// 	parentMessageId: res.id
			// });

			// it will work just fine, using the previous id and referencing it to generate a relevant response. this can go for as much as I can, as long as it's hard coded
			
		} else {
			const previousContext = await db.get(`${m.author.id}-testContext`);
			console.log(previousContext, 3);
			let res = previousContext;

			const resp = await api.sendMessage(args, {
				parentMessageId: res.id, //I'm passing this parameter, but it's not using it. as a result, it doens't remember any of my previous dialogues
			});

			m.reply(resp.text);

			try {
				await db.set(`${m.author.id}-testContext`, res);
			} catch (error) {
				console.error(error);
			}
		}
	},
};
