import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Input, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Question } from '@app/classes/question/question';
import { CHOICES, DIALOG_MESSAGE, POINTS, QUESTION_TYPE, SNACKBAR_DURATION, SNACKBAR_MESSAGE } from '@app/constants/constants';
import { Choice } from '@app/interfaces/choice';
import { CancelConfirmationService } from '@app/services/cancel-confirmation/cancel-confirmation.service';

/**
 * Component that manages the question's creation and modification form
 *
 * @class QuestionFormComponent
 * @implements {OnInit}
 */
@Component({
    selector: 'app-question-form',
    templateUrl: './question-form.component.html',
    styleUrls: ['./question-form.component.scss'],
})
export class QuestionFormComponent implements OnInit {
    @Input() question: Question;
    thirdChoice: boolean;
    fourthChoice: boolean;
    questionTypes: string[];

    constructor(
        private confirmationService: CancelConfirmationService,
        private snackBar: MatSnackBar,
    ) {}

    ngOnInit(): void {
        this.questionTypes = [QUESTION_TYPE.qcm, QUESTION_TYPE.qrl];
        if (this.question.choices !== undefined) {
            this.thirdChoice = this.question.choices.length === 3;
            this.fourthChoice = this.question.choices.length === CHOICES.max;
        }
    }

    onAddChoices(): void {
        if (this.question.choices.length === 0) this.question.choices = [{ isCorrect: false } as Choice, { isCorrect: true } as Choice];
    }

    onNewChoice(): void {
        if (this.question.choices.length < CHOICES.max) {
            this.question.choices.push({ isCorrect: false } as Choice);
        }
    }

    onIncreasePoints(): void {
        if (this.question.points < POINTS.max) {
            this.question.points += POINTS.increment;
        }
    }

    onDecreasePoints(): void {
        if (this.question.points > POINTS.min) {
            this.question.points -= POINTS.increment;
        }
    }

    onDrop(event: CdkDragDrop<string[]>): void {
        moveItemInArray(this.question.choices, event.previousIndex, event.currentIndex);
    }

    onDeleteChoice(index: number): void {
        if (this.question.choices.length > 2) {
            this.confirmationService.askConfirmation(() => {
                this.question.choices.splice(index, 1);
            }, DIALOG_MESSAGE.cancelChoiceDeletion);
        } else this.showSnackbar(SNACKBAR_MESSAGE.minQuestionNumber);
    }

    maxChoicesReached(): boolean {
        return this.question.choices.length === CHOICES.max;
    }

    showSnackbar(message: string): void {
        this.snackBar.open(message, 'Fermer', {
            duration: SNACKBAR_DURATION,
        });
    }
}
