import { Choice } from '@app/interfaces/choice';

/**
 * Class represent how question are stored in the server
 */
export class Question {
    id: string = '';
    type: string = '';
    text: string = '';
    points: number = 0;
    choices: Choice[] = [];
    timeAllowed: number = 0;

    constructor(question: Partial<Question> = {}) {
        this.id = question.id || '';
        this.type = question.type || '';
        this.text = question.text || '';
        this.points = question.points || 0;
        this.choices = question.choices || [];
        this.timeAllowed = question.timeAllowed || 0;
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
