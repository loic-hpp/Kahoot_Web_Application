import { Choice } from '@app/interfaces/choice';

/**
 * Interface to represent a question and
 * contains all the informations of
 * a question. This interface is implemented
 * by the class Question.
 */
export interface IQuestion {
    id: string;
    type: string;
    text: string;
    points: number;
    choices: Choice[];
    timeAllowed: number;
}
