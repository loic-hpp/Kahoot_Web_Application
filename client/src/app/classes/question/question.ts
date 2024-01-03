import { Choice } from '@app/interfaces/choice';
import { IQuestion } from '@app/interfaces/i-question';

/**
 * This class allows to handle the logic associated to a question and also
 * to manage his data
 */
export class Question implements IQuestion {
    id: string = '';
    type: string = '';
    text: string = '';
    points: number = 0;
    choices: Choice[] = [];
    timeAllowed: number = 0;

    constructor(question?: IQuestion) {
        if (question) {
            this.id = question.id;
            this.type = question.type;
            this.text = question.text;
            this.points = question.points;
            this.choices = question.choices;
            this.timeAllowed = question.timeAllowed;
        }
    }

    getRightChoicesNumber(): number {
        let nRightChoices = 0;
        this.choices.forEach((choice) => {
            if (choice.isCorrect) {
                nRightChoices++;
            }
        });

        return nRightChoices;
    }
}
