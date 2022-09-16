const EventEmiter = require('node:events')
const regexpConstants = require('./constants/regex')
const fetch = require('isomorphic-unfetch')
const { getData } = require('spotify-url-info')(fetch)
const play = require('play-dl')
const getMinute = require('./utils/time')
const QueueBuilder = require('./utils/Queue.js')
class Player extends EventEmiter {
    constructor(client, authCodes, options) {
        if(!client) throw new Error('[ Dismusic Error ] A valid discord client is required to create a player')
        this.client = client
        this.queues = {}
        this.players = {}
        this.guilds = {}
        if(authCodes?.spotify) {
            play.getFreeClientID().then(async (id) => {
                play.setToken({
                    soundcloud: {
                        client_id: id
                    },
                    spotify: {
                        client_id: authCodes.clientId,
                        client_secret: authCodes.clientSecret,
                        refresh_token: authCodes.refresh_token,
                        market: authCodes?.market || 'US'
                    }
                })
                this.hasSpotifyToken = true
            })
        }
        options?.volumeSetter ? this.changeableVolume = true : this.changeableVolume = false
    }
    async search(query) {
        if(!query) throw new Error('[ Dismusic Error ] A valid query must be provided')
        if(typeof query != 'string') throw new Error(`[ Dismusic Error ] Query must be a type of String. Got ${typeof query}`)
        const isYT = query.match(regexpConstants.youtube)
        const isSpotify = query.match(regexpConstants.spotify)
        const isSoundCloud = query.match(regexpConstants.soundCloud)
        if(isYT) {
            const youtubeInfo = await play.video_basic_info(query)
            if(!youtubeInfo || !youtubeInfo.video_details) return undefined
            return {
                title: youtubeInfo.video_details.title,
                description: youtubeInfo.video_details.description,
                author: youtubeInfo.video_details.channel.artist,
                duration: {
                    raw: youtubeInfo.video_details.durationRaw,
                    seconds: youtubeInfo.video_details.durationInSec
                },
                thumbnail: youtubeInfo.video_details.thumbnails[0].url,
                type: "youtube_video",
                url: youtubeInfo.video_details.url
            }
        }
        if(isSpotify) {
            const isPlaylist = query.match(regexpConstants.spotifyPlaylist)
            try {
                switch(isPlaylist) {
                    case true:
                        const data = await getData(query)
                        return {
                            name: data.name,
                            type: "playlist",
                            url: data.external_urls.spotify,
                            thumbnail: data.images[0].url,
                            duration: {
                                raw: null,
                                seconds: null
                            },
                            author: String(data.owner.uri).replace('spotify:user:', ''),
                            type: "spotify_playlist"
                        }
                    case false:
                        const spotifyData = await getData(query)
                        return spotifyData
                }
            } catch (error) {
                console.log('[ Dismusic Warning ] Could not get Spotify Data falling back to play-dl. Make sure you put in your token')
                if(this.hasSpotifyToken) {
                    const spotifyDataFromPlayDL = await play.spotify(query)
                    const isPlaylist = query.match(regexpConstants.spotifyPlaylist)
                    try {
                        if(play.is_expired()) await play.refreshToken()
                    } catch (error) {
                        console.log('[ Dismusic Warning ] Could not refresh your token')
                    }
                    const time = await getMinute(spotifyDataFromPlayDL.durationInSec)
                    switch(isPlaylist) {
                        case true:
                            const value = Array.from(spotifyDataFromPlayDL.fetched_tracks.values())
                            const array = value[0]
                            return {
                                name: spotifyDataFromPlayDL.name,
                                description: spotifyDataFromPlayDL.description,
                                author: spotifyDataFromPlayDL.owner,
                                type: "spotify_playlist",
                                thumbnail: spotifyDataFromPlayDL.thumbnail.url,
                                url: spotifyDataFromPlayDL.url,
                                tracks: array,
                                duration: {
                                    seconds: spotifyDataFromPlayDL.durationInSec,
                                    raw: time
                                }
                            }
                        case false:
                            return {
                                name: spotifyDataFromPlayDL.name,
                                description: spotifyDataFromPlayDL?.description,
                                author: spotifyDataFromPlayDL.owner,
                                type: "spotify_track",
                                thumbnail: spotifyDataFromPlayDL.thumbnail.url,
                                url: spotifyDataFromPlayDL.url,
                                tracks: null,
                                duration: {
                                    seconds: spotifyDataFromPlayDL.durationInSec,
                                    raw: time
                                }
                            }
                    }
                }
            }
        }
        if(isSoundCloud) {
            const soundCloudData = await play.soundcloud(query)
            const rawTime = await getMinute(soundCloudData.durationInSec)
            switch (soundCloudData.type) {
                case "track":
                    return {
                        name: soundCloudData.name,
                        description: null,
                        author: soundCloudData?.publisher,
                        type: "soundcloud_track",
                        thumbnail: soundCloudData.thumbnail,
                        url: soundCloudData.url,
                        tracks: null,
                        duration: {
                            seconds: soundCloudData.durationInSec,
                            raw: rawTime
                        }
                    }
                case 'playlist':
                    return {
                        name: soundCloudData.name,
                        description: null,
                        author: soundCloudData?.publisher,
                        type: "soundcloud_playlist",
                        url: soundCloudData.url,
                        tracks: Array.from(soundCloudData.tracks)[0],
                        duration: {
                            seconds: soundCloudData.durationInSec,
                            raw: rawTime
                        }
                    }
                case 'user':
                    console.warn('[ Dismusic Warning ] Expected soundcloud track or playlist. Got user instead')
                    return undefined
            }
        }
        const search = await play.search(query, {
            source: {
                youtube: 'video'
            }
        })
        return {
            name: search[0].title,
            description: search[0].description,
            author: search[0].channel.name,
            type: "youtube_video",
            url: search[0].url,
            tracks: null,
            duration: {
                raw: search[0].durationRaw,
                seconds: search[0].durationInSec
            }
        }
    }
    async createQueue(guild, options) {
        const queueFunctions = new QueueBuilder(guild, options)
        this.queues[guild.id] = queueFunctions.create()
        this.queues[guild.id].metadata = options.metadata
        return this.queues[guild.id]
    }
}

module.exports = Player