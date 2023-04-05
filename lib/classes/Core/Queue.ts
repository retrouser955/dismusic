import PlayDLExtractor from '../Extractors/Playdl';
import Track from '../Structures/Track';
import { Guild, VoiceChannel } from 'discord.js';
import Player from './Player';
import {
  AudioPlayer,
  AudioPlayerState,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  NoSubscriberBehavior,
  StreamType,
  VoiceConnection,
  AudioPlayerStatus,
  AudioResource,
} from '@discordjs/voice';
import { Readable } from 'stream';
import TrackManager from '../Managers/TrackManager';

export interface StreamReturnData {
  stream: Readable | string;
  type: StreamType;
}

export interface QueueConstructorOptions {
  extractor?: object;
  metadata?: any;
  playerInstance: Player;
}

class Queue {
  guild: Guild;
  extractor: any;
  playerInstance: Player;
  tracks: TrackManager = new TrackManager(this);
  player: AudioPlayer;
  metadata: any;
  private isFirstPlay: boolean = true;
  connection: VoiceConnection | undefined;
  private timestamp = 0
  isPaused = true
  private resource!: AudioResource

  constructor(guild: Guild, options: QueueConstructorOptions) {
    this.guild = guild;
    this.extractor = options.extractor ?? new PlayDLExtractor();
    this.playerInstance = options.playerInstance;
    this.player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Play,
      },
    });
  }

  addTrack(track: Track|Array<Track>): void {
    if(Array.isArray(track)) return this.tracks.addMultiple(track)

    this.tracks.set(track);
  }

  connect(voiceChannel: VoiceChannel): VoiceConnection {
    const connection = joinVoiceChannel({
      guildId: voiceChannel.guildId,
      channelId: voiceChannel.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    this.connection = connection;

    return connection;
  }

  async play(track?: Track): Promise<void> {
    const isTrackUsable = track instanceof Track;

    if (this.isFirstPlay) {
      this.initializePlayer();
      this.isFirstPlay = false;
    }

    if (isTrackUsable) {
      const { stream, type } = await this.stream(track);

      const resource = createAudioResource(stream, {
        inputType: type,
      });

      this.tracks.addFirst(track);

      this.player.play(resource);

      this.resource = resource

      return
    }

    if(this.tracks.length === 0) throw new Error("Dismusic Queue Error: Unable to play something without nothing in the queue")

    if(this.isPaused) {
      let isPlayerUnPaused = this.player.unpause()
      if(!isPlayerUnPaused) process.emitWarning("Unable to resume the audio player")
      this.isPaused = isPlayerUnPaused

      return
    }

    const currentTrack = this.tracks.get(0) as Track

    const str = await this.stream(currentTrack)
    const stream = str.stream as Readable
    const type = str.type
    
    const resource = createAudioResource(stream, {
      inputType: type
    })

    this.player.play(resource)

    this.resource = resource
  }

  pause() {
    if(this.isPaused) return

    this.player.pause()
  }

  private async stream(track: Track): Promise<StreamReturnData> {
    const stream = await this.extractor?.stream(track, track.source);

    return stream;
  }

  private async initializePlayer(): Promise<void> {
    this.player.on('stateChange', this.playerStateChangeHandler);
  }

  private playerStateChangeHandler(_oldState: AudioPlayerState, newState: AudioPlayerState): void {
    const status: string = newState.status;

    if (status === 'idle') {
      if (this.tracks.length <= 0) {
        this.playerInstance.emit('queueEnd', this);

        const playerInstance = this.playerInstance;

        playerInstance.queues.delete(this.guild.id);
      } else {
        const removedTrack = this.tracks.delete()

        const first = this.tracks.get(0) as Track

        this.stream(first).then((stream) => {
          this.resource = createAudioResource(stream.stream, {
            inputType: stream.type
          })
  
          this.playerInstance.emit("trackStart", first, this, removedTrack)
        }).catch((err) => { throw new Error(`Error: Unknown Error\n${err}`) })
      }
    }
  }

  kill(force?: boolean): void {
    this.removeAllListeners();

    if (this.player.state.status !== AudioPlayerStatus.Idle) {
      try {
        this.player.stop(force);
      } catch {
        process.emitWarning('AudioPlayer Warning', {
          code: 'Stopping audio player',
          detail: 'Could not forcefully stop the audio player',
        });
      }
    }

    this.playerInstance.queues.delete(this.guild.id)
  }

  private removeAllListeners() {
    this.player.off('stateChange', this.playerStateChangeHandler);
  }
}

export default Queue;
