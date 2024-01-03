import { Component, Input } from '@angular/core';
import { Question } from '@app/classes/question/question';

/**
 * Component that provides the question and its choices template for the manager
 *
 * @class QuestionDisplayComponent
 */
@Component({
    selector: 'app-question-display',
    templateUrl: './question-display.component.html',
    styleUrls: ['./question-display.component.scss'],
})
export class QuestionDisplayComponent {
    @Input() question: Question;
}
