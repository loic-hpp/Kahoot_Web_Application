import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Question } from '@app/classes/question/question';
import { DIALOG_MESSAGE } from '@app/constants/constants';
import { CancelConfirmationService } from '@app/services/cancel-confirmation/cancel-confirmation.service';
import { QuestionService } from '@app/services/question-service/question.service';

/**
 * Uses the question form to display the question's data that have to be modified, manages the
 * modification and update the questionService's questions list with the new question
 *
 * @class ModifyQuestionComponent
 * @implements {OnInit}
 */
@Component({
    selector: 'app-modify-question',
    templateUrl: './modify-question.component.html',
    styleUrls: ['./modify-question.component.scss'],
})
export class ModifyQuestionComponent implements OnInit {
    currentQuestion: Question;
    previousQuestion: Question;

    // eslint-disable-next-line max-params
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { index: number },
        private questionService: QuestionService,
        private dialogRef: MatDialogRef<ModifyQuestionComponent>,
        private confirmationService: CancelConfirmationService,
    ) {}

    ngOnInit(): void {
        this.currentQuestion = this.questionService.getQuestionByIndex(this.data.index);
        this.previousQuestion = JSON.parse(JSON.stringify(this.currentQuestion));
    }

    onSaveQuestion(): void {
        if (this.questionService.validateUpdatedQuestion(this.currentQuestion)) this.dialogRef?.close();
    }

    onCancelModification(): void {
        this.confirmationService.askConfirmation(() => {
            this.questionService.cancelQuestionModification(this.previousQuestion, this.data.index);
            this.dialogRef?.close();
        }, DIALOG_MESSAGE.cancelQuestionModification);
    }
}
