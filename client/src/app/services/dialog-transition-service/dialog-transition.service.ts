import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TransitionDialogComponent } from '@app/components/transition-dialog/transition-dialog.component';
import { DIALOG } from '@app/constants/constants';

/** Service that manages the display of the transition dialog depending of the parameters provided by
 * components that need to make the transition
 * */
@Injectable({
    providedIn: 'root',
})
export class DialogTransitionService {
    dialogRef: MatDialogRef<TransitionDialogComponent>;
    constructor(public dialog: MatDialog) {}

    // eslint-disable-next-line max-params
    openTransitionDialog(
        transitionText: string,
        duration: number,
        dialogWidth: string = DIALOG.transitionWidth,
        dialogHight: string = DIALOG.transitionHeight,
    ): void {
        this.dialogRef = this.dialog.open(TransitionDialogComponent, {
            width: dialogWidth,
            height: dialogHight,
            disableClose: true,
            data: { transitionText, maxTime: duration },
        });
    }

    closeTransitionDialog(): void {
        this.dialogRef?.close();
    }
}
