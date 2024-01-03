import { PlayerAnswers } from '@app/classes/player-answers/player-answers';
import { Game } from '@app/model/database/game';
import { Player } from './player';

/**
 * Interface of all attribute of a game mostly use the create a game
 */
export interface IMatch {
    game: Game;
    begin: string;
    end: string;
    bestScore: number;
    accessCode: string;
    testing: boolean;
    players: Player[];
    managerName: string;
    isAccessible: boolean;
    bannedNames: string[];
    playerAnswers: PlayerAnswers[];
    panicMode: boolean;
    timer: number;
    timing: boolean;
}
