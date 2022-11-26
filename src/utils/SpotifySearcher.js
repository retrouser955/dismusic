const googleIt = require('google-it')

class SpotifySearcher {
    constructor(dismusicPlayer) {
        this.dismusicPlayer = dismusicPlayer;
    }

    async search(query) {
        const spotifyRes = await googleIt({
            query: `${query} spotify`,
            "no-display": true
        })
        const results = spotifyRes.filter(function (result) {
            return String(result.link).includes('https://spotify.com/track') && !String(result.link).includes('?')
        })
        const mapped = results.map(function (result) {
            return result.link
        })
        return mapped
    }
}

module.exports = SpotifySearcher