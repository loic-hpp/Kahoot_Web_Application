import { Component, OnInit } from '@angular/core';
import { QuestionEvaluationService } from '@app/services/question-evaluation/question-evaluation.service';
/**
 * Component that manages the evaluation of a QRL question.
 * It displays the answer to the manager and allows him/her to evaluate it with three note possibilities : 0%, 50% or 100%
 */
@Component({
    selector: 'app-qrl-evaluation',
    templateUrl: './qrl-evaluation.component.html',
    styleUrls: ['./qrl-evaluation.component.scss'],
})
export class QrlEvaluationComponent implements OnInit {
    note: string;

    constructor(public questionEvaluationService: QuestionEvaluationService) {}

    ngOnInit(): void {
        this.questionEvaluationService.setPlayerAnswer();
    }

    setNoteFactor(): void {
        this.questionEvaluationService.setCurrentNoteFactor(Number(this.note));
        this.questionEvaluationService.updateScoreAfterQrlQuestion();
    }
}
