const io = require('console-read-write')
const ytdl = require('ytdl-core')
const ytsearch = require('youtube-search');
const { config } = require("dotenv");
const fs = require("fs")
config({
    path: __dirname + "/env.env"
});

const opts = {
    maxResults: 10,
    key: process.env.YTAPIKEY,
    type: 'video'
};

async function main() {


io.write('Hey which video you want download on youtube ?');

let search = false
while (!search) {
    io.write(`Type a video's title !`);
    search = await io.read()
}

io.write("Researching for " + `"${search}"` + " video . . .")
let resultst = await ytsearch(search, opts);
let youtubeResults = resultst.results;
let i  = 0;
let titles = youtubeResults.map(result => {
    i++;
    io.write(`${i}. ` + `${result.title}`);
})
numbersearch = await io.read();
let selected = youtubeResults[numbersearch - 1];

await ytdl(selected.link, {"quality": `highest`, "format":`mp4`}).pipe(fs.createWriteStream(`./${selected.title}` + ".mp4"));
}


   
main();