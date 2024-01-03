import { Game } from '@app/classes/game/game';
import { Player } from '@app/interfaces/player';
import { PlayerAnswers } from '@app/interfaces/player-answers';

/**
 * Interface to represent a match and
 * contains all the informations of
 * a match. This interface is implemented
 * by the class Match.
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
