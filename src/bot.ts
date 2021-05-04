import Discord, { TextChannel } from "discord.js";
import auth from "./auth.json";

const client = new Discord.Client();
client.on("ready", () => {
    console.log(`Logged in as ${client.user?.tag}!`);
});
client.login(auth.token);

const RE_YEARTAG = /\([^)]*\d{4}[^)]*\)/;
const RE_COMMAND = /^[ \t]*~([^~]\S*)\s*(.*)\s*/i;


client.on("message", msg => {
    if (isSelfMsg(msg))
        return;
    const match = RE_COMMAND.exec(msg.content);
    if (match) {
        const command = match[1];
        const args = match[2];
        let argv = wsSplit(args);
        console.log(`command[${command}] args[${args}]`);
        if (command == "movie") {
            movie(msg, argv);
        } else if (command == "categories") {
            categories(msg, argv);
        } else {
            msg.reply(`i don't know how to '${command}' -- my skull is still a bit soft`)
        }
    }
});

async function movie(msg: Discord.Message, argv: string[]) {
    const data = await makeMovieData(msg);
    const movies = data.allmovies;
    if (movies.length > 0) {
        var item = movies[Math.floor(Math.random() * movies.length)];
        msg.reply(`i'm trying my best >.< ... **${item}** ??`);
    } else {
        msg.reply("uh oh, kitty brain does not contain that knowledge right now");
    }
}

async function categories(msg: Discord.Message, argv: string[]) {
    const data: MoviesData = await makeMovieData(msg);
    let categoriesWithCounts: string[] = [];
    data.categories.forEach(category => {
        let cmovies = data.cat2movies.get(category)!;
        categoriesWithCounts.push(`**${category}** [${cmovies.length}]`)
    });
    msg.reply(categoriesWithCounts.join(", "));
}

function strip(s: string) {
    const re = /^\s*|\s*$/g;
    return s.replace(re, "");
}

function icsort(arr: any[]) {
    const opt = { sensitivity: 'base' };
    arr.sort((a, b) => a.localeCompare(b, undefined, opt));
}

async function makeMovieData(msg: Discord.Message): Promise<MoviesData> {
    const channel = await client.channels.cache.get(auth.channel);
    if (channel instanceof TextChannel) {
        const msgs = await channel.messages.fetch({ limit: 100 });
        const lines = msgsToLines(msgs);
        let allmovies: string[] = [];
        let cat2movies = new Map<string, string[]>();
        let movie2cats = new Map<string, string[]>();
        processLines(lines, cat2movies, allmovies);
        let categories = Array.from(cat2movies.keys());
        icsort(categories);
        const data: MoviesData = {
            allmovies: allmovies,
            cat2movies: cat2movies,
            categories: categories
        }
        return data;
    } else {
        let replyText = `no such channel ${auth.channel} ?! how can this be ?! beep`;
        msg.reply(replyText)
        return Promise.reject(replyText);
    }
}

interface MoviesData {
    allmovies: string[];
    cat2movies: Map<string, string[]>;
    categories: string[];
};

function processLines(lines: string[], cat2movies: Map<string, string[]>, allmovies: string[]) {
    let curcat: string = "";
    lines.forEach(line => {
        console.log(line);
        if (line.startsWith("*")) {
            curcat = line.replace(/\*+/g, "");
        } else if (isMovie(line)) {
            allmovies.push(line);
            if (curcat) {
                let catmovs = cat2movies.get(curcat);
                if (!catmovs) {
                    catmovs = [];
                    cat2movies.set(curcat, catmovs);
                }
                catmovs.push(line);
            }
        }
    });
}

function msgsToLines(msgs: Discord.Collection<string, Discord.Message>) {
    const contents: string[] = [];
    msgs.forEach((msg, msgid) => contents.push(msg.content));
    contents.reverse();
    const lines: string[] = [];
    contents.forEach(content => {
        let mlines = content.split(/ *\r?\n+ */);
        mlines = mlines.map(mline => strip(mline));
        lines.push(...mlines);
    });
    return lines;
}


function isMovie(str: string) {
    return (RE_YEARTAG.test(str) || str.indexOf("✓") != -1);
}

function wsSplit(str: string): string[] {
    let result: string[] = [];
    if (str) {
        result = str.split(/\s+/g);
    }
    return result;
}

function isSelfMsg(msg: Discord.Message) {
    if (msg && msg.author && msg.author.id) {
        if (client && client.user && client.user.id) {
            return msg.author.id == client.user.id;
        }
    }
    return false;
}