import { Injectable } from '@angular/core';
import { ERRORS, FEEDBACK_MESSAGES, NAMES, QUESTION_TYPE, SocketsOnEvents } from '@app/constants/constants';
import { Player } from '@app/interfaces/player';
import { PlayerAnswers } from '@app/interfaces/player-answers';
import { QuestionChartData } from '@app/interfaces/questions-chart-data';
import { ChatService } from '@app/services/chat-service/chat.service';
import { HistogramService } from '@app/services/histogram-service/histogram.service';
import { MatchPlayerService } from '@app/services/match-player-service/match-player.service';
import { QuestionEvaluationService } from '@app/services/question-evaluation/question-evaluation.service';
import { Subject } from 'rxjs';

/**
 * This class allows to start and configure web socket event listeners in a centralized place.
 */
@Injectable({
    providedIn: 'root',
})
export class ListenerManagerService {
    playerLeftEmitter: Subject<void> = new Subject<void>();
    // eslint-disable-next-line max-params
    constructor(
        public matchPlayerService: MatchPlayerService,
        public chatSrv: ChatService,
        public histogramSrv: HistogramService,
        public evaluationSrv: QuestionEvaluationService,
    ) {}

    setupQuestionResultListeners(): void {
        this.setUpNextQuestionListener();
        this.updatePlayerOnDisabledEvent();
    }

    setOnGoingMatchListeners(): void {
        this.setFinalAnswerOnEvent();
        this.showResultsOnAllPlayersResponded();
        this.updatePlayerOnDisabledEvent();
        this.updateSelectedChoices();
        this.updatePlayerScoreOnQrlEvaluation();
    }

    setMatchManagerSideListeners(): void {
        this.updatePlayerScoreOnEvent();
        this.updatePlayerOnDisabledEvent();
        this.setFinalAnswerOnEvent();
        this.updateSelectedChoices();
        this.updatePlayerScoreOnQrlEvaluation();
    }

    setWaitingRoomListeners(): void {
        this.chatSrv.setupListeners();
        this.updatePlayersListOnNewPlayers();
        this.updatePlayersListOnPlayerRemoved();
    }

    setManagerWaitingRoomListeners(): void {
        this.setWaitingRoomListeners();
    }

    private setUpNextQuestionListener(): void {
        this.matchPlayerService.socketService.on<void>(SocketsOnEvents.NextQuestion, () => {
            this.matchPlayerService.nextQuestionEventEmitter.next();
        });
    }

    private setFinalAnswerOnEvent(): void {
        this.matchPlayerService.socketService.on<PlayerAnswers>(SocketsOnEvents.FinalAnswerSet, (updatedPlayerAnswers) => {
            const playerAnswerIndex = this.matchPlayerService.match.playerAnswers.findIndex(
                (playerAnswers) => playerAnswers.name === updatedPlayerAnswers.name && playerAnswers.questionId === updatedPlayerAnswers.questionId,
            );
            if (this.matchPlayerService.currentQuestion.type === QUESTION_TYPE.qcm)
                this.histogramSrv.playersWithFinalAnswers?.push(updatedPlayerAnswers.name);
            if (this.matchPlayerService.currentQuestion.type === QUESTION_TYPE.qrl && updatedPlayerAnswers.final)
                this.histogramSrv.playersWithFinalAnswers?.push(updatedPlayerAnswers.name);
            if (playerAnswerIndex !== ERRORS.noIndexFound) {
                this.matchPlayerService.match.playerAnswers[playerAnswerIndex].lastAnswerTime = updatedPlayerAnswers.lastAnswerTime;
                this.matchPlayerService.match.playerAnswers[playerAnswerIndex].final = updatedPlayerAnswers.final;
                if (this.matchPlayerService.currentQuestion.type === QUESTION_TYPE.qrl && this.matchPlayerService.player.name === NAMES.manager) {
                    this.matchPlayerService.match.playerAnswers[playerAnswerIndex].qrlAnswer = updatedPlayerAnswers.qrlAnswer;
                    this.evaluationSrv.setPlayerAnswer();
                }
            } else {
                this.matchPlayerService.match.playerAnswers.push(updatedPlayerAnswers);
                if (this.matchPlayerService.currentQuestion.type === QUESTION_TYPE.qrl && this.matchPlayerService.player.name === NAMES.manager) {
                    this.evaluationSrv.setPlayerAnswer();
                }
            }
        });
    }

    private updatePlayerScoreOnEvent(): void {
        this.matchPlayerService.socketService.on<Player>(SocketsOnEvents.UpdatedScore, (updatedPlayer) => {
            const playerIndex = this.matchPlayerService.match.players.findIndex((player) => player.name === updatedPlayer.name);
            if (playerIndex !== ERRORS.noIndexFound) {
                this.matchPlayerService.match.players[playerIndex] = updatedPlayer;
                if (this.matchPlayerService.getCurrentQuestion.type === QUESTION_TYPE.qcm) {
                    this.matchPlayerService.dataSource.data[playerIndex] = updatedPlayer;
                    // eslint-disable-next-line no-underscore-dangle
                    this.matchPlayerService.dataSource._updateChangeSubscription();
                }
            }
        });
    }

    private updatePlayerOnDisabledEvent(): void {
        this.matchPlayerService.socketService.on<Player>(SocketsOnEvents.PlayerDisabled, (player) => {
            const playerIndex: number = this.matchPlayerService.match.players.findIndex((p) => p.name === player.name);
            this.matchPlayerService.match.players[playerIndex].isActive = player.isActive;
            if (this.matchPlayerService.player.name === player.name) {
                this.matchPlayerService.socketService.disconnect();
            }
            if (this.matchPlayerService.player.name === NAMES.manager) {
                const playerToDisable: Player = this.matchPlayerService.match.players[playerIndex];
                this.matchPlayerService.dataSource.data[playerIndex].isActive = playerToDisable.isActive;
                this.sendSystemMessage(player.name);

                // eslint-disable-next-line no-underscore-dangle
                this.matchPlayerService.dataSource._updateChangeSubscription();

                this.evaluationSrv.playersNames = this.evaluationSrv.playersNames.filter((name) => name !== playerToDisable.name);
                this.evaluationSrv.handleLastPlayerEvaluation();
            }
            // Put the player name in black
            this.histogramSrv.quittedPlayers.push(player.name);
            this.playerLeftEmitter.next();
        });
    }

    private sendSystemMessage(name: string): void {
        this.chatSrv.send({
            playerName: NAMES.system,
            matchAccessCode: this.matchPlayerService.match.accessCode,
            time: this.matchPlayerService.timeService.getCurrentTime(),
            data: `${name} ${FEEDBACK_MESSAGES.playerLeftMatch}`,
        });
    }

    private showResultsOnAllPlayersResponded(): void {
        this.matchPlayerService.socketService.on<PlayerAnswers>(SocketsOnEvents.AllPlayersResponded, () => {
            this.matchPlayerService.showResults();
        });
    }

    private updatePlayersListOnNewPlayers(): void {
        this.matchPlayerService.socketService.on<Player[]>(SocketsOnEvents.NewPlayer, (playersList) => {
            this.matchPlayerService.match.players = playersList;
        });
    }

    private updatePlayersListOnPlayerRemoved(): void {
        this.matchPlayerService.socketService.on<Player[]>(SocketsOnEvents.PlayerRemoved, (playersList) => {
            this.matchPlayerService.match.players = playersList;
            if (this.matchPlayerService.player.name !== NAMES.manager) {
                const isStillPlayer = this.matchPlayerService.match.players.find(
                    (player: Player) => player.name === this.matchPlayerService.player.name,
                );
                if (!isStillPlayer) {
                    this.matchPlayerService.cleanCurrentMatch();
                    this.matchPlayerService.router.navigateByUrl('/home');
                }
            }
        });
    }

    private updateSelectedChoices(): void {
        if (this.matchPlayerService.getCurrentQuestionIndex === 0) {
            this.histogramSrv.questionsChartData = [];
            this.matchPlayerService.socketService.on<QuestionChartData>(SocketsOnEvents.UpdateChartDataList, (answer: QuestionChartData) => {
                this.histogramSrv.questionsChartData.push({
                    labelList: answer.labelList,
                    chartData: answer.chartData,
                    chartColor: answer.chartColor,
                    xLineText: answer.xLineText,
                });
            });
        }
    }

    private updatePlayerScoreOnQrlEvaluation(): void {
        this.matchPlayerService.socketService.on(SocketsOnEvents.QrlEvaluationFinished, () => {
            if (this.matchPlayerService.currentQuestion.type === QUESTION_TYPE.qrl) {
                this.matchPlayerService.match.players.forEach((player) => {
                    const servicePlayer: Player = this.matchPlayerService.player;
                    if (this.matchPlayerService.player.name === NAMES.manager) {
                        this.handleManagerUpdatesAfterQrlEvaluation(player);
                        if (this.histogramSrv.chart) {
                            this.histogramSrv.chart.destroy();
                        }
                        this.histogramSrv.createChart();
                    }
                    if (servicePlayer.name === player.name) {
                        this.handlePlayerUpdatesAfterQrlEvaluation(player);
                    }
                });
            }
        });
    }

    private handleManagerUpdatesAfterQrlEvaluation(player: Player): void {
        const dataPlayerIndex: number = this.matchPlayerService.dataSource.data.findIndex((dataPlayer) => player.name === dataPlayer.name);
        this.matchPlayerService.dataSource.data[dataPlayerIndex] = player;
        // eslint-disable-next-line no-underscore-dangle
        this.matchPlayerService.dataSource._updateChangeSubscription();
    }

    private handlePlayerUpdatesAfterQrlEvaluation(player: Player): void {
        this.matchPlayerService.player.score = player.score;
        this.setFeedBackMessages();
    }

    private setFeedBackMessages(): void {
        const currentQuestionPoints = this.matchPlayerService.currentQuestion.points;
        if (this.matchPlayerService.questionScore === currentQuestionPoints / 2) {
            this.matchPlayerService.feedBackMessages[0] = FEEDBACK_MESSAGES.halfPoints;
            // eslint-disable-next-line max-len
            this.matchPlayerService.feedBackMessages[1] = `${this.matchPlayerService.questionScore} ${FEEDBACK_MESSAGES.pointsAddedToScore}`;
        } else if (this.matchPlayerService.questionScore === currentQuestionPoints) {
            this.matchPlayerService.feedBackMessages[0] = FEEDBACK_MESSAGES.rightAnswer;
            // eslint-disable-next-line max-len
            this.matchPlayerService.feedBackMessages[1] = `${this.matchPlayerService.questionScore} ${FEEDBACK_MESSAGES.pointsAddedToScore}`;
        } else {
            this.matchPlayerService.feedBackMessages[0] = FEEDBACK_MESSAGES.wrongAnswer;
            this.matchPlayerService.feedBackMessages[1] = FEEDBACK_MESSAGES.sameScore;
        }
    }
}
