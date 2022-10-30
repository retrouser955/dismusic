module.exports = {
    soundCloud: /(^(https:)\/\/(soundcloud.com)\/)/,
    spotify: /(^(https:)\/\/(open.spotify.com)\/(track)\/)/,
    youtube: /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/,
    spotifyPlaylist: /(^(https:)\/\/(open.spotify.com)\/(playlist)\/)/
}