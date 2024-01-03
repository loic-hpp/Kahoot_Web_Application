import { Match } from '@app/classes/match/match';
import { PlayerAnswers } from '@app/classes/player-answers/player-answers';
import { NAMES, SocketsEmitEvents, SocketsSubscribeEvents } from '@app/constants/constants';
import { ChatAccessibilityRequest } from '@app/interfaces/chat-accessibility-request';
import { Message } from '@app/interfaces/message';
import { Player } from '@app/interfaces/player';
import { PlayerRequest } from '@app/interfaces/player-request';
import { QuestionRequest } from '@app/interfaces/question-request';
import { Room } from '@app/interfaces/room';
import { StopServerTimerRequest } from '@app/interfaces/stop-server-timer-request';
import { TimerRequest } from '@app/interfaces/timer-request';
import { UpdateAnswerRequest } from '@app/interfaces/update-answer-request';
import { UpdateChartDataRequest } from '@app/interfaces/update-chart-data-request';
import { MatchService } from '@app/services/match/match.service';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

/**
 * This class allows us to communicate with the clients via websocket.
 * It contains all the webSockets events handled by our server
 */
@WebSocketGateway()
export class SocketHandlerGateway {
    @WebSocketServer()
    server: Server;
    timerIntervalMap: Map<string, NodeJS.Timer> = new Map();
    histogramInterval: Map<string, NodeJS.Timer> = new Map();

    constructor(private matchService: MatchService) {}

    @SubscribeMessage(SocketsSubscribeEvents.JoinMatch)
    joinMatchRoom(@ConnectedSocket() client: Socket, @MessageBody() player: PlayerRequest): void {
        client.join(player.roomId);
        let newPlayersList: Player[];
        if (player.name === NAMES.manager || player.name === NAMES.tester) return;
        try {
            this.matchService.addPlayer({
                accessCode: player.roomId,
                player: { name: player.name, isActive: true, score: 0, nBonusObtained: 0, chatBlocked: false },
            });
            this.matchService.addPlayerToBannedPlayer({
                accessCode: player.roomId,
                player: { name: player.name, isActive: true, score: 0, nBonusObtained: 0, chatBlocked: false },
            });

            newPlayersList = this.matchService.getPlayersList({ accessCode: player.roomId });
        } catch (error) {
            this.matchService.logger.log('an error occurred while getting players list', error);
        }
        this.server.to(player.roomId).emit(SocketsEmitEvents.NewPlayer, newPlayersList);
    }

    @SubscribeMessage(SocketsSubscribeEvents.SendMessage)
    sendMessage(@ConnectedSocket() client: Socket, @MessageBody() msg: Message): void {
        // only send message if client is in the match room
        if (client.rooms.has(msg.matchAccessCode)) {
            this.server.to(msg.matchAccessCode).emit(SocketsEmitEvents.ChatMessage, msg);
        }
    }

    @SubscribeMessage(SocketsSubscribeEvents.SwitchQuestion)
    switchQuestion(@ConnectedSocket() client: Socket, @MessageBody() room: Room): void {
        this.server.to(room.id).emit(SocketsEmitEvents.NextQuestion);
    }

    @SubscribeMessage(SocketsSubscribeEvents.SendChartData)
    sendQuestionSelectedChoices(@ConnectedSocket() client: Socket, @MessageBody() updateChartDataRequest: UpdateChartDataRequest): void {
        this.server.to(updateChartDataRequest.matchAccessCode).emit(SocketsEmitEvents.UpdateChartDataList, updateChartDataRequest.questionChartData);
    }

    @SubscribeMessage(SocketsSubscribeEvents.PanicModeActivated)
    panicModeActivatedHandler(@ConnectedSocket() client: Socket, @MessageBody() room: Room): void {
        this.server.to(room.id).emit(SocketsEmitEvents.PanicModeActivated);
    }

    @SubscribeMessage(SocketsSubscribeEvents.UpdateAnswer)
    updateAnswer(@ConnectedSocket() client: Socket, @MessageBody() answerRequest: UpdateAnswerRequest): void {
        let newPlayersAnswersList: PlayerAnswers[];
        try {
            this.matchService.updatePlayerAnswers(answerRequest);
            const match = this.matchService.getMatchByAccessCode(answerRequest.matchAccessCode);
            newPlayersAnswersList = match.getPlayersAnswersList();
        } catch (error) {
            this.matchService.logger.log('an error occurred', error);
        }
        this.server.to(answerRequest.matchAccessCode).emit(SocketsEmitEvents.AnswerUpdated, newPlayersAnswersList);
    }

    @SubscribeMessage(SocketsSubscribeEvents.StartTimer)
    updateTimer(@ConnectedSocket() client: Socket, @MessageBody() timerRequest: TimerRequest): void {
        try {
            if (this.timerIntervalMap.has(timerRequest.roomId)) {
                this.stopTimer(this.timerIntervalMap, timerRequest.roomId);
            }
            this.timerIntervalMap.set(
                timerRequest.roomId,
                setInterval(() => {
                    if (timerRequest.timer > 0) {
                        this.server
                            .to(timerRequest.roomId)
                            .emit(SocketsEmitEvents.NewTime, { roomId: timerRequest.roomId, timer: --timerRequest.timer });
                    } else this.stopTimer(this.timerIntervalMap, timerRequest.roomId);
                }, timerRequest.timeInterval),
            );
        } catch (error) {
            this.matchService.logger.log('an error occurred', error);
        }
    }

    @SubscribeMessage(SocketsSubscribeEvents.HistogramTime)
    updateHistogramTime(@ConnectedSocket() client: Socket, @MessageBody() timerRequest: TimerRequest): void {
        try {
            const intervalKey = timerRequest.roomId + client.id;
            if (this.histogramInterval.has(intervalKey)) {
                this.stopTimer(this.histogramInterval, intervalKey);
            }
            let timer = 0;
            this.histogramInterval.set(
                intervalKey,
                setInterval(() => {
                    this.server.to(client.id).emit(SocketsEmitEvents.HistogramTime, { roomId: timerRequest.roomId, timer: ++timer });
                }, timerRequest.timeInterval),
            );
        } catch (error) {
            this.matchService.logger.log('an error occurred', error);
        }
    }

    @SubscribeMessage(SocketsSubscribeEvents.StopTimer)
    stopTimerHandler(@ConnectedSocket() client: Socket, @MessageBody() stopServerTimerRequest: StopServerTimerRequest): void {
        try {
            if (stopServerTimerRequest.isHistogramTimer) this.stopTimer(this.histogramInterval, stopServerTimerRequest.roomId + client.id);
            else this.stopTimer(this.timerIntervalMap, stopServerTimerRequest.roomId);
        } catch (error) {
            this.matchService.logger.log('an error occurred', error);
        }
    }

    @SubscribeMessage(SocketsSubscribeEvents.CancelGame)
    cancelGame(@ConnectedSocket() client: Socket, @MessageBody() room: Room): void {
        this.server.to(room.id).emit(SocketsEmitEvents.GameCanceled);
    }

    @SubscribeMessage(SocketsSubscribeEvents.FinishMatch)
    finishMatch(@ConnectedSocket() client: Socket, @MessageBody() room: Room): void {
        this.server.to(room.id).emit(SocketsEmitEvents.MatchFinished);
    }

    @SubscribeMessage(SocketsSubscribeEvents.BeginMatch)
    redirectPlayersToMatch(@ConnectedSocket() client: Socket, @MessageBody() room: Room): void {
        try {
            const match: Match = this.matchService.getMatchByAccessCode(room.id);
            this.server.to(room.id).emit(SocketsEmitEvents.JoinBegunMatch, match);
        } catch (error) {
            this.matchService.logger.log('an error occurred', error);
        }
    }

    /**
     * Remove a player from the player list and
     * remove his name from banned name list if he has been removed by manager
     * @param client the socket
     * @param player the player information
     */
    @SubscribeMessage(SocketsSubscribeEvents.RemovePlayer)
    removePlayer(@ConnectedSocket() client: Socket, @MessageBody() player: PlayerRequest): void {
        try {
            this.matchService.removePlayer({
                accessCode: player.roomId,
                player: { name: player.name, isActive: true, score: 0, nBonusObtained: 0, chatBlocked: false },
            });
            if (player.hasPlayerLeft) {
                this.matchService.removePlayerToBannedName({
                    accessCode: player.roomId,
                    player: { name: player.name, isActive: true, score: 0, nBonusObtained: 0, chatBlocked: false },
                });
            }
            const newPlayersList: Player[] = this.matchService.getPlayersList({ accessCode: player.roomId });
            this.server.to(player.roomId).emit(SocketsEmitEvents.PlayerRemoved, newPlayersList);
        } catch (error) {
            this.matchService.logger.log('an error occurred', error);
        }
    }

    @SubscribeMessage(SocketsSubscribeEvents.UpdateScore)
    updatePlayerScore(@ConnectedSocket() client: Socket, @MessageBody() questionRequest: QuestionRequest): void {
        try {
            this.matchService.updatePlayerScore(questionRequest.matchAccessCode, questionRequest.player, questionRequest.questionId);

            this.server
                .to(questionRequest.matchAccessCode)
                .emit(
                    SocketsEmitEvents.UpdatedScore,
                    this.matchService.getPlayerFromMatch(questionRequest.matchAccessCode, questionRequest.player.name),
                );
        } catch (error) {
            this.matchService.logger.log('an error occurred while updating player score', error.message);
        }
    }

    @SubscribeMessage(SocketsSubscribeEvents.SetFinalAnswer)
    setFinalAnswer(@ConnectedSocket() client: Socket, @MessageBody() answerRequest: UpdateAnswerRequest): void {
        try {
            this.matchService.setPlayerAnswersLastAnswerTimeAndFinal(answerRequest.matchAccessCode, answerRequest.playerAnswers);
            this.server.to(answerRequest.matchAccessCode).emit(SocketsEmitEvents.FinalAnswerSet, answerRequest.playerAnswers);
            if (this.matchService.allPlayersResponded(answerRequest.matchAccessCode, answerRequest.playerAnswers.questionId)) {
                this.server.to(answerRequest.matchAccessCode).emit(SocketsEmitEvents.AllPlayersResponded);
            }
        } catch (error) {
            this.matchService.logger.log('an error occurred while setting final answer', error.message);
        }
    }

    @SubscribeMessage(SocketsSubscribeEvents.PlayerLeftAfterMatchBegun)
    disablePlayer(@ConnectedSocket() client: Socket, @MessageBody() questionRequest: QuestionRequest): void {
        try {
            this.matchService.disablePlayer({
                accessCode: questionRequest.matchAccessCode,
                playerName: questionRequest.player.name,
            });

            this.server.to(questionRequest.matchAccessCode).emit(SocketsEmitEvents.PlayerDisabled, {
                name: questionRequest.player.name,
                players: this.matchService.getPlayerFromMatch(questionRequest.matchAccessCode, questionRequest.player.name),
            });

            const match: Match = this.matchService.getMatchByAccessCode(questionRequest.matchAccessCode);
            const playersAnswersList: PlayerAnswers[] = match.getPlayersAnswersList();
            playersAnswersList.forEach((playerAnswer) => {
                if (playerAnswer.name === questionRequest.player.name) playerAnswer.isTypingQrl = false;
            });

            this.server.to(questionRequest.matchAccessCode).emit(SocketsEmitEvents.AnswerUpdated, playersAnswersList);

            if (
                this.matchService.allPlayersResponded(questionRequest.matchAccessCode, questionRequest.questionId) &&
                !questionRequest.hasQrlEvaluationBegun
            ) {
                this.server.to(questionRequest.matchAccessCode).emit(SocketsEmitEvents.AllPlayersResponded);
            }
        } catch (error) {
            this.matchService.logger.log('an error occurred', error);
        }
    }

    @SubscribeMessage(SocketsSubscribeEvents.ChangeChatAccessibility)
    changeChatAccessibilityHandler(@ConnectedSocket() client: Socket, @MessageBody() data: ChatAccessibilityRequest): void {
        try {
            if (this.matchService.getMatchByAccessCode(data.matchAccessCode)) this.matchService.updatePlayersList(data.matchAccessCode, data.players);
        } catch (error) {
            this.matchService.logger.log('chat accessibility not updated in server match');
        }
        this.server.to(data.matchAccessCode).emit(SocketsEmitEvents.ChatAccessibilityChanged, data);
    }

    @SubscribeMessage(SocketsSubscribeEvents.BeginQrlEvaluation)
    beginQrlEvaluation(@ConnectedSocket() client: Socket, @MessageBody() room: Room): void {
        this.server.to(room.id).emit(SocketsEmitEvents.QrlEvaluationBegun);
    }

    @SubscribeMessage(SocketsSubscribeEvents.FinishQrlEvaluation)
    finishQrlEvaluation(@ConnectedSocket() client: Socket, @MessageBody() room: Room): void {
        this.server.to(room.id).emit(SocketsEmitEvents.QrlEvaluationFinished);
    }

    stopTimer(timerIntervalMap: Map<string, NodeJS.Timer>, accessCode: string): void {
        clearInterval(timerIntervalMap.get(accessCode));
        timerIntervalMap.delete(accessCode);
    }
}
