module.exports = {
    Player: require('./src/main'),
    version: require('./package.json').version,
    QueueRepeatMode: require("./RepeatMode.js"),
    RadioClient: require('./src/radio.js')
}