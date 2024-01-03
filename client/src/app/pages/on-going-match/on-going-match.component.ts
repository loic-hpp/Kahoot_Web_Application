import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DIALOG_MESSAGE, DURATIONS, FEEDBACK_MESSAGES, SocketsOnEvents } from '@app/constants/constants';
import { ChatAccessibilityRequest } from '@app/interfaces/chat-accessibility-request';
import { CancelConfirmationService } from '@app/services/cancel-confirmation/cancel-confirmation.service';
import { ListenerManagerService } from '@app/services/listener-manager/listener-manager.service';
import { MatchPlayerService } from '@app/services/match-player-service/match-player.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-on-going-match',
    templateUrl: './on-going-match.component.html',
    styleUrls: ['./on-going-match.component.scss'],
})

/**
 * Component that includes all the elements on the player's match view :
 * current question, score, timer, and a chat zone.
 * The player can click on the button 'Abandonner' to quit the match
 */
export class OnGoingMatchComponent implements OnInit, OnDestroy {
    @Output() sendEvent: EventEmitter<void> = new EventEmitter<void>();
    @ViewChild('audioZone') audioZone: ElementRef;
    maxTime: number;
    matchFinishedSubscription: Subscription;
    isPanicMode: boolean;

    // eslint-disable-next-line max-params
    constructor(
        public matchSrv: MatchPlayerService,
        private listenerSrv: ListenerManagerService,
        private snackBar: MatSnackBar,
        private confirmationService: CancelConfirmationService,
    ) {}

    ngOnInit(): void {
        this.listenerSrv.histogramSrv.isShowingMatchResults = false;
        this.listenerSrv.histogramSrv.currentChartIndex = 0;
        this.isPanicMode = false;
        this.matchSrv.initializeQuestion();
        window.history.replaceState({}, '', '');
        this.maxTime = this.matchSrv.getMaxTime();
        this.matchFinishedSubscription = this.matchSrv.matchFinishedEventEmitter.subscribe(this.redirectToHome.bind(this));
        if (this.matchSrv.match.testing) {
            this.connect();
            this.matchSrv.joinMatchRoom(this.matchSrv.match.accessCode);
        }

        this.matchSrv.timeService.timer = this.maxTime;
        this.matchSrv.timeService.startTimer(this.maxTime, this.matchSrv.match.accessCode, this.onTimerFinish.bind(this));
        this.setUpListeners();
        window.onbeforeunload = () => {
            this.handleQuitMatchActionsWithoutConfirmation();
        };
        window.onpopstate = () => {
            this.handleQuitMatchActionsWithoutConfirmation();
        };

        this.matchSrv.hasQuestionEvaluationBegun = false;
    }

    setUpListeners(): void {
        this.listenerSrv.setOnGoingMatchListeners();
        this.setPanicMode();
        this.modifyChatAccessibility();
    }

    notifyChatBlocked(): void {
        const snackBarRef = this.snackBar.open(FEEDBACK_MESSAGES.chatBlocked);
        // eslint-disable-next-line no-underscore-dangle
        snackBarRef._dismissAfter(DURATIONS.notifyChatAccessibility);
    }

    notifyChatUnblocked(): void {
        const snackBarRef = this.snackBar.open(FEEDBACK_MESSAGES.chatUnblocked);
        // eslint-disable-next-line no-underscore-dangle
        snackBarRef._dismissAfter(DURATIONS.notifyChatAccessibility);
    }

    ngOnDestroy(): void {
        window.onbeforeunload = () => {
            return;
        };
        window.onpopstate = () => {
            return;
        };

        try {
            this.matchSrv.socketService.removeListener(SocketsOnEvents.FinalAnswerSet);
            this.matchSrv.socketService.removeListener(SocketsOnEvents.AllPlayersResponded);
            this.matchSrv.socketService.removeListener(SocketsOnEvents.PlayerDisabled);
            this.matchSrv.socketService.removeListener(SocketsOnEvents.HistogramTime);
        } catch (error) {
            window.alert(error);
        }
        this.matchSrv.timeService.stopServerTimer(this.matchSrv.match.accessCode, true);
    }

    onEnterKey(): void {
        this.sendEvent.emit();
    }

    getScore(): number {
        return this.matchSrv.player.score;
    }

    redirectToHome(): void {
        this.confirmationService.dialogRef?.close();
        this.matchSrv.router.navigateByUrl('/home');
    }

    onTimerFinish(): void {
        this.matchSrv.showResults();
    }

    handleQuitMatchActionsWithoutConfirmation(): void {
        this.matchSrv.quitMatch();
        this.listenerSrv.evaluationSrv.cleanServiceAttributes();
    }

    handleQuitMatchActions(): void {
        this.confirmationService.askConfirmation(this.handleQuitMatchActionsWithoutConfirmation.bind(this), DIALOG_MESSAGE.quitMatch);
    }

    restartAudio(): void {
        const audioElement = this.audioZone.nativeElement;
        if (audioElement) {
            audioElement.currentTime = 0;
            audioElement.play();
        }
    }

    modifyChatAccessibility(): void {
        this.matchSrv.socketService.on<ChatAccessibilityRequest>(SocketsOnEvents.ChatAccessibilityChanged, (data) => {
            this.matchSrv.match.players = data.players;
            if (this.matchSrv.player.name === data.name) {
                const playerUpdated = this.matchSrv.match.players.find((player) => player.name === data.name);
                if (playerUpdated) this.matchSrv.player = playerUpdated;
                if (this.matchSrv.player.chatBlocked) this.notifyChatBlocked();
                else this.notifyChatUnblocked();
            }
        });
    }

    private setPanicMode(): void {
        this.matchSrv.socketService.on<void>(SocketsOnEvents.PanicModeActivated, () => {
            this.isPanicMode = true;
        });
    }

    private connect(): void {
        if (!this.matchSrv.socketService.isSocketAlive()) {
            this.matchSrv.socketService.connect();
            this.listenerSrv.chatSrv.setupListeners();
        }
    }
}
