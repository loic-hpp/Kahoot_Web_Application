import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TimeService } from '@app/services/time-service/time.service';

/**
 * Component that provides the template for transition dialogs :
 * Used when the manager starts the match and after showing each question results
 *
 * @class TransitionDialogComponent
 */
@Component({
    selector: 'app-transition-dialog',
    templateUrl: './transition-dialog.component.html',
    styleUrls: ['./transition-dialog.component.scss'],
})
export class TransitionDialogComponent {
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { transitionText: string; maxTime: number },
        public timeService: TimeService,
    ) {}
}
