const regex = require('../constants/regex')

const fetch = require('isomorphic-unfetch')
const { getData: sp }= require('spotify-url-info')(fetch)
const play = require('play-dl')
const { createAudioResource } = require('@discordjs/voice')

const searchBasedOnRegexp = async (resource) => {
    if(regex.spotify.test(resource)) {
        let data
        try {
            data = await sp.getData(resource)
        } catch (error) {
            console.log('[ Dismusic Warning ] Could not get data from spotify-url-info. Falling back to play-dl')
            const details = await play.spotify(resource)
            const searchName = `${details.name} ${details.artists[0].name} Lyrics`
            const searchRes = await play.search(searchName, {
                source: {
                    youtube: 'video'
                }
            })
            const stream = await play.stream(searchRes[0].url)
            const audioRes = createAudioResource(stream)
            return audioRes
        }
        const searchName = `${data.name} ${String(data.owner.uri).replace('spotify:user:', '')} Lyrics`
        const searchRes = await play.search(searchName, {
            source: {
                youtube: 'video'
            }
        })
        const stream = await play.stream(searchRes[0].url)
        const audioRes = createAudioResource(stream)
        return audioRes
    }
    const stream = await play.stream(resource)
    const audioRes = createAudioResource(stream.stream)
    return audioRes
}
module.exports = searchBasedOnRegexp