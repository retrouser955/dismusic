const {
    Client,
    GatewayIntentBits: Intents,
    Partials
} = require('discord.js')
const client = new Client(
    {
        intents: [Intents.Guilds, Intents.GuildVoiceStates, Intents.MessageContent, Intents.GuildMessages],
        partials: [Partials.Message]
    }
)
process.on('uncaughtException', console.error)
const { Player }= require('./index.js')
client.player = new Player(client, {
    spotify: {
        client_id: 'token',
        client_secret: 'token',
        token: "token",
        market: 'US'
    }
})

client.player.on('trackStart', async (song, queueData) => {
    queueData.metaChannel.send(`Started playing track ${song.title}\n\nDuration: \`${song.duration}\`\nURL: ${song.url}\nrequestedBy: ${song.metadata.requestedBy.tag}`)
})
.on('queueEnded', (queueData) => {
    queueData.metaChannel.send(`There are no more songs in the queue. Leaving 👋`)
})
client.on('messageCreate', async (message) => {
    if(!message.content.startsWith('!')) return
    if(message.content.startsWith('!play ')) {
        const args = message.content.replace('!play ', '')
        const existQueue = await client.player.existQueue(message.guildId)
        if(existQueue) {
            const existingQueue = await client.player.getQueue(message.guildId)
            message.channel.send(`🔍 | Searching for ${args}`).then(async msg => {
                const song = await existingQueue.addSong(args, {
                    metadata: {
                        requestedBy: message.author
                    }
                })
                msg.edit(`Added ${song.title} to the queue\n\nDuration: \`${song.duration}\`\nURL: ${song.url}`)
            })
            return
        }
        const queue = await client.player.createQueue(message.guildId, {
            queueData: {
                metaChannel: message.channel
            }
        })
        try {
            queue.connect(message.member.voice.channel)
        } catch {
            return message.channel.send('there was an error while connecting to your voice channel')
        }
        const song = await queue.playSong(args, {
            metadata: {
                requestedBy: message.author
            }
        })
        message.channel.send(`Joined <#${message.member.voice.channelId}> and started playing ${song.title}\n\nDuration: \`${song.duration}\`\nURL: ${song.url}`)
    } else if (message.content === '!stop') {
        const queue = await client.player.getQueue(message.guildId)
        queue.stop()
    } else if (message.content === '!queue') {
        const queue = await client.player.getQueue(message.guildId)
        const queueSongs = []
        for(const songs of queue.songs) {
            queueSongs.push(`${songs.title} ([link](${songs.url}))`)
        }
        message.channel.send({
            embeds: [{
                title: 'Queue',
                description: queueSongs.join('\n')
            }]
        })
    } else if (message.content === '!pause') {
        const queue = await client.player.getQueue(message.guildId)
        queue.pause()
    } else if (message.content === '!resume') {
        const queue = await client.player.getQueue(message.guildId)
        queue.resume()
    } else if (message.content === '!skip') {
        const queue = await client.player.getQueue(message.guildId)
        message.channel.send(`Skipping ${queue.songs[0].title}`)
        queue.skip()
    }
    else if (message.content.startsWith('!volume ')) {
        const newMsgContent = message.content.replace('!volume ', '')
        const queue = await client.player.getQueue(message.guildId)
        queue.setVolume(newMsgContent)
    }
    else if (message.content.startsWith('!nowplaying')) {
        const queue = await client.player.getQueue(message.guildId)
        const np = await queue.nowPlaying.getCurrent()
        console.log(np)
    } else if(message.content.startsWith('!playlist')) {
        const queue = await client.player.getQueue(message.guildId)
        const query = message.content.replace('!playlist ', '')
        const playlist = await client.player.getPlaylist(query)
        for(const key of playlist.tracks) {
            queue.addSong(key.url, {
                metadata: {
                    requestedBy: message.author
                }
            })
        }
    }
})
.on('ready', () => {
    client.player.getPlaylist('https://open.spotify.com/playlist/2Lr6wxuvlw98WuWeHnDnQ2?si=904dd5fb38cf49ab').then((list) => {
        console.log(list)
    })
    console.log(`Logged in as ${client.user.tag}`)
})
client.login(`token`)