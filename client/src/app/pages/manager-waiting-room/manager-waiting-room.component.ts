import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TransitionDialogComponent } from '@app/components/transition-dialog/transition-dialog.component';
import { DIALOG_MESSAGE, SocketsSendEvents, TRANSITIONS_DURATIONS, TRANSITIONS_MESSAGES } from '@app/constants/constants';
import { Room } from '@app/interfaces/room';
import { CancelConfirmationService } from '@app/services/cancel-confirmation/cancel-confirmation.service';
import { DialogTransitionService } from '@app/services/dialog-transition-service/dialog-transition.service';
import { ListenerManagerService } from '@app/services/listener-manager/listener-manager.service';
import { MatchPlayerService } from '@app/services/match-player-service/match-player.service';

/**
 * Manager waiting room component.
 * This component allows the manager to manage the waiting room before the game starts.
 * It provides features like locking/unlocking the room and starting the game.
 * It also listens for real-time updates through a WebSocket service.
 */
@Component({
    selector: 'app-manager-waiting-room',
    templateUrl: './manager-waiting-room.component.html',
    styleUrls: ['./manager-waiting-room.component.scss'],
})
export class ManagerWaitingRoomComponent implements OnInit, OnDestroy {
    waitingRoomIsLocked: boolean = false;
    accessCode: string = this.matchSrv.match.accessCode;
    nextQuestionButtonText = 'Prochaine question';
    dialogRef: MatDialogRef<TransitionDialogComponent>;

    // eslint-disable-next-line max-params
    constructor(
        public matchSrv: MatchPlayerService,
        public dialog: MatDialog,
        private listenerService: ListenerManagerService,
        private confirmationService: CancelConfirmationService,
        private dialogTransitionService: DialogTransitionService,
    ) {}

    ngOnInit(): void {
        this.connect();
        this.matchSrv.joinMatchRoom(this.accessCode);
        window.onbeforeunload = () => {
            this.cancelGameWithoutConfirmation();
        };
        window.onpopstate = () => {
            this.cancelGameWithoutConfirmation();
        };
    }

    ngOnDestroy(): void {
        window.onbeforeunload = () => {
            return;
        };
        window.onpopstate = () => {
            return;
        };
    }

    onLockWaitingRoom(): void {
        this.waitingRoomIsLocked = !this.waitingRoomIsLocked;
        this.matchSrv.setAccessibility().subscribe();
    }

    cancelGameWithoutConfirmation(): void {
        this.matchSrv.socketService.send<Room>(SocketsSendEvents.CancelGame, { id: this.accessCode });
        this.matchSrv.timeService.stopServerTimer(this.matchSrv.match.accessCode);
        this.matchSrv.cleanCurrentMatch();
        this.matchSrv.deleteMatchByAccessCode(this.matchSrv.match.accessCode).subscribe();
        this.matchSrv.router.navigateByUrl(`/create/preview/games/${this.matchSrv.match.game.id}`);
    }

    cancelGame(): void {
        this.confirmationService.askConfirmation(this.cancelGameWithoutConfirmation.bind(this), DIALOG_MESSAGE.cancelMatch);
    }

    onBeginMatch(): void {
        this.matchSrv.socketService.send<Room>(SocketsSendEvents.BeginMatch, { id: this.accessCode });
        this.dialogTransitionService.openTransitionDialog(TRANSITIONS_MESSAGES.beginMatch, TRANSITIONS_DURATIONS.startOfTheGame);
        this.matchSrv.timeService.startTimer(TRANSITIONS_DURATIONS.startOfTheGame, this.accessCode, () => {
            this.dialogTransitionService.closeTransitionDialog();
            this.matchSrv.router.navigateByUrl(`/play/manager/match/${this.matchSrv.match.game.id}`);
        });
    }

    connect(): void {
        if (!this.matchSrv.socketService.isSocketAlive()) {
            this.matchSrv.socketService.connect();
            this.setupListeners();
        }
    }

    setupListeners(): void {
        this.listenerService.setManagerWaitingRoomListeners();
    }
}
