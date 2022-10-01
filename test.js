const { Player } = require('./index.js')
const player = new Player('indeed')

player.search('alan walker alone', 'SoundCloud').then((res) => {
    console.log(res)
})