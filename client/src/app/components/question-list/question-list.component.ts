import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Question } from '@app/classes/question/question';
import { ModifyQuestionComponent } from '@app/components/modify-question/modify-question.component';
import { DIALOG } from '@app/constants/constants';
import { QuestionService } from '@app/services/question-service/question.service';

/**
 * Manages the display of questions in the game form and the deletion and modification of each question
 *
 * @class QuestionListComponent
 */
@Component({
    selector: 'app-question-list',
    templateUrl: './question-list.component.html',
    styleUrls: ['./question-list.component.scss'],
})
export class QuestionListComponent {
    question: Question;
    constructor(
        public questionService: QuestionService,
        public dialog: MatDialog,
    ) {}

    onDrop(event: CdkDragDrop<string[]>): void {
        moveItemInArray(this.questionService.questions, event.previousIndex, event.currentIndex);
    }

    onDeleteQuestion(index: number): void {
        this.questionService.questions.splice(index, 1);
    }

    onModifyQuestion(i: number): void {
        this.dialog.open(ModifyQuestionComponent, {
            width: DIALOG.questionFormWidth,
            disableClose: true,
            data: {
                index: i,
            },
        });
    }
}
