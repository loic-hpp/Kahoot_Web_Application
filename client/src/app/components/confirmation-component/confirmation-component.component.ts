import { Component, OnInit } from '@angular/core';
import { CancelConfirmationService } from '@app/services/cancel-confirmation/cancel-confirmation.service';

@Component({
    selector: 'app-confirmation-component',
    templateUrl: './confirmation-component.component.html',
    styleUrls: ['./confirmation-component.component.scss'],
})
/** Component used in a dialog with confirm and cancel buttons to confirm or
 * cancel some critical actions like abandon and quit match
 *
 * @class ConfirmationComponentComponent
 * @implements {OnInit}
 */
export class ConfirmationComponentComponent implements OnInit {
    confirmationService: CancelConfirmationService;

    ngOnInit(): void {
        if (this.confirmationService) {
            this.confirmationService.userConfirmed = false;
        }
    }

    cancel(): void {
        this.confirmationService.userConfirmed = false;
        this.confirmationService.dialogMessage = '';
        this.confirmationService.dialogRef?.close();
    }

    confirm(): void {
        this.confirmationService.userConfirmed = true;
        this.confirmationService.dialogMessage = '';
        this.confirmationService.dialogRef?.close();
    }
}
