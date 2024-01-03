import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { Question } from '@app/classes/question/question';
import { ERRORS, QUESTION_TYPE, SocketsSendEvents } from '@app/constants/constants';
import { Choice } from '@app/interfaces/choice';
import { PlayerAnswers } from '@app/interfaces/player-answers';
import { UpdateAnswerRequest } from '@app/interfaces/update-answer-request';
import { MatchPlayerService } from '@app/services/match-player-service/match-player.service';
import { QuestionEvaluationService } from '@app/services/question-evaluation/question-evaluation.service';

/**
 * Component that shows a question and its choices if it'a a QCM, or an input where to enter the answer if it's a QRL.
 * When the question type is QCM, the player can select as many choices as he wants either by clicking on the choice
 * or by entering its number using the keyboard. He can also select his answer as final, for both types, using the
 * 'Enter' key.
 *
 * @class QuestionAnswerComponent
 * @implements {OnInit}
 */
@Component({
    selector: 'app-question-answer',
    templateUrl: './question-answer.component.html',
    styleUrls: ['./question-answer.component.scss'],
})
export class QuestionAnswerComponent implements OnInit, OnDestroy {
    @Input() sendEvent: EventEmitter<void>;
    qrlAnswer: string = '';
    question: Question = new Question();
    sendButtonDisabled: boolean = false;
    finalAnswer: boolean = false;
    isFirstAttempt: boolean = true;

    constructor(
        public matchSrv: MatchPlayerService,
        public questionEvaluation: QuestionEvaluationService,
    ) {}

    @HostListener('document:keydown', ['$event'])
    buttonDetect(event: KeyboardEvent): void {
        if (this.sendButtonDisabled) return;
        if (!this.matchSrv.isTyping) {
            if (event.key === 'Enter') {
                this.onSend();
            } else {
                const playerChoice = Number(event.key) - 1;
                if (playerChoice >= 0 && playerChoice < this.question.choices.length) {
                    this.onSelect(this.question.choices[playerChoice]);
                }
            }
        }
    }

    ngOnInit(): void {
        this.question = this.matchSrv.currentQuestion;
        this.matchSrv.isTypingQrl = false;
        if (this.matchSrv.showingResults) this.sendButtonDisabled = true;
        else this.sendButtonDisabled = false;
        if (this.sendEvent) {
            this.sendEvent.subscribe((event: KeyboardEvent) => {
                this.buttonDetect(event);
            });
        }
    }

    ngOnDestroy(): void {
        if (this.matchSrv.getCurrentQuestion.type === QUESTION_TYPE.qrl && !this.matchSrv.match.testing) {
            this.matchSrv.timeService.stopServerTimer(this.matchSrv.match.accessCode, true);
            this.matchSrv.setCurrentAnswersAsFinal(false);
            if (this.finalAnswer) {
                this.sendButtonDisabled = false;
                this.matchSrv.setCurrentAnswersAsFinal();
            }
            this.onSend(true);
        }
    }

    getOptionBackgroundColor(choice: Choice): string {
        if (this.matchSrv.isFinalCurrentAnswer()) {
            return this.matchSrv.isChoiceSelected(choice) ? 'background-yellow-border' : 'gray-bg';
        }

        return this.matchSrv.isChoiceSelected(choice) ? 'background-yellow-border' : 'yellow-bg';
    }

    getAnswerIcon(choice: Choice): string {
        return choice.isCorrect ? 'done' : 'clear';
    }

    onSelect(choice: Choice): void {
        if (this.sendButtonDisabled) return;
        if (this.matchSrv.match.timer <= 0 || this.matchSrv.isFinalCurrentAnswer() || this.matchSrv.showingResults) return;

        this.matchSrv.updateCurrentAnswer(choice);
    }

    onSend(isCalledByDestroy: boolean = false): void {
        if (this.sendButtonDisabled) return;
        this.finalAnswer = false;

        if (!isCalledByDestroy) this.matchSrv.setCurrentAnswersAsFinal();

        if (!this.matchSrv.match.testing) {
            if (isCalledByDestroy) this.updatePlayerAnswers(false);
            else this.updatePlayerAnswers(true);
        } else {
            this.questionEvaluation.currentPlayerAnswer = this.qrlAnswer;
            this.matchSrv.qrlAnswer = this.qrlAnswer;
            this.matchSrv.showResults();
        }

        this.sendButtonDisabled = true;
    }

    onTextAreaChange(): void {
        this.matchSrv.qrlAnswer = this.qrlAnswer;
        if (this.isFirstAttempt) {
            this.matchSrv.isTypingQrl = true;
            this.matchSrv.updateTypingState(true);
            this.isFirstAttempt = false;
        } else if (!this.matchSrv.isTypingQrl) {
            this.matchSrv.isTypingQrl = true;
            this.matchSrv.updateTypingState(false);
        }
        if (!this.matchSrv.match.testing && this.matchSrv.currentQuestion.type === QUESTION_TYPE.qrl) {
            this.matchSrv.timeService.startHistogramTimer(this.matchSrv.match.accessCode, this.histogramTimerCallbackAction.bind(this));
        }
    }

    histogramTimerCallbackAction(): void {
        this.matchSrv.isTypingQrl = false;
        this.matchSrv.updateTypingState(true);
    }

    updatePlayerAnswers(final: boolean = false): void {
        const playerAnswersIndex: number = this.matchSrv.getCurrentAnswersIndex();

        if (playerAnswersIndex !== ERRORS.noIndexFound) {
            const currentQuestion = this.matchSrv.currentQuestion;
            const playerAnswers = this.matchSrv.match.playerAnswers[playerAnswersIndex];

            if (currentQuestion.type === QUESTION_TYPE.qrl) {
                this.questionEvaluation.currentPlayerAnswer = this.qrlAnswer;
                playerAnswers.qrlAnswer = this.qrlAnswer;
            } else {
                playerAnswers.lastAnswerTime = this.matchSrv.timeService.timer.toString();
                playerAnswers.obtainedPoints = this.matchSrv.evaluateCurrentQuestion() ? currentQuestion.points : 0;
            }

            this.sendUpdatedAnswers(playerAnswers);
        } else {
            this.createPlayerAnswersAndSend(final);
        }
    }

    sendUpdatedAnswers(playerAnswers: PlayerAnswers): void {
        this.matchSrv.socketService.send<UpdateAnswerRequest>(SocketsSendEvents.SetFinalAnswer, {
            matchAccessCode: this.matchSrv.match.accessCode,
            playerAnswers,
        });
    }

    createPlayerAnswersAndSend(final: boolean = false): void {
        this.matchSrv.socketService.send<UpdateAnswerRequest>(SocketsSendEvents.SetFinalAnswer, {
            matchAccessCode: this.matchSrv.match.accessCode,
            playerAnswers: {
                name: this.matchSrv.player.name,
                questionId: this.matchSrv.currentQuestion.id,
                lastAnswerTime: '',
                final,
                obtainedPoints: 0,
                qcmAnswers: [],
                qrlAnswer: this.qrlAnswer,
                isTypingQrl: false,
            },
        });
        this.questionEvaluation.currentPlayerAnswer = this.qrlAnswer;
    }
}
