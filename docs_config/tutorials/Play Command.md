# Creating a play command with playlist support

First we need to register slash commands

```js
// play.js

const { SlashCommandBuilder } = require("discord.js")

module.exports = {
    name: "play",
    description: "Play in your voice channel",
    data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('plays in your voice channel')
        .addStringOption(option => 
            option.setName('query')
            .setDescription('The name/url of the song you want to play')
            .setRequired(true)),
}
```

Then we can integrate our code into this command

```js
// play.js

const { SlashCommandBuilder } = require("discord.js")

module.exports = {
    name: "play",
    description: "Play in your voice channel",
    data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('plays in your voice channel')
        .addStringOption(option => 
            option.setName('query')
            .setDescription('The name/url of the song you want to play')
            .setRequired(true)),
    async run(client, interaction) {
        const query = await interaction.options.getString('query')
        if(!interaction.member.voice.channelId) return interaction.reply({ ephemeral: true, content: '❌ You have to be in a voice channel' })
        const me = interaction.guild.members.me
        if(me.voice.channelId != undefined && interaction.member.voice.channelId !== me.voice.channelId) return interaction.reply({ ephemeral: true, content: '❌ You must be in my voice channel' })

        const doesQueueExist = client.player.existsQueue(interaction.guild)

        await interaction.deferReply()

        const searchRes = await client.player.search(query)

        if(searchRes.length === 0) return interaction.followUp({ content: `Could not find any results for ${query}`})

        if(doesQueueExist) {
            const queue = await client.player.getQueue(interaction.guild)

            if(!queue.connection) await queue.connectTo(interaction.member.voice.channel)

            // searchRes.tracks represent if the search results is a playlist or not

            if(searchRes?.tracks) {
                const message = await interaction.followUp({ content: `Loading playlist ${searchRes.name}`, fetchReply: true })
                await queue.addTracks(searchRes.tracks)
                return message.edit(`Successfully added ${searchRes.tracks.length} tracks from ${searchRes.name}`)
            }

            const message = await interaction.followUp({ content: `Loading Track ${searchRes[0].name} from ${searchRes[0].source}`, fetchReply: true })

            await queue.addTrack(searchRes[0])
            return message.edit({ content: `Successfully added Track ${searchRes[0].name} from ${searchRes[0].source}` })
        }

        const queue = await client.player.createQueue(interaction.guild, {
            metadata: {
                channel: interaction.channel
            }
        })

        if(!queue.connection) await queue.connectTo(interaction.member.voice.channel)

        // If the queue is just getting created, we get the first track out of playlist and play it, then we add the rest of the tracks to the queue

        if(searchRes?.tracks) {
            const message = await interaction.followUp({ content: `Loading playlist ${searchRes.name}`, fetchReply: true })
            const tracks = searchRes.tracks
            const firstTrack = tracks.splice(0, 1)
            await queue.play(firstTrack[0])
            await queue.addTracks(tracks)
            return message.edit(`Successfully added ${searchRes.tracks.length + 1} tracks from ${searchRes.name}`)
        }

        const message = await interaction.followUp({ content: `Loading Track ${searchRes[0].name} from ${searchRes[0].source}`, fetchReply: true })
        await queue.play(searchRes[0])
        return message.edit({ content: `Successfully added Track ${searchRes[0].name} from ${searchRes[0].source}` })
    }
}
```