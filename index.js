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
const ffmpeg = require('ffmpeg-static');
const cp = require('child_process');
const readline = require('readline');

request = require('request');

config({
    path: __dirname + "/env.env"
});

const opts = {
    maxResults: 10,
    key: process.env.YTAPIKEY,
    type: 'video'
};

const tracker = {
    start: Date.now(),
    audio: { downloaded: 0, total: Infinity },
    video: { downloaded: 0, total: Infinity },
    merged: { frame: 0, speed: '0x', fps: 0 },
};

var dir = './Download';
var dirvideo = './Download/Video';
var diraudio = './Download/Audio';
var dirminia = './Download/Minia'
var dirmerg = './Download/Merg'

if (!fs.existsSync(dir)){fs.mkdirSync(dir)}
if (!fs.existsSync(dirvideo)){fs.mkdirSync(dirvideo)}
if (!fs.existsSync(diraudio)){fs.mkdirSync(diraudio)}
if (!fs.existsSync(dirminia)){fs.mkdirSync(dirminia)}
if (!fs.existsSync(dirmerg)){fs.mkdirSync(dirmerg)}
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

const htmlUnescapes = {
    '&amp;': '&',
    '&lt;': '<',    
    '&gt;': '>',    
    '&quot;': '"',    
    '&#39;': "'"        
};
const reEscapedHtml = /&(?:amp|lt|gt|quot|#(0+)?39);/g;

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
var noparr = [`:`, `/`, `\\`, `*`, `?`, `"`, `|`, `<`, `>`]

ObjTitle = titleverify.replace(/[/\\?%*:|"<>]/g, '').replace(reEscapedHtml, entity => htmlUnescapes[entity] || "'");


var ivdtl = infos.videoDetails.thumbnails.length
var smurl = infos.videoDetails.thumbnails[ivdtl - 1].url

io.write("What you want to do ?")
io.write("1 - Download video\n2 - Download audio (doesn't work with Foobar2000)\n3 - Download Miniature\n4 - All")
choice = await io.read()



switch (choice) {
    case '1':
        

        const audio = ytdl(selected.link, { quality: 'highestaudio' })
        .on('progress', (_, downloaded, total) => {
        tracker.audio = { downloaded, total };
        });
        const video = ytdl(selected.link, { quality: 'highestvideo' })
        .on('progress', (_, downloaded, total) => {
        tracker.video = { downloaded, total };
        });

        let progressbarHandle = null;
        const progressbarInterval = 1000;
        const showProgress = () => {
            readline.cursorTo(process.stdout, 0);
            const toMB = i => (i / 1024 / 1024).toFixed(2);

            process.stdout.write(`Audio  | ${(tracker.audio.downloaded / tracker.audio.total * 100).toFixed(2)}% processed `);
            process.stdout.write(`(${toMB(tracker.audio.downloaded)}MB of ${toMB(tracker.audio.total)}MB).${' '.repeat(10)}\n`);

            process.stdout.write(`Video  | ${(tracker.video.downloaded / tracker.video.total * 100).toFixed(2)}% processed `);
            process.stdout.write(`(${toMB(tracker.video.downloaded)}MB of ${toMB(tracker.video.total)}MB).${' '.repeat(10)}\n`);

            process.stdout.write(`Merged | processing frame ${tracker.merged.frame} `);
            process.stdout.write(`(at ${tracker.merged.fps} fps => ${tracker.merged.speed}).${' '.repeat(10)}\n`)

            readline.moveCursor(process.stdout, 0, -3);
        };

        const ffmpegProcess = cp.spawn(ffmpeg, [
            '-loglevel', '8', '-hide_banner',
            '-progress', 'pipe:3',
            '-i', 'pipe:4',
            '-i', 'pipe:5',
            '-map', '0:a',
            '-map', '1:v',
            '-c:v', 'copy',
            `./Download/Video/${ObjTitle}.mkv`,
          ], {
            windowsHide: true,
            stdio: [
              'inherit', 'inherit', 'inherit',
              'pipe', 'pipe', 'pipe',
            ],
          });
          ffmpegProcess.on('close', () => {
            process.stdout.write('\n\n\n\n');
            clearInterval(progressbarHandle);
          });
          ffmpegProcess.stdio[3].on('data', chunk => {

            if (!progressbarHandle) progressbarHandle = setInterval(showProgress, progressbarInterval);
          
            const lines = chunk.toString().trim().split('\n');
            const args = {};
            for (const l of lines) {
              const [key, value] = l.split('=');
              args[key.trim()] = value.trim();
            }
            tracker.merged = args;
          });
          audio.pipe(ffmpegProcess.stdio[4]);
          video.pipe(ffmpegProcess.stdio[5]);

        io.write(`Your video is dowloading, check on the "Download/Video" folder when the program is finished ^^`)
        io.write(`Meanwhile download, this is the informations of the video : \n`)
        io.write(`Author : ${infos.videoDetails.author.name} \nViews : ${infos.videoDetails.viewCount} \nTime : ${sectohms(infos.videoDetails.lengthSeconds)}\nLike/Dislikes : ${infos.videoDetails.likes}/${infos.videoDetails.dislikes} \nCategory : ${infos.videoDetails.category} \n`)
        
        break;
    case '2':
        await ytdl(selected.link, {"quality": `highestaudio`, "format":`mp3`}).pipe(fs.createWriteStream(`./Download/Audio/${ObjTitle}` + ".mp3"));
        console.clear();
        io.write(`Your video is dowloading, check on the "Download/Audio" folder when the program is finished ^^`)
        io.write(`Meanwhile download, this is the informations of the video : \n`)
        io.write(`Author : ${infos.videoDetails.author.name} \nViews : ${infos.videoDetails.viewCount} \nTime : ${sectohms(infos.videoDetails.lengthSeconds)}\nLike/Dislikes : ${infos.videoDetails.likes}/${infos.videoDetails.dislikes} \nCategory : ${infos.videoDetails.category} `)
        break;
    case '3':
        miniadl(smurl, `./Download/Minia/${ObjTitle}.png`)
        io.write(`The miniature is dowloading, check on the "Download/Minia" folder when the program is finished ^^`)
        break;
    case '4':
        await ytdl(selected.link, {"quality": `highest`, "format":`mp4`}).pipe(fs.createWriteStream(`./Download/Video/${ObjTitle}` + ".mp4"));
        await ytdl(selected.link, {"quality": `highestaudio`, "format":`mp3`}).pipe(fs.createWriteStream(`./Download/Audio/${ObjTitle}` + ".mp3"));
        miniadl(smurl, `./Download/Minia/${ObjTitle}.png`)
        io.write(`All things is dowloading, check on the "Download/" folder when the program is finished ^^`)
        io.write(`Meanwhile download, this is the informations of the video : \n`)
        io.write(`Author : ${infos.videoDetails.author.name} \nViews : ${infos.videoDetails.viewCount} \nTime : ${sectohms(infos.videoDetails.lengthSeconds)}\nLike/Dislikes : ${infos.videoDetails.likes}/${infos.videoDetails.dislikes} \nCategory : ${infos.videoDetails.category} `)
        break;
    default: 
       return io.write("You should write a valid number");
  };
}

main();
