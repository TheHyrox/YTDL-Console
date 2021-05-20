/*.##....##.########.########..##...........######...#######..##....##..######...#######..##.......########
  ..##..##.....##....##.....##.##..........##....##.##.....##.###...##.##....##.##.....##.##.......##......
  ...####......##....##.....##.##..........##.......##.....##.####..##.##.......##.....##.##.......##......
  ....##.......##....##.....##.##..........##.......##.....##.##.##.##..######..##.....##.##.......######..
  ....##.......##....##.....##.##..........##.......##.....##.##..####.......##.##.....##.##.......##......
  ....##.......##....##.....##.##..........##....##.##.....##.##...###.##....##.##.....##.##.......##......
  ....##.......##....########..########.....######...#######..##....##..######...#######..########.########*/

const io = require('console-read-write')
const ytdl = require('ytdl-core')
const ytsearch = require('youtube-search');
const { config } = require("dotenv");
const fs = require("fs");

config({
    path: __dirname + "/env.env"
});

const opts = {
    maxResults: 10,
    key: process.env.YTAPIKEY,
    type: 'video'
};
var dir = './Download';

function sectohms(timesec){

    var min = 0;
    var heures = 0;
    while(timesec > 60) {
        if(timesec > 60){
            min += 1;
            timesec = (timesec - 60)
            if(min >= 60){
                heures += 1;
                min = min - 60
        }
    }
}
    return `${heures} hours(s) : ${min} minute(s) : ${timesec} second(s)`
}

async function main() {

io.write('Hey which video you want download on youtube ?');

let search = false
while (!search) {
    io.write(`Type a video's title, or a video's ID or a video's link !`);
    search = await io.read()
}

io.write("Researching for " + `"${search}"` + " video . . .")
let resultst = await ytsearch(search, opts);
let youtubeResults = resultst.results;

let i  = 0;
let titles = youtubeResults.map(result => {
    i++;
    io.write(`${i}. ` + `${result.title} | By : ${result.channelTitle}`);
})
io.write("\n")
io.write("For cancel selection write 'cancel'")
numbersearch = await io.read();
if(numbersearch == "Cancel" || numbersearch == "cancel"){
    return io.write("Process canceled")
}
if (numbersearch > 10 || isNaN(numbersearch) || numbersearch <= 0){
    return io.write("You should write a valid number between 1 and 10")
}

let selected = youtubeResults[numbersearch - 1];
let infos = await ytdl.getInfo(selected.link);
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

var titleverify = selected.title;

if( titleverify.indexOf(':') >= 0  || titleverify.indexOf('/') >= 0 || titleverify.indexOf('\\') >= 0  ){
    await ytdl(selected.link, {"quality": `highest`, "format":`mp4`}).pipe(fs.createWriteStream(`./Download/Invalid Character` + ".mp4"));
}else{
await ytdl(selected.link, {"quality": `highest`, "format":`mp4`}).pipe(fs.createWriteStream(`./Download/${selected.title}` + ".mp4"));
}
console.clear();
io.write(`Your video is dowloading, check on the "Download" folder when the program is finished ^^`)
io.write(`Meanwhile download, this is the informations of the video : \n`)
io.write(`Author : ${infos.videoDetails.author} \nViews : ${infos.videoDetails.viewCount} \nTime : ${sectohms(infos.videoDetails.lengthSeconds)}\nLike/Dislikes : ${infos.videoDetails.likes}/${infos.videoDetails.dislikes} \nCategory : ${infos.videoDetails.category} `)
}
  
main();
