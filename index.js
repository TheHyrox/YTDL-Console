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
request = require('request');

config({
    path: __dirname + "/env.env"
});

const opts = {
    maxResults: 10,
    key: process.env.YTAPIKEY,
    type: 'video'
};
var dir = './Download';
var dirvideo = './Download/Video';
var diraudio = './Download/Audio';
var dirminia = './Download/Minia'

if (!fs.existsSync(dir)){fs.mkdirSync(dir)}
if (!fs.existsSync(dirvideo)){fs.mkdirSync(dirvideo)}
if (!fs.existsSync(diraudio)){fs.mkdirSync(diraudio)}
if (!fs.existsSync(dirminia)){fs.mkdirSync(dirminia)}

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

async function miniadl(url, path){
    request(url).pipe(fs.createWriteStream(path));
};

async function main() {

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

var titleverify = selected.title;
if( titleverify.indexOf(':') >= 0  || titleverify.indexOf('/') >= 0 || titleverify.indexOf('\\') >= 0  ){
    var ObjTitle = "Invalid Caracter"
}else if(titleverify.length > 10){
    ObjTitle = titleverify.slice(0,10);
}
else{
    var ObjTitle = `${selected.title}`
}

var ivdtl = infos.videoDetails.thumbnails.length
var smurl = infos.videoDetails.thumbnails[ivdtl - 1].url

io.write("What you want to do ?")
io.write("1 - Download video\n2 - Download audio (doesn't work with Foobar2000)\n3 - Download Miniature\n4 - All")
choice = await io.read()

if (choice > 4 || isNaN(choice) || choice <= 0){
    return io.write("You should write a valid number")
}

if(choice == 1){
    await ytdl(selected.link, {"quality": `highest`, "format":`mp4`}).pipe(fs.createWriteStream(`./Download/Video/${ObjTitle}` + ".mp4"));
    console.clear();
    io.write(`Your video is dowloading, check on the "Download/Video" folder when the program is finished ^^`)
    io.write(`Meanwhile download, this is the informations of the video : \n`)
    io.write(`Author : ${infos.videoDetails.author.name} \nViews : ${infos.videoDetails.viewCount} \nTime : ${sectohms(infos.videoDetails.lengthSeconds)}\nLike/Dislikes : ${infos.videoDetails.likes}/${infos.videoDetails.dislikes} \nCategory : ${infos.videoDetails.category} `)
}

if(choice == 2){
    await ytdl(selected.link, {"quality": `highestaudio`, "format":`mp3`}).pipe(fs.createWriteStream(`./Download/Audio/${ObjTitle}` + ".mp3"));
    console.clear();
    io.write(`Your video is dowloading, check on the "Download/Audio" folder when the program is finished ^^`)
    io.write(`Meanwhile download, this is the informations of the video : \n`)
    io.write(`Author : ${infos.videoDetails.author.name} \nViews : ${infos.videoDetails.viewCount} \nTime : ${sectohms(infos.videoDetails.lengthSeconds)}\nLike/Dislikes : ${infos.videoDetails.likes}/${infos.videoDetails.dislikes} \nCategory : ${infos.videoDetails.category} `)
}
if(choice == 3){
    miniadl(smurl, `./Download/Minia/${ObjTitle}.png`)
    io.write(`The miniature is dowloading, check on the "Download/Minia" folder when the program is finished ^^`)
}   
if(choice == 4){
    await ytdl(selected.link, {"quality": `highest`, "format":`mp4`}).pipe(fs.createWriteStream(`./Download/Video/${ObjTitle}` + ".mp4"));
    await ytdl(selected.link, {"quality": `highestaudio`, "format":`mp3`}).pipe(fs.createWriteStream(`./Download/Audio/${ObjTitle}` + ".mp3"));
    miniadl(smurl, `./Download/Minia/${ObjTitle}.png`)
    io.write(`All things is dowloading, check on the "Download/" folder when the program is finished ^^`)
    io.write(`Meanwhile download, this is the informations of the video : \n`)
    io.write(`Author : ${infos.videoDetails.author.name} \nViews : ${infos.videoDetails.viewCount} \nTime : ${sectohms(infos.videoDetails.lengthSeconds)}\nLike/Dislikes : ${infos.videoDetails.likes}/${infos.videoDetails.dislikes} \nCategory : ${infos.videoDetails.category} `)
}

}

main();
