import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Question } from '@app/classes/question/question';
import { QUESTIONS } from '@app/data/data';
import { AppMaterialModule } from '@app/modules/material.module';
import { QuestionDisplayComponent } from './question-display.component';

describe('QuestionDisplayComponent', () => {
    let component: QuestionDisplayComponent;
    let fixture: ComponentFixture<QuestionDisplayComponent>;
    const mockQuestion = QUESTIONS.map((obj) => ({ ...obj }))[0];

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [QuestionDisplayComponent],
            imports: [AppMaterialModule],
        });
        fixture = TestBed.createComponent(QuestionDisplayComponent);
        component = fixture.componentInstance;
        component.question = mockQuestion as Question;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
