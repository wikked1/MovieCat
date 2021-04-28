import Discord, { TextChannel } from "discord.js";
import auth from "./auth.json";

const client = new Discord.Client();

client.on("ready", () => {
    console.log(`Logged in as ${client.user?.tag}!`);
});

async function movie(msg: Discord.Message, argv: string[]) {
    const channel = await client.channels.cache.get(auth.channel);
    if (channel instanceof TextChannel) {
        const msgs = await channel.messages.fetch({ limit: 100 });
        const lines: string[] = [];
        msgs.forEach((msg, msgid) => {
            const content = msg.content;
            console.log("===============================");
            console.log(content);
            console.log("-------------------------------");
            const mlines = content.split(/ *\r?\n+ */);
            for (let line of mlines) {
                lines.push(line);
            }
        });
        if (lines.length > 0) {
            var item = lines[Math.floor(Math.random() * lines.length)];
            msg.reply(`i'm trying my best ... ${item} ??`);
        } else {
            msg.reply("uh oh, kitty brain does not contain that knowledge right now");
        }
    } else {
        msg.reply(`no such channel ${auth.channel} ?! how can this be ?! beep`)
    }
}

const commandRegex = /\s*~(\S+)\s*(.*)\s*/;
client.on("message", msg => {
    const contentLower = msg.content.toLowerCase();
    const match = commandRegex.exec(contentLower);
    if (match) {
        const command = match[1];
        const args = match[2];
        let argv: string[] = [];
        if (args) {
            argv = args.split(/\s+/);
        }
        console.log(`command[${command}] args[${args}]`);
        if (command == "movie") {
            movie(msg, argv);
        } else {
            msg.reply(`i don't know how to '${command}' -- my skull is still a bit soft`)
        }
    }
});

client.login(auth.token);


