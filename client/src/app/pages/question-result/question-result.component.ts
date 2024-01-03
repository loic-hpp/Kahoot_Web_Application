import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TransitionDialogComponent } from '@app/components/transition-dialog/transition-dialog.component';
import {
    DIALOG_MESSAGE,
    DURATIONS,
    FACTORS,
    FEEDBACK_MESSAGES,
    NAMES,
    QUESTION_TYPE,
    SocketsOnEvents,
    TRANSITIONS_DURATIONS,
    TRANSITIONS_MESSAGES,
} from '@app/constants/constants';
import { Player } from '@app/interfaces/player';
import { CancelConfirmationService } from '@app/services/cancel-confirmation/cancel-confirmation.service';
import { DialogTransitionService } from '@app/services/dialog-transition-service/dialog-transition.service';
import { ListenerManagerService } from '@app/services/listener-manager/listener-manager.service';
import { MatchPlayerService } from '@app/services/match-player-service/match-player.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-question-result',
    templateUrl: './question-result.component.html',
    styleUrls: ['./question-result.component.scss'],
})

/**
 * Manages the result view while playing a game. It includes the right and wrong answers,
 * the result of the player and the points that will be added to the player's score
 */
export class QuestionResultComponent implements OnInit, OnDestroy {
    transitionText: string;
    isTestingMatch: boolean;
    matchFinishedSubscription: Subscription;
    counter: number = 0;
    timer: number = 3;
    dialogRef: MatDialogRef<TransitionDialogComponent>;
    nextQuestionSubscription: Subscription;
    private backToMatchInterval: number | undefined;

    // eslint-disable-next-line max-params
    constructor(
        public matchSrv: MatchPlayerService,
        private snackBar: MatSnackBar,
        private listenerService: ListenerManagerService,
        private confirmationService: CancelConfirmationService,
        private dialogTransitionService: DialogTransitionService,
    ) {}

    ngOnInit(): void {
        if (this.matchSrv.isCurrentQuestionTheLastOne()) this.transitionText = TRANSITIONS_MESSAGES.matchEndTestView;
        else this.transitionText = TRANSITIONS_MESSAGES.nextQuestionTestView;

        if (this.matchSrv.match.testing) this.backToMatchInTesting();
        else this.setupListeners();

        this.showResultMessage();
        window.history.replaceState({}, '', '');
        this.nextQuestionSubscription = this.matchSrv.nextQuestionEventEmitter.subscribe(this.nextQuestion.bind(this));
        this.matchFinishedSubscription = this.matchSrv.matchFinishedEventEmitter.subscribe(this.onMatchFinished.bind(this));
        window.onbeforeunload = () => {
            this.quitMatchWithoutConfirmation();
        };
        window.onpopstate = () => {
            this.quitMatchWithoutConfirmation();
        };

        this.initializeFeedBackMessages();

        if (this.matchSrv.currentQuestion.type === QUESTION_TYPE.qrl) this.matchSrv.hasQuestionEvaluationBegun = true;
    }

    ngOnDestroy(): void {
        window.onbeforeunload = () => {
            return;
        };
        window.onpopstate = () => {
            return;
        };
        try {
            this.nextQuestionSubscription.unsubscribe();
        } catch (error) {
            window.alert(error);
        }
    }

    onMatchFinished(): void {
        this.confirmationService.dialogRef?.close();
        this.matchSrv.timeService.stopTimer();
        this.dialogTransitionService.closeTransitionDialog();
        this.nextQuestionSubscription.unsubscribe();
        this.matchSrv.router.navigateByUrl('/home');
    }

    quitMatchWithoutConfirmation(): void {
        clearInterval(this.backToMatchInterval);
        this.backToMatchInterval = undefined;

        this.listenerService.evaluationSrv.cleanServiceAttributes();
        this.matchSrv.quitMatch();
    }

    quitMatch(): void {
        this.confirmationService.askConfirmation(this.quitMatchWithoutConfirmation.bind(this), DIALOG_MESSAGE.quitMatch);
    }

    backToMatchInTesting(): void {
        this.backToMatchInterval = window.setInterval(() => {
            if (this.timer > 0) {
                this.timer--;
            } else {
                clearInterval(this.backToMatchInterval);
                this.backToMatchInterval = undefined;
                this.backToMatch();
            }
        }, DURATIONS.backToMatch);
    }

    showResultMessage(): void {
        if (this.matchSrv.match.testing && this.matchSrv.evaluateCurrentQuestion()) {
            this.matchSrv.questionScore = this.matchSrv.currentQuestion.points * FACTORS.firstChoice;
            this.showBonusMessage();
            this.matchSrv.feedBackMessages[0] = FEEDBACK_MESSAGES.rightAnswer;
            this.matchSrv.feedBackMessages[1] = `${this.matchSrv.questionScore} ${FEEDBACK_MESSAGES.pointsAddedToScore}`;
        }
    }

    showBonusMessage(): void {
        if (this.matchSrv.currentQuestion.type === QUESTION_TYPE.qrl) return;
        const snackBarRef = this.snackBar.open(FEEDBACK_MESSAGES.bonus);

        // eslint-disable-next-line no-underscore-dangle
        snackBarRef._dismissAfter(DURATIONS.bonusMessage);
    }

    setupListeners(): void {
        if (!this.matchSrv.questionResultConnected) {
            this.matchSrv.questionResultConnected = true;
            this.listenerService.setupQuestionResultListeners();
            this.matchSrv.socketService.on<Player>(SocketsOnEvents.UpdatedScore, (updatedPlayer) => {
                if (this.matchSrv.player.name === updatedPlayer.name) {
                    this.updatePlayerScore(updatedPlayer);
                }
                this.matchSrv.match.updatePlayerStats(updatedPlayer);
            });
        }
    }

    updatePlayerScore(updatedPlayer: Player): void {
        const previousScore = this.matchSrv.match.getScoreOfPlayerByName(updatedPlayer.name);
        if (previousScore === null) return;
        else if (previousScore === 0) {
            this.matchSrv.questionScore = updatedPlayer.score;
        } else {
            this.matchSrv.questionScore = updatedPlayer.score - previousScore;
        }
        if (this.matchSrv.currentQuestion.type === QUESTION_TYPE.qcm) {
            this.matchSrv.player.score = updatedPlayer.score;
            this.handleFeedBackMessages();
        }
    }

    nextQuestion(): void {
        const transitionText = this.matchSrv.isCurrentQuestionTheLastOne()
            ? TRANSITIONS_MESSAGES.transitionToResultsView
            : TRANSITIONS_MESSAGES.transitionToNextQuestion;
        this.dialogTransitionService.openTransitionDialog(transitionText, TRANSITIONS_DURATIONS.betweenQuestions);
        this.matchSrv.timeService.startTimer(TRANSITIONS_DURATIONS.betweenQuestions, this.matchSrv.match.accessCode, this.onTimerFinished.bind(this));
    }

    onTimerFinished(): void {
        this.dialogTransitionService.closeTransitionDialog();
        this.nextQuestionSubscription.unsubscribe();
        this.backToMatch();
    }

    backToMatch(): void {
        this.matchSrv.feedBackMessages = [FEEDBACK_MESSAGES.wrongAnswer, FEEDBACK_MESSAGES.sameScore];
        if (this.matchSrv.isCurrentQuestionTheLastOne()) {
            if (this.matchSrv.match.testing) {
                this.matchSrv.cleanCurrentMatch();
                this.matchSrv.router.navigateByUrl('/create');
            } else {
                if (this.matchSrv.match.game) this.matchSrv.router.navigateByUrl(`/play/result/${this.matchSrv.match.game.id}`);
            }
        } else {
            this.matchSrv.sendNextQuestion();
            if (this.matchSrv.match.game) this.matchSrv.router.navigateByUrl(`/play/match/${this.matchSrv.match.game.id}`);
        }
    }

    handleFeedBackMessages(): void {
        const currentQuestionPoints = this.matchSrv.currentQuestion.points;
        // Player gets the bonus
        if (this.matchSrv.questionScore > currentQuestionPoints) {
            this.showBonusMessage();
        }
        if (this.matchSrv.questionScore >= currentQuestionPoints) {
            this.matchSrv.feedBackMessages[0] = FEEDBACK_MESSAGES.rightAnswer;
            this.matchSrv.feedBackMessages[1] = `${this.matchSrv.questionScore} ${FEEDBACK_MESSAGES.pointsAddedToScore}`;
        }
    }

    initializeFeedBackMessages(): void {
        if (this.matchSrv.currentQuestion.type === QUESTION_TYPE.qrl) {
            if (this.matchSrv.player.name === NAMES.tester)
                this.matchSrv.feedBackMessages = [
                    FEEDBACK_MESSAGES.rightAnswer,
                    `${this.matchSrv.currentQuestion.points} ${FEEDBACK_MESSAGES.pointsAddedToScore}`,
                ];
            else {
                this.matchSrv.feedBackMessages[0] = FEEDBACK_MESSAGES.waiting;
                this.matchSrv.feedBackMessages[1] = FEEDBACK_MESSAGES.duringEvaluation;
            }
        }
    }
}
