import { Injectable } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Match } from '@app/classes/match/match';
import { Question } from '@app/classes/question/question';
import { ERRORS, FACTORS, FEEDBACK_MESSAGES, NAMES, QRL_TIME, QUESTION_TYPE, SocketsOnEvents, SocketsSendEvents } from '@app/constants/constants';
import { Choice } from '@app/interfaces/choice';
import { Player } from '@app/interfaces/player';
import { PlayerRequest } from '@app/interfaces/player-request';
import { QuestionRequest } from '@app/interfaces/question-request';
import { UpdateAnswerRequest } from '@app/interfaces/update-answer-request';
import { ChatService } from '@app/services/chat-service/chat.service';
import { MatchCommunicationService } from '@app/services/match-communication/match-communication.service';
import { SocketService } from '@app/services/socket-service/socket.service';
import { TimeService } from '@app/services/time-service/time.service';
import { Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})

/**
 * Service that contains the logic of a current match on the player's side:
 * starting and stopping timer, selecting and deselecting choices, evaluating
 * answers and updating score and showing the results.
 * If it's the last question, the player will be redirected to the creation
 * view (on a test match) after displaying the results.
 * Currently we only take into consideration the QCM questions type
 */
export class MatchPlayerService {
    dataSource: MatTableDataSource<Player>;
    player: Player;
    showingResults: boolean = false;
    hasJoinMatch: boolean = false;
    questionResultConnected: boolean = false;
    isTyping: boolean = false;
    nextQuestionEventEmitter: Subject<void> = new Subject<void>();
    matchFinishedEventEmitter: Subject<void> = new Subject<void>();
    match: Match = new Match();
    feedBackMessages: string[] = [FEEDBACK_MESSAGES.wrongAnswer, FEEDBACK_MESSAGES.sameScore];
    currentQuestion: Question = new Question();
    questionScore: number = 0;
    isTypingQrl: boolean = false;
    qrlAnswer: string = '';
    hasQuestionEvaluationBegun: boolean = false;
    private currentQuestionIndex: number = 0;

    // eslint-disable-next-line max-params
    constructor(
        public router: Router,
        public timeService: TimeService,
        public socketService: SocketService,
        public chatService: ChatService,
        private communicationSrv: MatchCommunicationService,
    ) {}

    get getCurrentQuestion(): Question {
        return this.currentQuestion;
    }

    get getCurrentQuestionIndex(): number {
        return this.currentQuestionIndex;
    }

    getMaxTime(): number {
        if (this.currentQuestion.type === QUESTION_TYPE.qrl) return QRL_TIME;
        else return this.match.game.duration;
    }

    initializePlayersList(): void {
        this.dataSource = new MatTableDataSource(this.match.players);
    }

    initializeQuestion(): void {
        this.currentQuestion = this.match.game.questions[this.currentQuestionIndex];
        this.match.setTimerValue();
    }

    setCurrentMatch(match: Match, player: Player): void {
        this.match = match;
        this.player = player;
        if (!this.match.testing && player.name === NAMES.manager) this.createMatch().subscribe();
    }

    updateCurrentAnswer(choice: Choice = {} as Choice): void {
        let answersIndex = this.getCurrentAnswersIndex();
        if (answersIndex !== ERRORS.noIndexFound) {
            if (this.isChoiceSelected(choice)) {
                this.match.playerAnswers[answersIndex].qcmAnswers.splice(this.match.getAnswerIndex(this.player, this.currentQuestion.id, choice), 1);
            } else {
                this.match.playerAnswers[answersIndex].qcmAnswers.push(choice);
            }
        } else {
            this.match.playerAnswers.push({
                name: this.player.name,
                lastAnswerTime: '',
                final: false,
                questionId: this.currentQuestion.id,
                obtainedPoints: 0,
                qcmAnswers: [choice],
                qrlAnswer: '',
                isTypingQrl: false,
            });
        }
        answersIndex = this.getCurrentAnswersIndex();
        if (!this.match.testing && answersIndex !== ERRORS.noIndexFound) {
            this.socketService.send<UpdateAnswerRequest>(SocketsSendEvents.UpdateAnswer, {
                matchAccessCode: this.match.accessCode,
                playerAnswers: this.match.playerAnswers[answersIndex],
            });
        }
    }

    updateTypingState(isFirstAttempt: boolean = false): void {
        const answersIndex = this.getCurrentAnswersIndex();
        if (answersIndex !== ERRORS.noIndexFound) {
            this.match.playerAnswers[answersIndex].isTypingQrl = this.isTypingQrl;
        } else {
            this.match.playerAnswers.push({
                name: this.player.name,
                lastAnswerTime: '',
                final: false,
                questionId: this.currentQuestion.id,
                obtainedPoints: 0,
                qcmAnswers: [],
                qrlAnswer: this.qrlAnswer,
                isTypingQrl: this.isTypingQrl,
            });
        }
        this.sendUpdateAnswerEvent(isFirstAttempt);
    }

    sendUpdateAnswerEvent(isFirstAttempt: boolean = false): void {
        const answersIndex = this.getCurrentAnswersIndex();
        if (answersIndex !== ERRORS.noIndexFound) {
            this.match.playerAnswers[answersIndex].qrlAnswer = this.qrlAnswer;
            this.match.playerAnswers[answersIndex].isFirstAttempt = isFirstAttempt;
            this.socketService.send<UpdateAnswerRequest>(SocketsSendEvents.UpdateAnswer, {
                matchAccessCode: this.match.accessCode,
                playerAnswers: this.match.playerAnswers[answersIndex],
            });
        }
    }

    getCurrentAnswersIndex(): number {
        return this.match.getPlayerAnswersIndex(this.player, this.currentQuestion.id);
    }

    isChoiceSelected(choice: Choice): boolean {
        return this.match.didPlayerAnswer(this.player, choice, this.currentQuestion.id);
    }

    setCurrentAnswersAsFinal(final: boolean = true): void {
        this.match.setAnswersAsFinal(this.player, this.currentQuestion.id, final);
    }

    isFinalCurrentAnswer(): boolean {
        return this.match.isFinalAnswer(this.player, this.currentQuestion.id);
    }

    evaluateCurrentQuestion(): boolean {
        const answersIndex = this.getCurrentAnswersIndex();
        if (this.match.playerAnswers.length === 0 || answersIndex === ERRORS.noIndexFound) return false;
        if (this.match.playerAnswers[answersIndex] === undefined) return false;
        let gotRightAnswer = true;
        let correctChoicesCounter = 0;
        for (const choice of this.match.playerAnswers[answersIndex].qcmAnswers) {
            if (!choice.isCorrect) {
                gotRightAnswer = false;
                break;
            } else {
                correctChoicesCounter++;
            }
        }
        if (correctChoicesCounter !== this.currentQuestion.getRightChoicesNumber()) {
            gotRightAnswer = false;
        }
        return gotRightAnswer;
    }

    updateScore(): void {
        if (this.match.testing) {
            this.player.score += this.currentQuestion.points * FACTORS.firstChoice;
        } else {
            this.player.score += this.currentQuestion.points;

            this.socketService.send<QuestionRequest>(SocketsSendEvents.UpdateScore, {
                matchAccessCode: this.match.accessCode,
                player: this.player,
                questionId: this.currentQuestion.id,
                hasQrlEvaluationBegun: this.hasQuestionEvaluationBegun,
            });
        }
    }

    initializeScore(): void {
        this.player.score = 0;
    }

    sendNextQuestion(): void {
        this.showingResults = false;
        this.currentQuestionIndex++;
    }

    showResults(): void {
        this.showingResults = true;
        this.timeService.stopTimer();
        if (this.currentQuestion.type === QUESTION_TYPE.qcm && this.evaluateCurrentQuestion()) {
            this.updateScore();
        } else if (this.currentQuestion.type === QUESTION_TYPE.qrl && this.player.name === NAMES.tester) {
            this.player.score += this.currentQuestion.points;
        }
        this.router.navigateByUrl(`/play/question-result/${this.match.game.id}`);
    }

    cleanCurrentMatch(): void {
        this.chatService.isChatAccessible = true;
        this.showingResults = false;
        this.hasJoinMatch = false;
        this.questionResultConnected = false;
        this.player = {} as Player;
        this.currentQuestionIndex = 0;
        this.timeService.joinMatchService.accessCode = '';
        this.timeService.joinMatchService.playerName = '';

        this.timeService.stopTimer();
        this.chatService.cleanMessages();
        this.socketService.disconnect();
    }

    isCurrentQuestionTheLastOne(): boolean {
        return this.match.game.isLastQuestion(this.currentQuestion);
    }

    quitMatch(): void {
        if (this.match.testing) {
            this.timeService.stopServerTimer(this.match.accessCode);
            this.router.navigateByUrl('/create');
        } else {
            this.socketService.send<QuestionRequest>(SocketsSendEvents.PlayerLeftAfterMatchBegun, {
                matchAccessCode: this.match.accessCode,
                player: this.player,
                questionId: this.currentQuestion.id,
                hasQrlEvaluationBegun: this.hasQuestionEvaluationBegun,
            });
            this.router.navigateByUrl('/home');
        }
        this.timeService.joinMatchService.playerName = '';
        this.cleanCurrentMatch();
    }

    joinMatchRoom(accessCode: string): void {
        this.socketService.send<PlayerRequest>(SocketsSendEvents.JoinMatch, { roomId: accessCode, name: this.player.name });
    }

    validateAccessCode(accessCode: string): Observable<boolean> {
        return this.communicationSrv.isValidAccessCode(accessCode);
    }

    createMatch(): Observable<unknown> {
        return this.communicationSrv.createMatch(this.match);
    }

    setAccessibility(): Observable<unknown> {
        return this.communicationSrv.setAccessibility(this.match.accessCode);
    }

    deleteMatchByAccessCode(accessCode: string): Observable<unknown> {
        return this.communicationSrv.deleteMatchByAccessCode(accessCode);
    }

    setupListenersPLayerView(): void {
        this.socketService.on<void>(SocketsOnEvents.MatchFinished, () => {
            this.quitMatch();
            this.matchFinishedEventEmitter.next();
        });
    }
}
