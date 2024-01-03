import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Question } from '@app/classes/question/question';
import { QuestionFormComponent } from '@app/components/question-form/question-form.component';
import { QUESTIONS } from '@app/data/data';
import { AppMaterialModule } from '@app/modules/material.module';
import { CancelConfirmationService } from '@app/services/cancel-confirmation/cancel-confirmation.service';
import { QuestionService } from '@app/services/question-service/question.service';
import { ModifyQuestionComponent } from './modify-question.component';

describe('ModifyQuestionComponent', () => {
    let component: ModifyQuestionComponent;
    let fixture: ComponentFixture<ModifyQuestionComponent>;
    let questionServiceSpy: jasmine.SpyObj<QuestionService>;
    let matDialogRefSpy: jasmine.SpyObj<MatDialogRef<ModifyQuestionComponent>>;
    let spyCancelConfirmationService: jasmine.SpyObj<CancelConfirmationService>;
    const mockQuestion = QUESTIONS.map((obj) => ({ ...obj }))[0];

    beforeEach(() => {
        questionServiceSpy = jasmine.createSpyObj('QuestionService', ['cancelQuestionModification', 'validateUpdatedQuestion', 'getQuestionByIndex']);
        matDialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
        spyCancelConfirmationService = jasmine.createSpyObj('CancelConfirmationService', ['askConfirmation']);
        TestBed.configureTestingModule({
            declarations: [ModifyQuestionComponent, QuestionFormComponent],
            imports: [AppMaterialModule, FormsModule],
            providers: [
                { provide: QuestionService, useValue: questionServiceSpy },
                { provide: MatDialogRef, useValue: matDialogRefSpy },
                { provide: CancelConfirmationService, useValue: spyCancelConfirmationService },
                { provide: MAT_DIALOG_DATA, useValue: { index: 42 } },
            ],
        });
        fixture = TestBed.createComponent(ModifyQuestionComponent);
        component = fixture.componentInstance;
        component.currentQuestion = mockQuestion as Question;
        component.previousQuestion = mockQuestion as Question;
        questionServiceSpy.getQuestionByIndex.and.returnValue(mockQuestion as Question);
        fixture.detectChanges();
    });

    describe('creation', () => {
        it('should create', () => {
            expect(component).toBeTruthy();
        });
    });

    describe('onSaveQuestion', () => {
        it('should call dialogRef.close if validateUpdatedQuestion returns true onSaveQuestion', () => {
            questionServiceSpy.validateUpdatedQuestion.and.returnValue(true);
            component.onSaveQuestion();
            expect(matDialogRefSpy.close).toHaveBeenCalled();
        });
    });

    describe('onCancelModification', () => {
        it('should call dialogRef.close and cancelQuestionModification onCancelModification', () => {
            spyCancelConfirmationService.askConfirmation.and.callFake((action: () => void) => {
                action();
            });
            component.onCancelModification();
            expect(spyCancelConfirmationService.askConfirmation).toHaveBeenCalled();
            expect(matDialogRefSpy.close).toHaveBeenCalled();
            expect(questionServiceSpy.cancelQuestionModification).toHaveBeenCalled();
        });
    });
});
