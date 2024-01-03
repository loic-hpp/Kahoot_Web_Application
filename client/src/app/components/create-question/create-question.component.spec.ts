import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { QuestionFormComponent } from '@app/components/question-form/question-form.component';
import { POINTS } from '@app/constants/constants';
import { AppMaterialModule } from '@app/modules/material.module';
import { CancelConfirmationService } from '@app/services/cancel-confirmation/cancel-confirmation.service';
import { QuestionService } from '@app/services/question-service/question.service';
import { CreateQuestionComponent } from './create-question.component';

describe('CreateQuestionComponent', () => {
    let component: CreateQuestionComponent;
    let fixture: ComponentFixture<CreateQuestionComponent>;
    let spyQuestionService: jasmine.SpyObj<QuestionService>;
    let spyMatDialogRef: jasmine.SpyObj<MatDialogRef<CreateQuestionComponent>>;
    let spyCancelConfirmationService: jasmine.SpyObj<CancelConfirmationService>;

    beforeEach(() => {
        spyQuestionService = jasmine.createSpyObj('QuestionServices', ['addQuestion']);
        spyMatDialogRef = jasmine.createSpyObj('MatDialogRef<CreateQuestionComponent>', ['close']);
        spyCancelConfirmationService = jasmine.createSpyObj('CancelConfirmationService', ['askConfirmation', 'userConfirmed']);

        TestBed.configureTestingModule({
            declarations: [CreateQuestionComponent, QuestionFormComponent],
            imports: [AppMaterialModule, FormsModule],
            providers: [
                { provide: MatDialogRef, useValue: spyMatDialogRef },
                { provide: QuestionService, useValue: spyQuestionService },
                { provide: CancelConfirmationService, useValue: spyCancelConfirmationService },
            ],
        });
        fixture = TestBed.createComponent(CreateQuestionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
        expect(component.question.points).toEqual(POINTS.min);
    });

    it('should call addQuestion when onSaveQuestion is called ', () => {
        spyQuestionService.addQuestion.and.returnValue(true);
        component.onSaveQuestion();

        expect(spyQuestionService.addQuestion).toHaveBeenCalledWith(component.question);
        expect(spyMatDialogRef.close).toHaveBeenCalled();
    });

    it('onCancel should call dialogRef.close if userConfirmed is true', () => {
        spyCancelConfirmationService.askConfirmation.and.callFake((action: () => void) => {
            action();
        });
        component.onCancel();
        expect(spyCancelConfirmationService.askConfirmation).toHaveBeenCalled();
        expect(spyMatDialogRef.close).toHaveBeenCalled();
    });
});
