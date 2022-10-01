const googleIt = require('google-it')
const play = require('play-dl')
const fetch = require('isomorphic-unfetch')
const { getData } = require('spotify-url-info')(fetch)
const getMinute = require('./time.js')
async function SoundCloudSearch(query) {
    const client = await play.getFreeClientID()
    await play.setToken({
        soundcloud: {
            client_id: client
        }
    })
    const googleItResults = await googleIt({
        query: `${query} soundcloud`,
        "no-display": true
    })
    const results = googleItResults.filter(function (result) {
        if(String(result.link).includes('https://soundcloud.com/') && !String(result.link).includes('?')) {
            const newLink = String(result.link).replace('https://', '')
            const array = newLink.split('/')
            return array.length === 3
        }
    })
    if(results.length === 0) return []
    const playData = await play.soundcloud(results[0].link)
    const time = await getMinute(playData.durationInSec)
    return [{
        name: playData.name,
        description: null,
        rawData: playData,
        duration: {
            formatted: time,
            raw: playData.durationInMs
        },
        url: playData.permalink,
        author: {
            name: playData.user.name,
            thumbnail: playData.user.thumbnail
        },
        thumbnail: playData.thumbnail ?? 'https://www.pngitem.com/pimgs/m/522-5228247_soundcloud-logo-hd-png-download.png'
    }]
}

async function Spotify(url) {
    const spotifyData = await getData(url)
    const time = await getMinute(Math.floor(spotifyData.duration / 1000))
    const returnData = [{
        name: spotifyData.name,
        description: null,
        rawData: spotifyData,
        duration: {
            formatted: time,
            raw: Math.floor(spotifyData.duration / 1000)
        },
        url: spotifyData.external_urls.spotify,
        thumbnail: spotifyData.coverArt.sources[0].url ?? "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Spotify_App_Logo.svg/2048px-Spotify_App_Logo.svg.png",
        author: {
            name: spotifyData.artists[0].name,
            thumbnail: null
        }
    }]
    return returnData
}

async function YouTubeSearch(query) {
    const youtube = await play.search(query, {
        source: {
            youtube: 'video'
        },
        limit: 5
    })
    const returnArray = []
    for(const ytData of youtube) {
        returnArray.push({
            name: ytData.title,
            description: ytData.description,
            rawData: ytData,
            duration: {
                formatted: ytData.durationRaw,
                raw: ytData.durationInSec
            },
            url: ytData.url,
            thumbnail: ytData.thumbnails[0].url,
            author: {
                name: ytData.channel.name,
                thumbnail: ytData.channel.icons[0].url
            }
        })
    }
    return returnArray
}

async function YouTube(query) {
    const youtubeData = await play.video_basic_info(query)
    const returnData = [{
        name: youtubeData.video_details.title,
        description: youtubeData.video_details.description,
        rawData: youtubeData.video_details,
        duration: {
            formatted: youtubeData.video_details.durationRaw,
            raw: youtubeData.video_details.durationInSec,
        },
        url: query,
        thumbnail: youtubeData.video_details.thumbnails[0].url,
        author: {
            name: youtubeData.video_details.channel.name,
            thumnail: youtubeData.video_details.channel.iconURL()
        }
    }]
    return returnData
}

async function SoundCloud(soundCloudUrl) {
    const client = await play.getFreeClientID()
    await play.setToken({
        soundcloud: {
            client_id: client
        }
    })
    const playData = await play.soundcloud(soundCloudUrl)
    const time = await getMinute(playData.durationInSec)
    return [{
        name: playData.name,
        description: null,
        rawData: playData,
        duration: {
            formatted: time,
            raw: playData.durationInMs
        },
        url: playData.permalink,
        author: {
            name: playData.user.name,
            thumbnail: playData.user.thumbnail
        },
        thumbnail: playData.thumbnail ?? 'https://www.pngitem.com/pimgs/m/522-5228247_soundcloud-logo-hd-png-download.png'
    }]
}

module.exports = {
    SoundCloudSearch,
    Spotify,
    YouTubeSearch,
    YouTube,
    SoundCloud
}