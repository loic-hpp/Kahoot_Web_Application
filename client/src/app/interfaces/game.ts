import { Question } from '@app/classes/question/question';

/**
 * Interface to represent a game and
 * contains all the informations of
 * a game. This interface is implemented
 * by the class Game.
 */
export interface IGame {
    id: string;
    title: string;
    description: string;
    duration: number;
    lastModification: string;
    questions: Question[];
    isVisible: boolean;
}
