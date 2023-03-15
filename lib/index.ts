import Player, { PlayerEvents, CreateQueueOptions, SearchOptions } from './classes/Core/Player';
import Track from './classes/Core/Track';
import { PlaylistOptions } from './classes/Core/Playlist';
import PlayDLExtractor from './classes/Extractors/Playdl';
import { StreamReturnData, QueueConstructorOptions } from './classes/Core/Queue';
import { getMain as getMainPlayer } from './classes/Managers/PlayerManager';

export {
    Player,
    Track,
    PlayDLExtractor,
    getMainPlayer,
    PlayerEvents,
    CreateQueueOptions,
    SearchOptions,
    PlaylistOptions,
    StreamReturnData, QueueConstructorOptions
};
