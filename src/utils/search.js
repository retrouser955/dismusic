const googleIt = require('google-it')
const play = require('play-dl')
const fetch = require('isomorphic-unfetch')
const fs = require('fs')
const { getData, getTracks } = require('spotify-url-info')(fetch)
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
    const results = youtube.map((track) => {
        return {
            name: track.title,
            description: track.description,
            rawData: track,
            duration: {
                formatted: track.durationRaw,
                raw: track.durationInSec
            },
            url: track.url,
            thumbnail: track.thumbnails[0].url,
            author: {
                name: track.channel.name,
                thumbnail: track.channel.icons[0].url
            }
        }
    })
    return results
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

async function SpotifyPlaylistInfo(query) {
    const spotify = await getData(query)
    return {
        collaborative: spotify.collaborative,
        description: spotify.description ?? null,
        url: spotify.external_urls.spotify,
        name: spotify.name,
        author: spotify.owner.display_name,
        tracks: []
    }
}

async function SpotifyPlaylist(query) {
    const spotifyData = await getTracks(query)
    const promiseSpotifyData = await spotifyData.map(async track => {
        const minute = await getMinute(Math.floor(track.duration_ms / 1000))
        return {
            name: track.name,
            description: null,
            rawData: track,
            duration: {
                formatted: minute,
                raw: Math.floor(track.duration_ms / 1000)
            },
            url: track.external_urls.spotify,
            author: {
                name: track.artists[0].name,
                thumbnail: null
            },
            thumbnail: track.album.images[0].url
        }
    })
    const finalData = await Promise.all(promiseSpotifyData)
    const spotifyPlaylistData = await SpotifyPlaylistInfo(query)
    spotifyPlaylistData.tracks = finalData
    return spotifyPlaylistData
}

module.exports = {
    SoundCloudSearch,
    Spotify,
    YouTubeSearch,
    YouTube,
    SoundCloud,
    SpotifyPlaylist
}