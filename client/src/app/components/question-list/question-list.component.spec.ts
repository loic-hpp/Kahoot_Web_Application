import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Question } from '@app/classes/question/question';
import { QUESTIONS } from '@app/data/data';
import { AppMaterialModule } from '@app/modules/material.module';
import { QuestionService } from '@app/services/question-service/question.service';
import { QuestionListComponent } from './question-list.component';

describe('QuestionComponent', () => {
    let component: QuestionListComponent;
    let fixture: ComponentFixture<QuestionListComponent>;
    let questionServiceSpy: jasmine.SpyObj<QuestionService>;
    let matDialogSpy: jasmine.SpyObj<MatDialog>;
    const mockQuestions = QUESTIONS.map((obj) => ({ ...obj }));

    beforeEach(() => {
        questionServiceSpy = jasmine.createSpyObj('QuestionService', ['questions']);
        matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        TestBed.configureTestingModule({
            declarations: [QuestionListComponent],
            imports: [AppMaterialModule],
            providers: [
                { provide: QuestionService, useValue: questionServiceSpy },
                { provide: MatDialog, useValue: matDialogSpy },
            ],
        });
        fixture = TestBed.createComponent(QuestionListComponent);
        component = fixture.componentInstance;
        questionServiceSpy.questions = mockQuestions as Question[];
    });

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('should remove question from questionService.questions onDeleteQuestion', () => {
        const initialLength = QUESTIONS.length;
        component.onDeleteQuestion(0);
        expect(questionServiceSpy.questions.length).toEqual(initialLength - 1);
    });

    it('should call matDialogSpy.open onModifyQuestion', () => {
        component.onModifyQuestion(0);
        expect(matDialogSpy.open).toHaveBeenCalled();
    });

    it('should moveItemInArray onDrop', async () => {
        const testQuestion = questionServiceSpy.questions[0];
        const event: CdkDragDrop<string[]> = {
            previousIndex: 0,
            currentIndex: 1,
            item: {
                data: testQuestion,
            } as unknown as CdkDrag<string[]>,
            container: { data: questionServiceSpy.questions } as unknown as CdkDropList<string[]>,
            previousContainer: null as unknown as CdkDropList<string[]>,
            isPointerOverContainer: true,
            distance: { x: 0, y: 0 },
            dropPoint: { x: 0, y: 0 },
            event: new MouseEvent('mockMouseEvent'),
        };
        component.onDrop(event);
        expect(questionServiceSpy.questions[1]).toEqual(testQuestion);
    });
});
