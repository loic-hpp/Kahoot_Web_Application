import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppMaterialModule } from '@app/modules/material.module';
import { QuestionEvaluationService } from '@app/services/question-evaluation/question-evaluation.service';
import { QrlEvaluationComponent } from './qrl-evaluation.component';

describe('QrlEvaluationComponent', () => {
    let component: QrlEvaluationComponent;
    let fixture: ComponentFixture<QrlEvaluationComponent>;
    let questionEvaluationServiceSpy: jasmine.SpyObj<QuestionEvaluationService>;

    beforeEach(() => {
        questionEvaluationServiceSpy = jasmine.createSpyObj('QuestionEvaluationService', [
            'setPlayerAnswer',
            'setCurrentNoteFactor',
            'updateScoreAfterQrlQuestion',
        ]);
        TestBed.configureTestingModule({
            declarations: [QrlEvaluationComponent],
            imports: [AppMaterialModule],
            providers: [{ provide: QuestionEvaluationService, useValue: questionEvaluationServiceSpy }],
        });
        fixture = TestBed.createComponent(QrlEvaluationComponent);
        component = fixture.componentInstance;
    });

    describe('creation', () => {
        beforeEach(() => {
            component.ngOnInit();
        });
        it('should create', () => {
            expect(component).toBeTruthy();
        });

        it('should call setPlayerAnswer', () => {
            expect(questionEvaluationServiceSpy.setPlayerAnswer).toHaveBeenCalled();
        });
    });

    describe('setNoteFactor', () => {
        it('should call setPlayerAnswer', () => {
            component.setNoteFactor();
            expect(questionEvaluationServiceSpy.setCurrentNoteFactor).toHaveBeenCalled();
            expect(questionEvaluationServiceSpy.updateScoreAfterQrlQuestion).toHaveBeenCalled();
        });
    });
});
