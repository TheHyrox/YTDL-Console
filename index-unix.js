import io from 'console-read-write';
import ytsearch from 'youtube-search';
import dotenv from 'dotenv';
import google from 'googleapis';
import ytdl from '@distube/ytdl-core';
import fs from 'fs';
import { spawn } from 'child_process';
import readline from 'readline';
import request from 'request';

//Edit if you have ffmpeg installed in another path
const FFMPEG_PATH = '/opt/homebrew/bin/ffmpeg'; 

// Load environment variables
dotenv.config();

// Initialize the YouTube API client
const oauth2Client = new google.Auth.AuthClient(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    'http://localhost'
);

//Options for the search (10 Videos, and API key)
const options = {
    maxResults: 10,
    key: process.env.YTAPIKEY,
    type: 'video',
    auth: oauth2Client
};

//Initialiaze the tracker for download
const tracker = {
    audio: { downloaded: 0, total: 0 },
    video: { downloaded: 0, total: 0 },
    merged: { frame: 0, speed: '0x', fps: 0 }
};


//Create the folders if not exists
var dir = './Download';
var dirvideo = './Download/Video';
var diraudio = './Download/Audio';
var dirthumb = './Download/Thumbnail'
var dirmerg = './Download/Merge'

if (!fs.existsSync(dir)){fs.mkdirSync(dir)}
if (!fs.existsSync(dirvideo)){fs.mkdirSync(dirvideo)}
if (!fs.existsSync(diraudio)){fs.mkdirSync(diraudio)}
if (!fs.existsSync(dirthumb)){fs.mkdirSync(dirthumb)}
if (!fs.existsSync(dirmerg)){fs.mkdirSync(dirmerg)}

// Add this function near your other utility functions
function sectohms(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

//Asker for video quality and downloader
async function videoDownloader(result) {
    try {
        const info = await ytdl.getInfo(result.link);
        let qualityLinks = [];

        //For each format if the quality is not already in the array, add it and store the link too
        for (let i = 0; i < info.formats.length; i++) {
            if (info.formats[i].qualityLabel !== null || info.formats[i].qualityLabel !== undefined) {
                if (info.formats[i].qualityLabel && !qualityLinks.some(link => link.quality === info.formats[i].qualityLabel)) {
                    qualityLinks.push({
                        quality: info.formats[i].qualityLabel,
                        url: info.formats[i].url,
                        itag: info.formats[i].itag
                    });
                }
            }
        }

        //Sort the array by quality
        qualityLinks.sort((a, b) => {
            const qualityA = parseInt(a.quality) || 0;
            const qualityB = parseInt(b.quality) || 0;
            return qualityB - qualityA;
        });

        //Display the qualities available
        qualityLinks.forEach((quality, index) => {
            console.log(`${index}. Quality: ${quality.quality}`);
        });

        let choice = '';
        while (choice === '') {
            io.write(`Type the number of the quality you want to download (or 'cancel' to cancel)`);
            choice = await io.read();

            if(choice === "Cancel" || choice === "cancel"){
                io.write("Process canceled");
                return;
            } else if (choice >= qualityLinks.length || isNaN(choice) || choice < 0){
                io.write(`You should write a valid number between 0 and ${qualityLinks.length - 1}`);
                choice = '';
            }
        }

        //Download the video
        const audio = ytdl(result.link, { 
            quality: 'highestaudio',
            filter: 'audioonly'
        });

        const video = ytdl(result.link, { 
            quality: qualityLinks[choice].itag,
            filter: 'videoonly' 
        });

        audio.on('error', error => {
            console.error('Audio stream error:', error);
        });
        video.on('error', error => {
            console.error('Video stream error:', error);
        });
        audio.on('progress', (_, downloaded, total) => {
            tracker.audio = { downloaded, total };
        });
        video.on('progress', (_, downloaded, total) => {
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
    
        const ffmpegProcess = spawn(FFMPEG_PATH, [
            '-loglevel', 'warning',
            '-hide_banner',
            '-progress', 'pipe:3',
            '-i', 'pipe:4',
            '-i', 'pipe:5',
            '-map', '0:a',
            '-map', '1:v',
            '-c:v', 'copy',
            '-c:a', 'aac',
            '-strict', 'experimental',
            '-movflags', '+faststart',
            `./Download/Video/${result.title.replace(/[/\\?%*:|"<>]/g, '')}.mp4`, // Changed to .mp4
        ], {
            windowsHide: true,
            stdio: [
                'inherit', 'inherit', 'inherit', 'pipe', 'pipe', 'pipe',
            ],
        });
        ffmpegProcess.on('error', error => {
            console.error('FFmpeg process error:', error);
        });

        if (ffmpegProcess.stderr) {
            ffmpegProcess.stderr.on('data', data => {
                console.error('FFmpeg stderr:', data.toString());
            });
        }

        ffmpegProcess.on('close', code => {
            if (code !== 0) {
                console.error(`FFmpeg process exited with code ${code}`);
            } else {
                console.log('\nDownload completed successfully!');
            }
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
        audio.pipe(ffmpegProcess.stdio[4]).on('error', (error) => {
            console.error('Error piping audio:', error);
        });

        video.pipe(ffmpegProcess.stdio[5]).on('error', (error) => {
            console.error('Error piping video:', error);
        });
    
        io.write(`The video is downloading, check the "Download/Video" folder when finished`);
        io.write(`Video information:`);
        io.write(`Author: ${info.videoDetails.author.name}`);
        io.write(`Views: ${info.videoDetails.viewCount}`);
        io.write(`Duration: ${sectohms(info.videoDetails.lengthSeconds)}`);
        io.write(`Category: ${info.videoDetails.category}`);
    } catch (error) {
        console.error('Error downloading video:', error);
        throw error;
    }
}

//Audio downloader
async function audioDownloader(result) {
    try {
        const info = await ytdl.getInfo(result.link);

        const audio = ytdl(result.link, { 
            quality: 'highestaudio',
            filter: 'audioonly'
        }).on('progress', (_, downloaded, total) => {
            tracker.audio = { downloaded, total };
        });

        let progressbarHandle = null;
        const progressbarInterval = 1000;
        const showProgress = () => {
            readline.cursorTo(process.stdout, 0);
            const toMB = i => (i / 1024 / 1024).toFixed(2);

            process.stdout.write(`Audio  | ${(tracker.audio.downloaded / tracker.audio.total * 100).toFixed(2)}% processed `);
            process.stdout.write(`(${toMB(tracker.audio.downloaded)}MB of ${toMB(tracker.audio.total)}MB).${' '.repeat(10)}\n`);
            readline.moveCursor(process.stdout, 0, -1);
        };

        const ffmpegProcess = spawn(FFMPEG_PATH, [
            '-loglevel', '8', '-hide_banner',
            '-progress', 'pipe:3',
            '-i', 'pipe:4',
            '-acodec', 'libmp3lame',
            '-ab', '128k',
            `./Download/Audio/${result.title.replace(/[/\\?%*:|"<>]/g, '')}.wav`, // Changed to .mp3
        ], {
            windowsHide: true,
            stdio: [
                'inherit', 'inherit', 'inherit', 'pipe', 'pipe'
            ],
        });

        ffmpegProcess.on('close', () => {
            process.stdout.write('\n\n');
            clearInterval(progressbarHandle);
            io.write('Download completed!');
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

        io.write(`The audio is downloading, check the "Download/Audio" folder when finished`);
        io.write(`Video information:`);
        io.write(`Author: ${info.videoDetails.author.name}`);
        io.write(`Views: ${info.videoDetails.viewCount}`);
        io.write(`Duration: ${sectohms(info.videoDetails.lengthSeconds)}`);
        io.write(`Category: ${info.videoDetails.category}`);

    } catch (error) {
        console.error('Error downloading audio:', error);
        throw error;
    }
}

//Thumbnail downloader
async function thumbnailDownloader(result) {
    request(`https://i3.ytimg.com/vi/${result.id}/maxresdefault.jpg`).pipe(fs.createWriteStream(dirthumb + '/' + `${result.title.replace(/[/\\?%*:|"<>]/g, '')}.jpg`));
}

//Main function 
async function main() {

    //Initial Ask & Search
    let search = ''
    while (search === '') {
        io.write(`Type a video's title, or a video's ID or a video's link !`);
        search = await io.read()
    }
    io.write("Researching for " + `"${search}"` + " video . . .")

    //Search for the video and get the results (also down a level in the array)
    let results = await ytsearch(search, options);
    results = results.results;

    //Display the results, ask for the choice and re-set the results array
    results.forEach((result, index) => {
        console.log(`${index}. ${result.title} | By : ${result.channelTitle}`);
    });

    let choice = ''
    while (choice === '') {
        io.write(`Type the number of the video you want to download (or 'cancel' to cancel)`);
        choice = await io.read()

        if(choice === "Cancel" || choice === "cancel"){
            io.write("Process canceled")
        } else if (choice > 9 || isNaN(choice) || choice < 0){
            io.write("You should write a valid number between 0 and 9")
            choice = ''
        } else if (results[choice].kind != 'youtube#video'){
            io.write("You can't download a channel or a playlist")
            choice = ''
        }
    }

    results = results[choice];

    //Last choice, what to download
    io.write("What you want to do ?")
    io.write("1 - Download video (mkv)\n2 - Download audio (wav)\n3 - Download thumbnail (jpg)")
    choice = await io.read()

    switch (choice) {
        case '1':
            videoDownloader(results);
            break;
        case '2':
            audioDownloader(results)
            break;
        case '3':
            thumbnailDownloader(results)
        default:
            io.write("Bye")
            break;
    }

}

main();