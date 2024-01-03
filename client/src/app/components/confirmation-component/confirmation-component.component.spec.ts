import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CancelConfirmationService } from '@app/services/cancel-confirmation/cancel-confirmation.service';
import { ConfirmationComponentComponent } from './confirmation-component.component';

describe('ConfirmationComponentComponent', () => {
    let component: ConfirmationComponentComponent;
    let fixture: ComponentFixture<ConfirmationComponentComponent>;
    let spyCancelConfirmationService: jasmine.SpyObj<CancelConfirmationService>;
    let spyMatDialogRef: jasmine.SpyObj<MatDialogRef<ConfirmationComponentComponent>>;

    beforeEach(() => {
        spyCancelConfirmationService = jasmine.createSpyObj('CancelConfirmationService', ['userConfirmed', 'dialogMessage', 'dialogRef']);
        spyMatDialogRef = jasmine.createSpyObj('MatDialogRef<ConfirmationComponentComponent>', ['close']);
        TestBed.configureTestingModule({
            declarations: [ConfirmationComponentComponent],
            imports: [MatDialogModule],
            providers: [
                { provide: CancelConfirmationService, useValue: spyCancelConfirmationService },
                { provide: MatDialogRef, useValue: spyMatDialogRef },
            ],
        });
        fixture = TestBed.createComponent(ConfirmationComponentComponent);
        component = fixture.componentInstance;
        spyCancelConfirmationService.dialogRef = spyMatDialogRef;
        component.confirmationService = spyCancelConfirmationService;
        spyCancelConfirmationService.dialogMessage = 'test';
        fixture.detectChanges();
    });

    describe('creation', () => {
        it('should create', () => {
            expect(component).toBeTruthy();
        });
    });

    describe('cancel', () => {
        it('should create', () => {
            component.cancel();
            expect(spyCancelConfirmationService.dialogMessage).toEqual('');
            expect(spyCancelConfirmationService.userConfirmed).toBeFalsy();
            expect(spyMatDialogRef.close).toHaveBeenCalled();
        });
    });

    describe('confirm', () => {
        it('should create', () => {
            component.confirm();
            expect(spyCancelConfirmationService.dialogMessage).toEqual('');
            expect(spyCancelConfirmationService.userConfirmed).toBeTruthy();
            expect(spyMatDialogRef.close).toHaveBeenCalled();
        });
    });
});
