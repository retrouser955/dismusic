const play = require('play-dl')
const EventEmmiter = require('node:events')
const youtubeVideoPattern = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/
const {
    joinVoiceChannel,
    getVoiceConnection,
    createAudioResource,
    createAudioPlayer,
    NoSubscriberBehavior
} = require(`@discordjs/voice`)
class Player extends EventEmmiter {
    /**
     * Create a new play with your client
     * @param {any} client (Required) your discord.js client
     * @param {object} options options for your bot
     */
    constructor(client, options) {
        super()
        if(!client) throw new Error('Dismusic Error: A valid discord client must be provided')
        if(!options.spotify) {
            console.log('A spotify token has not been provided! This is used to get playlist and track data from spotify. Without it you will not be able to play spotify links')
        } else {
            play.setToken({
                spotify: {
                    client_id: options.spotify.client_id,
                    client_secret: options.spotify.client_secret,
                    refresh_token: options.spotify.token,
                    market: options.spotify.market
                }
            })
        }
        (async () => {
            if(play.is_expired()) await play.refreshToken()
        })()
        this.client = client
        this.queue = {}
        this.queueData = {}
        this.songs = {}
        this.audioPlayers = {}
        this.audioResources = {}
    }
    /**
     * Create a queue in your guild
     * @param {string} guildId 
     * @param {object} options 
     * @returns {object} returns the queue back to you
     */
    async createQueue(guildId, options) {
        if(!guildId) throw new Error('Dismusic Error: A valid discord guild must be provided')
        if(!options.queueData) console.warn('Dismusic Warning: Queue data has not been provided')
        this.queue[`${guildId}`] = {
            songs: new Array(),
            guild: guildId,
            song: 0
        }
        this.queueData[guildId] = options.queueData
        const returnData = {
            skip: async () => {
                const songArr = this.songs[guildId]
                songArr.splice(0, 1)
                const newSong = songArr[0]
                const spotifySongPattern = /^((https:)?\/\/)?open.spotify.com\/(track)\//;
                let isSpotifyURL
                let spotifyObj, searchSong
                if(String(newSong.url).match(spotifySongPattern)) {
                    isSpotifyURL = true
                    if(play.is_expired()) await play.refreshToken()
                    const spotifyData = await play.spotify(newSong.url)
                    spotifyObj = {
                        name: spotifyData.name,
                        artist: spotifyData.artists[0].name,
                        url: spotifyData.url
                    }
                    searchSong = `${spotifyObj.name} ${spotifyObj.artist} audio`
                } else {
                    isSpotifyURL = false
                    searchSong = newSong.title
                }
                let search
                if(isSpotifyURL) {
                    search = await play.search(searchSong, {
                        limit: 1
                    })
                }
                const stream = await play.stream(isSpotifyURL ? search[0].url : newSong.url)
                this.audioResources[guildId] = createAudioResource(stream.stream, {
                    inputType: stream.type,
                    inlineVolume: true
                })
                this.audioPlayers[guildId].play(this.audioPlayers[guildId])
                this.emit('trackStart', newSong, this.queueData[guildId])
            },
            pause: async () => {
                this.audioPlayers[guildId].pause()
                this.queue[guildId].isPaused = true
            },
            resume: async () => {
                this.audioPlayers[guildId].unpause()
                this.queue[guildId].isPaused = false
            },
            isPaused: this.queue[guildId].isPaused || false,
            connect: async (channel) => {
                if(!channel) throw new Error('Dismusic Error: A Discord voice channel must be provided')
                const connection = joinVoiceChannel({
                    channelId: channel.id,
                    guildId: channel.guild.id,
                    adapterCreator: channel.guild.voiceAdapterCreator
                })
                return connection
            },
            stop: async () => {
                const connection = getVoiceConnection(guildId)
                this.queue[`${guildId}`] = null
                this.audioPlayers[guildId].stop()
                connection.destroy()
            },
            playSong: async (song, options) =>  {
                if(!song) throw new Error('Dismusic Error: You cannot play a song without the song parameter')
                if(!options.metadata) throw new Error('Dismusic Error: You must have a metadata for the song')
                let searchSong;
                let isSpotify;
                let spotifyObj;
                const isYoutubeUrl = String(song).match(youtubeVideoPattern)
                if(String(song).includes('https://open.spotify.com/track/')) {
                    isSpotify = true
                    if(play.is_expired()) await play.refreshToken()
                    const spotifyData = await play.spotify(String(song))
                    spotifyObj  = {
                        name: spotifyData.name,
                        artist: spotifyData.artists[0].name || null,
                        url: spotifyData.url
                    }
                    searchSong = `${spotifyObj.name} ${spotifyObj.artist} audio`
                } else {
                    isSpotify = false
                    searchSong = song
                }
                const searchRes = await play.search(searchSong, {
                    limit: 1
                })
                const stream = await play.stream(isYoutubeUrl ? searchSong : searchRes[0].url)

                this.audioResources[guildId] = createAudioResource(stream.stream, {
                    inputType: stream.type,
                    inlineVolume: true
                })

                this.audioPlayers[guildId] = createAudioPlayer({
                    behaviors: {
                        noSubscriber: NoSubscriberBehavior.Play
                    }
                })

                const connection = getVoiceConnection(guildId)

                this.audioPlayers[guildId].play(this.audioResources[guildId])

                connection.subscribe(this.audioPlayers[guildId])
                this.audioPlayers[guildId].on('stateChange', async (_oldState, newState) => {
                    if(newState.status === 'idle') {
                        try {
                            const songArray = this.songs[guildId]
                            songArray.splice(0, 1)
                            songArray[0].title
                            let stream;
                            const spotifySongPattern = /^((https:)?\/\/)?open.spotify.com\/(track)\//;
                            let spotifyObj, searchSong
                            let isSpotifyURL;
                            if(String(songArray[0].url).match(spotifySongPattern)) {
                                isSpotifyURL = true
                                if(play.is_expired()) await play.refreshToken()
                                const spotifyData = await play.spotify(songArray[0].url)
                                spotifyObj  = {
                                    name: spotifyData.name,
                                    artist: spotifyData.artists[0].name || null,
                                    url: spotifyData.url
                                }
                                searchSong = `${spotifyObj.name} ${spotifyObj.artist} audio`
                            } else {
                                isSpotifyURL = false
                            }
                            if(isSpotify) {
                                const search = await play.search(String(searchSong))
                                stream = await play.stream(search[0].url)
                            } else {
                                stream = await play.stream(songArray[0].url)
                            }
                            
                            this.audioResources[guildId] = createAudioResource(stream.stream, {
                                inputType: stream.type,
                                inlineVolume: true
                            })
                            this.emit(`trackStart`, songArray[0], this.queueData[guildId])

                            this.audioPlayers[guildId].play(this.audioResources[guildId])
                        } catch (error) {
                            const metadata = this.queueData[guildId]
                            this.emit('queueEnded', metadata)
                            this.queue[`${guildId}`] = null
                            this.queueData[guildId] = null
                            this.songs[guildId] = null
                            this.audioPlayers[guildId].stop()
                            try {
                                return connection.destroy()
                            } catch {
                                /** do nothing (literally) */
                            }
                        }
                    }
                })
                if(spotifyObj) isSpotify = true
                this.songs[guildId] = [{
                    title: `${isSpotify ? spotifyObj.name : searchRes[0].title}`,
                    description: isSpotify ? undefined : searchRes[0].description,
                    duration: `${searchRes[0].durationRaw}`,
                    url: `${isSpotify ? spotifyObj.url : searchRes[0].url}`,
                    metadata: options.metadata
                }]
                return {
                    title: `${isSpotify ? spotifyObj.name : searchRes[0].title}`,
                    description: isSpotify ? undefined : searchRes[0].description,
                    duration: `${searchRes[0].durationRaw}`,
                    url: `${isSpotify ? spotifyObj.url : searchRes[0].url}`,
                    metadata: options.metadata
                }
            },
            songs: this.songs[guildId],
            addSong: async (song, options) => {
                if(!song) throw new Error('Dismusic Error: You cannot play a song without the song parameter')
                if(!options.metadata) throw new Error('Dismusic Error: You must have a metadata for the song')
                let spotifyObj, isSpotify
                if(String(song).includes('https://open.spotify.com/track/')) {
                    isSpotify = true
                    if(play.is_expired()) await play.refreshToken()
                    const spotifyData = await play.spotify(String(song))
                    spotifyObj  = {
                        name: spotifyData.name,
                        artist: spotifyData.artists[0].name || null,
                        url: spotifyData.url
                    }
                    searchSong = `${spotifyObj.name} ${spotifyObj.artist} audio`
                } else {
                    isSpotify = false
                    searchSong = song
                }
                const searchRes = await play.search(song, {
                    limit: 1
                })
                this.songs[guildId].push({
                    title: `${isSpotify ? spotifyObj.name : searchRes[0].title}`,
                    description: isSpotify ? null : searchRes[0].description,
                    duration: `${searchRes[0].durationRaw}`,
                    url: `${isSpotify ? spotifyObj.url : searchRes[0].url}`,
                    metadata: options.metadata
                })
                return {
                    title: `${isSpotify ? spotifyObj.name : searchRes[0].title}`,
                    description: isSpotify ? null : searchRes[0].description,
                    duration: `${searchRes[0].durationRaw}`,
                    url: `${isSpotify ? spotifyObj.url : searchRes[0].url}`,
                    metadata: options.metadata
                }
            }
        }
        return returnData
    }
    /**
     * Get the queue from a discord.js guild
     * @param {string} guildId The id of the guild your queue is registered with
     * @returns {object} your queue
     */
    async getQueue(guildId) {
        if(!guildId) throw new Error('Dismusic Error: A valid discord guild must be provided')
        // this.queue[`${guildId}`] = {
        //     songs: [],
        //     guild: guildId,
        //     song: 0
        // }
        const returnData = {
            skip: async () => {
                const songArr = this.songs[guildId]
                songArr.splice(0, 1)
                const newSong = songArr[0]
                const spotifySongPattern = /^((https:)?\/\/)?open.spotify.com\/(track)\//;
                let isSpotifyURL, spotifyObj, searchSong
                if(String(newSong.url).match(spotifySongPattern)) {
                    isSpotifyURL = true
                    if(play.is_expired()) await play.refreshToken()
                    const spotifyData = await play.spotify(newSong.url)
                    spotifyObj = {
                        name: spotifyData.name,
                        artist: spotifyData.artists[0].name,
                        url: spotifyData.url
                    }
                    searchSong = `${spotifyObj.name} ${spotifyObj.artist} audio`
                } else {
                    isSpotifyURL = false
                    searchSong = newSong.title
                }
                const search = await play.search(searchSong, {
                    limit: 1
                })
                const stream = await play.stream(search[0].url)
                this.audioResources[guildId] = createAudioResource(stream.stream, {
                    inputType: stream.type,
                    inlineVolume: true
                })
                this.audioPlayers[guildId].play(this.audioPlayers[guildId])
                this.emit('trackStart', newSong, this.queueData[guildId])
            },
            pause: async () => {
                this.audioPlayers[guildId].pause()
                this.queue[guildId].isPaused = true
            },
            resume: async () => {
                this.audioPlayers[guildId].unpause()
                this.queue[guildId].isPaused = false
            },
            isPaused: this.queue[guildId].isPaused || false,
            connect: async (channel) => {
                if(!channel) throw new Error('Dismusic Error: A Discord voice channel must be provided')
                const connection = joinVoiceChannel({
                    channelId: channel.id,
                    guildId: channel.guild.id,
                    adapterCreator: channel.guild.voiceAdapterCreator
                })
                return connection
            },
            stop: async () => {
                const connection = getVoiceConnection(guildId)
                this.queue[`${guildId}`] = null
                this.audioPlayers[guildId].stop()
                connection.destroy()
            },
            playSong: async (song, options) =>  {
                if(!song) throw new Error('Dismusic Error: You cannot play a song without the song parameter')
                if(!options.metadata) throw new Error('Dismusic Error: You must have a metadata for the song')
                let searchSong;
                let isSpotify;
                let spotifyObj;
                const isYoutubeUrl = String(song).match(youtubeVideoPattern)
                if(String(song).includes('https://open.spotify.com/track/')) {
                    isSpotify = true
                    if(play.is_expired()) await play.refreshToken()
                    const spotifyData = await play.spotify(String(song))
                    spotifyObj  = {
                        name: spotifyData.name,
                        artist: spotifyData.artists[0].name || null,
                        url: spotifyData.url
                    }
                    searchSong = `${spotifyObj.name} ${spotifyObj.artist} audio`
                } else {
                    isSpotify = false
                    searchSong = song
                }
                const searchRes = await play.search(searchSong, {
                    limit: 1
                })
                const stream = await play.stream(isYoutubeUrl ? searchSong : searchRes[0].url)

                this.audioResources[guildId] = createAudioResource(stream.stream, {
                    inputType: stream.type,
                    inlineVolume: true
                })

                this.audioPlayers[guildId] = createAudioPlayer({
                    behaviors: {
                        noSubscriber: NoSubscriberBehavior.Play
                    }
                })

                const connection = getVoiceConnection(guildId)

                this.audioPlayers[guildId].play(this.audioResources[guildId])

                connection.subscribe(this.audioPlayers[guildId])
                this.audioPlayers[guildId].on('stateChange', async (_oldState, newState) => {
                    if(newState.status === 'idle') {
                        try {
                            const songArray = this.songs[guildId]
                            songArray.splice(0, 1)
                            songArray[0].title
                            let stream;
                            const spotifySongPattern = /^((https:)?\/\/)?open.spotify.com\/(track)\//;
                            let spotifyObj, searchSong
                            let isSpotifyURL;
                            if(String(songArray[0].url).match(spotifySongPattern)) {
                                isSpotifyURL = true
                                if(play.is_expired()) await play.refreshToken()
                                const spotifyData = await play.spotify(songArray[0].url)
                                spotifyObj  = {
                                    name: spotifyData.name,
                                    artist: spotifyData.artists[0].name || null,
                                    url: spotifyData.url
                                }
                                searchSong = `${spotifyObj.name} ${spotifyObj.artist} audio`
                            } else {
                                isSpotifyURL = false
                            }
                            if(isSpotify) {
                                const search = await play.search(String(searchSong))
                                stream = await play.stream(search[0].url)
                            } else {
                                stream = await play.stream(songArray[0].url)
                            }
                            
                            this.audioResources[guildId] = createAudioResource(stream.stream, {
                                inputType: stream.type,
                                inlineVolume: true
                            })
                            this.emit(`trackStart`, songArray[0], this.queueData[guildId])

                            this.audioPlayers[guildId].play(this.audioResources[guildId])
                        } catch (error) {
                            const metadata = this.queueData[guildId]
                            this.emit('queueEnded', metadata)
                            this.queue[`${guildId}`] = null
                            this.queueData[guildId] = null
                            this.songs[guildId] = null
                            this.audioPlayers[guildId].stop()
                            try {
                                return connection.destroy()
                            } catch {
                                /** do nothing (literally) */
                            }
                        }
                    }
                })
                if(spotifyObj) isSpotify = true
                this.songs[guildId] = [{
                    title: `${isSpotify ? spotifyObj.name : searchRes[0].title}`,
                    description: isSpotify ? undefined : searchRes[0].description,
                    duration: `${searchRes[0].durationRaw}`,
                    url: `${isSpotify ? spotifyObj.url : searchRes[0].url}`,
                    metadata: options.metadata
                }]
                return {
                    title: `${isSpotify ? spotifyObj.name : searchRes[0].title}`,
                    description: isSpotify ? undefined : searchRes[0].description,
                    duration: `${searchRes[0].durationRaw}`,
                    url: `${isSpotify ? spotifyObj.url : searchRes[0].url}`,
                    metadata: options.metadata
                }
            },
            songs: this.songs[guildId],
            addSong: async (song, options) => {
                if(!song) throw new Error('Dismusic Error: You cannot play a song without the song parameter')
                if(!options.metadata) throw new Error('Dismusic Error: You must have a metadata for the song')
                let isSpotify, spotifyObj, searchSong
                if(String(song).match(/(^(https:)\/\/open.spotify.com\/(track))/)) {
                    isSpotify = true
                    if(play.is_expired()) await play.refreshToken()
                    const spotifyData = await play.spotify(String(song))
                    spotifyObj  = {
                        name: spotifyData.name,
                        artist: spotifyData.artists[0].name || null,
                        url: spotifyData.url
                    }
                    searchSong = `${spotifyObj.name} ${spotifyObj.artist} audio`
                } else {
                    isSpotify = false
                    searchSong = song
                }
                const searchRes = await play.search(searchSong, {
                    limit: 1
                })
                this.songs[guildId].push({
                    title: `${isSpotify ? spotifyObj.name : searchRes[0].title}`,
                    description: isSpotify ? undefined : searchRes[0].description,
                    duration: `${searchRes[0].durationRaw}`,
                    url: `${isSpotify ? spotifyObj.url : searchRes[0].url}`,
                    metadata: options.metadata
                })
                return {
                    title: `${isSpotify ? spotifyObj.name : searchRes[0].title}`,
                    description: isSpotify ? undefined : searchRes[0].description,
                    duration: `${searchRes[0].durationRaw}`,
                    url: `${isSpotify ? spotifyObj.url : searchRes[0].url}`,
                    metadata: options.metadata
                }
            }
        }
        return returnData
    }
    async existQueue(guildId) {
        if(!guildId) throw new Error('Dismusic Error: A valid discord guild must be provided')
        if(this.queue[`${guildId}`] == null) return false
        return true
    }
    async setVolume(guildId, amount) {
        if(!guildId) throw new Error('Dismusic Error: A valid guild ID must be provided')
        if(!amount) throw new Error('Dismusic Error: Amount must be provided')
        if(!this.audioResources[guildId]) throw new Error('Dismusic Error: Could not find audio resources for this guild')
        if(Number(amount < 0) || Number(amount > 100)) throw new Error('Dismusic Error: Could not set the volume to lower than 0 or more than 100')
        this.audioResources[guildId].volume.setVolume(Number(amount))
    }
}

module.exports = Player