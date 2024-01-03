import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Question } from '@app/classes/question/question';
import {
    DIALOG,
    DIALOG_MESSAGE,
    MAX_PANIC_TIME_FOR,
    QUESTION_TYPE,
    SocketsOnEvents,
    SocketsSendEvents,
    TRANSITIONS_DURATIONS,
    TRANSITIONS_MESSAGES,
} from '@app/constants/constants';
import { PlayerAnswers } from '@app/interfaces/player-answers';
import { Room } from '@app/interfaces/room';
import { UpdateChartDataRequest } from '@app/interfaces/update-chart-data-request';
import { CancelConfirmationService } from '@app/services/cancel-confirmation/cancel-confirmation.service';
import { DialogTransitionService } from '@app/services/dialog-transition-service/dialog-transition.service';
import { ListenerManagerService } from '@app/services/listener-manager/listener-manager.service';
import { MatchCommunicationService } from '@app/services/match-communication/match-communication.service';
import { MatchPlayerService } from '@app/services/match-player-service/match-player.service';
import { Subject } from 'rxjs';

/**
 * Component that includes all the elements on the manager's match view :
 * current question,timer, player's list, histogram for current question's statistics and a chat zone.
 * It allows the manager to manage the match by deciding to send the next question to players and
 * navigate to the results view at the end of the match
 * The manager can click on the button 'Quitter' to finish the match
 */
@Component({
    selector: 'app-match-managers-side',
    templateUrl: './match-managers-side.component.html',
    styleUrls: ['./match-managers-side.component.scss'],
})
export class MatchManagersSideComponent implements OnInit, OnDestroy {
    @ViewChild('audioZone') audioZone: ElementRef;
    question: Question;
    maxTime: number;
    isLastQuestion: boolean = false;
    isPaused: boolean = false;
    wasMessageShowed: boolean = false;
    isPanicMode: boolean;
    allPlayersLeft: boolean = false;
    // eslint-disable-next-line max-params
    constructor(
        public matchService: MatchPlayerService,
        public listenerSrv: ListenerManagerService,
        private matchCommunicationService: MatchCommunicationService,
        private confirmationService: CancelConfirmationService,
        private dialogTransitionService: DialogTransitionService,
    ) {}

    ngOnInit(): void {
        this.listenerSrv.histogramSrv.isShowingMatchResults = false;
        this.listenerSrv.histogramSrv.currentChartIndex = 0;
        this.isPanicMode = false;
        this.newQuestion();
        this.connect();
        this.maxTime = this.matchService.getMaxTime();
        window.onbeforeunload = () => {
            this.finishMatchWithoutConfirmation();
        };
        window.onpopstate = () => {
            this.finishMatchWithoutConfirmation();
        };
        this.listenerSrv.evaluationSrv.setPlayersNamesList();

        if (this.listenerSrv.playerLeftEmitter.closed) {
            // Create a new instance of playerLeftEmitter in case we already unsubscribe
            this.listenerSrv.playerLeftEmitter = new Subject<void>();
        }
        this.listenerSrv.playerLeftEmitter.subscribe(() => {
            this.manageAllPlayersLeftCase();
        });
    }

    ngOnDestroy(): void {
        if (!this.listenerSrv.playerLeftEmitter.closed) {
            this.listenerSrv.playerLeftEmitter?.unsubscribe();
        }
        window.onbeforeunload = () => {
            return;
        };
        window.onpopstate = () => {
            return;
        };
    }

    newQuestion(): void {
        this.listenerSrv.histogramSrv.isShowingQuestionResults = false;
        this.listenerSrv.evaluationSrv.isEvaluatingQrlQuestions = false;
        this.isPanicMode = false;
        this.matchService.timeService.timer = this.matchService.match.game.duration;
        this.matchService.initializeQuestion();
        this.question = this.matchService.currentQuestion;
        this.maxTime = this.matchService.getMaxTime();
        this.matchService.timeService.startTimer(this.maxTime, this.matchService.match.accessCode, () => {
            if (this.matchService.currentQuestion.type === QUESTION_TYPE.qrl) this.evaluateQrlAnswers();
            else this.listenerSrv.histogramSrv.isShowingQuestionResults = true;
        });

        if (this.matchService.isCurrentQuestionTheLastOne()) {
            this.isLastQuestion = true;
        }
    }

    finishMatchWithoutConfirmation(): void {
        this.listenerSrv.histogramSrv.playersAnswered = [];
        this.listenerSrv.histogramSrv.playersWithFinalAnswers = [];
        this.listenerSrv.histogramSrv.quittedPlayers = [];
        this.matchService.socketService.send<Room>(SocketsSendEvents.FinishMatch, {
            id: this.matchService.match.accessCode,
        });
        this.matchService.timeService.stopServerTimer(this.matchService.match.accessCode);
        this.listenerSrv.evaluationSrv.cleanServiceAttributes();
        this.matchService.cleanCurrentMatch();
        this.matchService.deleteMatchByAccessCode(this.matchService.match.accessCode).subscribe();
        this.matchService.chatService.cleanMessages();
        this.matchService.router.navigateByUrl('/home');
    }

    finishMatch(): void {
        this.confirmationService.askConfirmation(this.finishMatchWithoutConfirmation.bind(this), DIALOG_MESSAGE.finishMatch);
    }

    connect(): void {
        if (!this.matchService.socketService.isSocketAlive()) {
            this.matchService.socketService.connect();
        }
        this.setupRealMatchListeners();
    }

    setupRealMatchListeners(): void {
        this.listenerSrv.setMatchManagerSideListeners();

        this.matchService.socketService.on<PlayerAnswers>(SocketsOnEvents.AllPlayersResponded, () => {
            if (!this.haveAllPlayersLeft()) {
                this.listenerSrv.histogramSrv.isShowingQuestionResults = true;
                if (this.matchService.currentQuestion.type === QUESTION_TYPE.qrl) {
                    this.listenerSrv.evaluationSrv.setQuestionPoints();
                    this.evaluateQrlAnswers();
                }
            }
        });
    }

    sendSwitchQuestion(): void {
        this.matchService.socketService.send<Room>(SocketsSendEvents.SwitchQuestion, {
            id: this.matchService.match.accessCode,
        });
    }

    sendPanicModeActivated(): void {
        this.matchService.socketService.send<Room>(SocketsSendEvents.PanicModeActivated, {
            id: this.matchService.match.accessCode,
        });
    }

    onNextQuestion(): void {
        this.matchService.socketService.send<UpdateChartDataRequest>(SocketsSendEvents.SendChartData, {
            matchAccessCode: this.matchService.match.accessCode,
            questionChartData: {
                labelList: this.listenerSrv.histogramSrv.labelList,
                chartData: this.listenerSrv.histogramSrv.chartData,
                chartColor: this.listenerSrv.histogramSrv.chartColor,
                xLineText: this.listenerSrv.histogramSrv.xLineText,
            },
        });
        this.listenerSrv.histogramSrv.isShowingMatchResults = this.matchService.isCurrentQuestionTheLastOne();
        this.listenerSrv.evaluationSrv.isEvaluatingQrlQuestions = false;
        this.isPaused = false;
        const transitionText = this.matchService.isCurrentQuestionTheLastOne()
            ? TRANSITIONS_MESSAGES.transitionToResultsView
            : TRANSITIONS_MESSAGES.transitionToNextQuestion;
        this.sendSwitchQuestion();
        this.matchService.hasQuestionEvaluationBegun = false;
        this.dialogTransitionService.openTransitionDialog(transitionText, TRANSITIONS_DURATIONS.betweenQuestions);
        this.matchService.timeService.startTimer(TRANSITIONS_DURATIONS.betweenQuestions, this.matchService.match.accessCode, () => {
            this.redirectToNextQuestion();
        });
    }

    timerPauseHandler(): void {
        if (this.isPaused) this.resumeTimer();
        else this.pauseTimer();
        this.isPaused = !this.isPaused;
    }

    startPanicModeTimer(): void {
        if (!this.isPaused) {
            this.isPanicMode = true;
            this.sendPanicModeActivated();
            this.matchService.timeService.startPanicModeTimer(this.matchService.match.accessCode);
        }
    }

    isPanicModeSettable(): boolean {
        if (this.matchService.currentQuestion.type === QUESTION_TYPE.qrl) return this.matchService.timeService.timer <= MAX_PANIC_TIME_FOR.qrl;
        else return this.matchService.timeService.timer <= MAX_PANIC_TIME_FOR.qcm;
    }

    redirectToNextQuestion(): void {
        this.dialogTransitionService.closeTransitionDialog();
        if (this.isLastQuestion) {
            this.listenerSrv.histogramSrv.isShowingQuestionResults = false;
            this.matchCommunicationService.saveMatchHistory(this.matchService.match.accessCode).subscribe();
            this.matchService.deleteMatchByAccessCode(this.matchService.match.accessCode).subscribe();
            this.matchService.router.navigateByUrl(`/play/result/${this.matchService.match.game.id}`);
        } else {
            this.matchService.sendNextQuestion();
            this.listenerSrv.histogramSrv.playersAnswered = [];
            this.listenerSrv.histogramSrv.playersWithFinalAnswers = [];
            this.newQuestion();
            if (this.listenerSrv.histogramSrv.chart && !this.listenerSrv.histogramSrv.isShowingQuestionResults) {
                this.listenerSrv.histogramSrv.chart.destroy();
            }
            this.listenerSrv.histogramSrv.createChart();
        }
    }

    evaluateQrlAnswers(): void {
        this.matchService.timeService.stopServerTimer(this.matchService.match.accessCode);
        this.listenerSrv.evaluationSrv.setPlayersNamesList();
        this.listenerSrv.evaluationSrv.isEvaluatingQrlQuestions = true;
        this.matchService.hasQuestionEvaluationBegun = true;
        this.matchService.socketService.send<Room>(SocketsSendEvents.BeginQrlEvaluation, {
            id: this.matchService.match.accessCode,
        });
    }

    isCurrentQuestionOfTypeQRL(): boolean {
        return this.matchService.currentQuestion.type === QUESTION_TYPE.qrl;
    }

    canMoveToNextQuestion(): boolean {
        const showingResults = this.listenerSrv.histogramSrv.isShowingQuestionResults;
        const isQRLQuestion = this.isCurrentQuestionOfTypeQRL();
        const isEvaluatingQRL = this.listenerSrv.evaluationSrv.isEvaluatingQrlQuestions;

        if (showingResults) {
            if (!isQRLQuestion || (isQRLQuestion && !isEvaluatingQRL)) {
                return true;
            }
        }

        return false;
    }

    restartAudio(): void {
        const audioElement = this.audioZone.nativeElement;
        if (audioElement) {
            audioElement.currentTime = 0;
            audioElement.play();
        }
    }

    manageAllPlayersLeftCase(): void {
        if (this.haveAllPlayersLeft()) {
            this.allPlayersLeft = true;
            this.dialogTransitionService.closeTransitionDialog();
            this.dialogTransitionService.openTransitionDialog(
                TRANSITIONS_MESSAGES.endMatchAfterPlayersLeft,
                TRANSITIONS_DURATIONS.endMatchAfterPlayersLeft,
                DIALOG.endMatchTransitionWidth,
                DIALOG.endMatchTransitionHeight,
            );
            this.matchService.timeService.startTimer(TRANSITIONS_DURATIONS.endMatchAfterPlayersLeft, this.matchService.match.accessCode, () => {
                this.dialogTransitionService.closeTransitionDialog();
                this.finishMatchWithoutConfirmation();
            });
        }
    }

    haveAllPlayersLeft(): boolean {
        return this.matchService.match.players.every((player) => !player.isActive);
    }

    private pauseTimer(): void {
        this.matchService.timeService.stopServerTimer(this.matchService.match.accessCode);
    }

    private resumeTimer(): void {
        if (this.isPanicMode) {
            this.isPaused = false;
            this.startPanicModeTimer();
            this.isPaused = true;
        } else
            this.matchService.timeService.resumeTimer(this.matchService.match.accessCode, () => {
                this.listenerSrv.histogramSrv.isShowingQuestionResults = true;
            });
    }
}
