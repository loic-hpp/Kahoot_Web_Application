import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AppMaterialModule } from '@app/modules/material.module';
import { TransitionDialogComponent } from './transition-dialog.component';

describe('TransitionDialogComponent', () => {
    let component: TransitionDialogComponent;
    let fixture: ComponentFixture<TransitionDialogComponent>;
    let matDialogDataSpy: { transitionText: string; maxTime: number };

    beforeEach(() => {
        matDialogDataSpy = { transitionText: 'transitionText', maxTime: 1 };
        TestBed.configureTestingModule({
            declarations: [TransitionDialogComponent],
            imports: [HttpClientTestingModule, AppMaterialModule],
            providers: [{ provide: MAT_DIALOG_DATA, useValue: matDialogDataSpy }],
        });
        fixture = TestBed.createComponent(TransitionDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
