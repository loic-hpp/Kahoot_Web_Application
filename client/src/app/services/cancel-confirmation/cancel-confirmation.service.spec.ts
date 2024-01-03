import { TestBed } from '@angular/core/testing';

import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CancelConfirmationService } from './cancel-confirmation.service';
import { ConfirmationComponentComponent } from '@app/components/confirmation-component/confirmation-component.component';
import { DIALOG } from '@app/constants/constants';
import { of } from 'rxjs';

describe('CancelConfirmationService', () => {
    let service: CancelConfirmationService;
    let matDialogSpy: jasmine.SpyObj<MatDialog>;
    let matDialogRefSpy: jasmine.SpyObj<MatDialogRef<ConfirmationComponentComponent>>;

    beforeEach(() => {
        matDialogSpy = jasmine.createSpyObj('MatDialog', ['open', 'close']);
        matDialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        TestBed.configureTestingModule({
            imports: [MatDialogModule],
            providers: [
                { provide: MatDialog, useValue: matDialogSpy },
                { provide: MatDialogRef, useValue: matDialogRefSpy },
            ],
        });
        service = TestBed.inject(CancelConfirmationService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
    it('askConfirmation should call the callback when the dialog is closed', () => {
        const actionSpy = jasmine.createSpy('action');
        const dialogRefMock = {
            afterClosed: () => of(true),
            close: () => true,
            componentInstance: new ConfirmationComponentComponent(),
        } as unknown as MatDialogRef<ConfirmationComponentComponent>;
        matDialogSpy.open.and.returnValue(dialogRefMock);

        const config = {
            width: DIALOG.confirmationWidth,
            height: DIALOG.confirmationHeight,
            disableClose: true,
        };
        service.askConfirmation(actionSpy);
        expect(matDialogSpy.open).toHaveBeenCalledWith(ConfirmationComponentComponent, config);
        expect(actionSpy).not.toHaveBeenCalled();

        service.userConfirmed = true;
        service.askConfirmation(actionSpy);
        expect(matDialogSpy.open).toHaveBeenCalledWith(ConfirmationComponentComponent, config);
        expect(actionSpy).toHaveBeenCalled();
    });
});
