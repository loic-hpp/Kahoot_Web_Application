import { Component, OnDestroy, OnInit } from '@angular/core';
import { Match } from '@app/classes/match/match';
import { DIALOG_MESSAGE, SocketsOnEvents, SocketsSendEvents, TRANSITIONS_DURATIONS, TRANSITIONS_MESSAGES } from '@app/constants/constants';
import { PlayerRequest } from '@app/interfaces/player-request';
import { CancelConfirmationService } from '@app/services/cancel-confirmation/cancel-confirmation.service';
import { DialogTransitionService } from '@app/services/dialog-transition-service/dialog-transition.service';
import { JoinMatchService } from '@app/services/join-match/join-match.service';
import { ListenerManagerService } from '@app/services/listener-manager/listener-manager.service';
import { MatchPlayerService } from '@app/services/match-player-service/match-player.service';

/**
 * Player waiting room component.
 * This component allows players to join the waiting room using an access code.
 * It displays the list of present players and allows the player to leave the room.
 * It also listens for real-time updates through a WebSocket service.
 */

@Component({
    selector: 'app-waiting-room',
    templateUrl: './waiting-room.component.html',
    styleUrls: ['./waiting-room.component.scss'],
})
export class WaitingRoomComponent implements OnInit, OnDestroy {
    waitingRoomIsLocked: boolean = true;

    // eslint-disable-next-line max-params
    constructor(
        public matchSrv: MatchPlayerService,
        public confirmationService: CancelConfirmationService,
        private joinMatchService: JoinMatchService,
        private listenerService: ListenerManagerService,
        private transitionDialogService: DialogTransitionService,
    ) {}

    ngOnInit(): void {
        this.connect();
        this.joinMatchService.joinMatchRoom();
        this.matchSrv.player = {
            name: this.joinMatchService.playerName,
            isActive: true,
            score: 0,
            nBonusObtained: 0,
            chatBlocked: false,
        };
        this.matchSrv.setupListenersPLayerView();
        window.onbeforeunload = () => {
            this.abandonGameWithoutConfirmation();
        };
        window.onpopstate = () => {
            this.abandonGameWithoutConfirmation();
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

    abandonGameWithoutConfirmation(): void {
        this.matchSrv.socketService.send<PlayerRequest>(SocketsSendEvents.RemovePlayer, {
            roomId: this.joinMatchService.accessCode,
            name: this.matchSrv.player.name,
            hasPlayerLeft: true,
        });
    }

    abandonGame(): void {
        this.confirmationService.askConfirmation(this.abandonGameWithoutConfirmation.bind(this), DIALOG_MESSAGE.quitMatch);
    }

    connect(): void {
        if (!this.matchSrv.socketService.isSocketAlive()) {
            this.matchSrv.socketService.connect();
            this.setupListeners();
        }
    }

    setMatchInformations(match: Match): void {
        this.matchSrv.setCurrentMatch(Match.parseMatch(match), {
            name: this.matchSrv.player.name,
            isActive: true,
            score: 0,
            nBonusObtained: 0,
            chatBlocked: false,
        });
        this.matchSrv.match.players = match.players;
        this.matchSrv.initializeScore();
    }

    setTransitionToMatchView(): void {
        this.transitionDialogService.openTransitionDialog(TRANSITIONS_MESSAGES.beginMatch, TRANSITIONS_DURATIONS.startOfTheGame);
        this.matchSrv.timeService.startTimer(TRANSITIONS_DURATIONS.startOfTheGame, this.matchSrv.match.accessCode, () => {
            this.transitionDialogService.closeTransitionDialog();
            this.matchSrv.router.navigateByUrl(`/play/match/${this.matchSrv.match.game.id}`);
        });
    }

    quitCanceledGame(): void {
        this.matchSrv.timeService.joinMatchService.accessCode = '';
        this.matchSrv.timeService.joinMatchService.playerName = '';
        this.confirmationService.dialogRef?.close();
        window.alert("La partie a été annulé par l'organisateur");
        this.transitionDialogService.closeTransitionDialog();
        this.matchSrv.socketService.disconnect();
        this.matchSrv.router.navigateByUrl('/home');
    }

    setupListeners(): void {
        this.listenerService.setWaitingRoomListeners();
        this.matchSrv.socketService.on<Match>(SocketsOnEvents.JoinBegunMatch, (match: Match) => {
            this.setMatchInformations(match);
            this.setTransitionToMatchView();
        });

        this.matchSrv.socketService.on<void>(SocketsOnEvents.GameCanceled, () => {
            this.quitCanceledGame();
        });
    }
}
