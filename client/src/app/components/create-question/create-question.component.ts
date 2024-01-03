import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Question } from '@app/classes/question/question';
import { DIALOG_MESSAGE, POINTS } from '@app/constants/constants';
import { CancelConfirmationService } from '@app/services/cancel-confirmation/cancel-confirmation.service';
import { QuestionService } from '@app/services/question-service/question.service';

/**
 * Component that uses the question form to create a new question and
 * adds it to the questionService's questions list
 *
 * @class CreateQuestionComponent
 * @implements {OnInit}
 */
@Component({
    selector: 'app-create-question',
    templateUrl: './create-question.component.html',
    styleUrls: ['./create-question.component.scss'],
})
export class CreateQuestionComponent implements OnInit {
    question: Question;

    constructor(
        private questionService: QuestionService,
        private confirmationService: CancelConfirmationService,
        private dialogRef: MatDialogRef<CreateQuestionComponent>,
    ) {}

    onSaveQuestion(): void {
        if (this.questionService.addQuestion(this.question)) {
            this.dialogRef?.close();
        }
    }

    ngOnInit(): void {
        this.question = new Question({
            id: '',
            type: '',
            text: '',
            points: 0,
            choices: [],
            timeAllowed: 0,
        });
        this.question.points = POINTS.min;
    }

    onCancel(): void {
        this.confirmationService.askConfirmation(() => {
            if (this.confirmationService.userConfirmed) this.dialogRef.close();
        }, DIALOG_MESSAGE.cancelQuestion);
    }
}
