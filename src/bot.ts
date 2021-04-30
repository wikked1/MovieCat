import Discord, { TextChannel } from "discord.js";
import auth from "./auth.json";

const client = new Discord.Client();
client.on("ready", () => {
    console.log(`Logged in as ${client.user?.tag}!`);
});
client.login(auth.token);

client.on("message", msg => {
    const contentLower = msg.content.toLowerCase();
    const match = RE_COMMAND.exec(contentLower);
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
        } else if (command == "categories") {
            categories(msg, argv);
        } else {
            msg.reply(`i don't know how to '${command}' -- my skull is still a bit soft`)
        }
    }
});


const RE_YEAR = /\([^)]*\d{4}[^)]*\)/;
const RE_COMMAND = /\s*~(\S+)\s*(.*)\s*/;

function isMovie(str: string) {
    return (RE_YEAR.test(str) || str.indexOf("✓") != -1);
}


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



// async function movie(msg: Discord.Message, argv: string[]) {
//     const channel = await client.channels.cache.get(auth.channel);
//     if (channel instanceof TextChannel) {
//         const msgs = await channel.messages.fetch({ limit: 100 });
//         const lines: string[] = msgsToLines(msgs);
//         let movies = lines.filter(line => isMovie(line));
//         let nonMovies = lines.filter(line => !isMovie(line));
//         movies.forEach(movie => {
//             console.log(movie);
//         });
//         console.log("================================");
//         console.log("================================");
//         nonMovies.forEach(movie => {
//             console.log(movie);
//         });
//         if (movies.length > 0) {
//             var item = movies[Math.floor(Math.random() * movies.length)];
//             msg.reply(`i'm trying my best >.< ... ${item} ??`);
//         } else {
//             msg.reply("uh oh, kitty brain does not contain that knowledge right now");
//         }
//     } else {
//         msg.reply(`no such channel ${auth.channel} ?! how can this be ?! beep`)
//     }
// }

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

async function categories(msg: Discord.Message, argv: string[]) {
    const data: MoviesData = await makeMovieData(msg);
    let categoriesWithCounts: string[] = [];
    data.categories.forEach(category => {
        let cmovies = data.cat2movies.get(category)!;
        categoriesWithCounts.push(`${category} [${cmovies.length}]`)
    });
    msg.reply(categoriesWithCounts.join(", "));
}

// async function categories(msg: Discord.Message, argv: string[]) {
//     const channel = await client.channels.cache.get(auth.channel);
//     if (channel instanceof TextChannel) {
//         const msgs = await channel.messages.fetch({ limit: 100 });
//         const lines = msgsToLines(msgs);
//         let allmovies: string[] = [];
//         let cat2movies = new Map<string, string[]>();
//         sortEmOut(lines, cat2movies, allmovies);
//         let categories = Array.from(cat2movies.keys());
//         icsort(categories);
//         let ccategories: string[] = [];
//         categories.forEach(category => {
//             let cmovies = cat2movies.get(category)!;
//             ccategories.push(`${category} [${cmovies.length}]`)
//         });
//         let i = 0;
//         msg.reply(ccategories.join(", "));
//     } else {
//         msg.reply(`no such channel ${auth.channel} ?! how can this be ?! beep`)
//     }
// }


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
