const { encode } = require('gpt-3-encoder');
module.exports = {
	runCommand: '.token ',
	aliases: [],
	async run(m, args) {
		await m.channel.sendTyping();
		const prefix = this.runCommand;
		args = m.content.slice(prefix.length);
		const encoded = encode(args);

		m.reply(
			`
            Tokens: \`\`${Object.keys(encoded).length}\`\`
            Characters: \`\`${args.length}\`\`
            `.replace(/ /g, '')
		);
	},
};
