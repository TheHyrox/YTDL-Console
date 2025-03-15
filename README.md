# **YTDL-Console** is a Youtube Downloader in your terminal

Simple and efficient JS youtube downloader in your terminal

## Specifications

- Runs on Windows, Mac, Linux
- Programming in Node.JS
- Quality selector and downloading in .mkv

## How to Install

### Requirements 
- [NodeJS](https://nodejs.org/en/download)
- [NPM]()
- (MacOS & Linux) [Homebrew](https://brew.sh/)

```
git clone https://github.com/TheHyrox/YTDL-Console.git
```

### Windows
First install [ffmpeg](https://www.ffmpeg.org/download.html#build-windows) if you don't have it 


### MacOSX & Linux
First install ffmpeg with brew and get the path

```sh
>brew install ffmpeg
>which ffmpeg
/opt/homebrew/bin/ffmpeg
```

If needed change the [line](https://github.com/TheHyrox/YTDL-Console/blob/main/index-unix.js#L12) with the ffmpeg path

## How to Use

Run the script with 
```
node /index(-unix).js 
```

Then write off a video-id, link or name, select the right one and choose what you want to download 

<img>