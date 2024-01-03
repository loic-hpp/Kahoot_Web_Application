import { Match } from '@app/classes/match/match';
import { PlayerAnswers } from '@app/classes/player-answers/player-answers';
import { Question } from '@app/classes/question/question';
import { ERRORS, FACTORS, QUESTION_TYPE } from '@app/constants/constants';
import { Player } from '@app/interfaces/player';
import { UpdateAnswerRequest } from '@app/interfaces/update-answer-request';
import { UpdateMatch } from '@app/interfaces/update-match';
import { Validation } from '@app/interfaces/validation';
import { MatchHistory, MatchHistoryDocument } from '@app/model/database/match-history';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
/** Class responsible of the management of matches. All actions performed on a match
 * are made through this class
 */
export class MatchService {
    matches: Match[] = [];
    constructor(
        @InjectModel(MatchHistory.name) public matchHistoryModel: Model<MatchHistoryDocument>,
        public logger: Logger,
    ) {}

    getMatchByAccessCode(accessCode: string): Match {
        this.logger.log('Match returned');
        const matchR: Match = this.matches.find((match) => match.accessCode === accessCode);
        if (!matchR) {
            throw new Error('Match not found');
        }
        return matchR;
    }

    accessCodeExists(accessCode: string): boolean {
        this.logger.log('Match validity');
        return this.matches.map((match) => match.accessCode).includes(accessCode);
    }

    isPlayerNameValidForGame(bodyMessage: Validation): boolean {
        this.logger.log('Getting player name existence');
        const match: Match = this.getMatchByAccessCode(bodyMessage.accessCode);
        return match.isPlayerNameValid(bodyMessage.name);
    }

    isAccessible(accessCode: string): boolean {
        this.logger.log('Getting match accessibility');
        const match: Match = this.getMatchByAccessCode(accessCode);
        return match.isAccessible;
    }

    setAccessibility(accessCode: string): void {
        this.logger.log('Setting match accessibility');
        const match: Match = this.getMatchByAccessCode(accessCode);
        match.isAccessible = !match.isAccessible;
    }

    updatePlayersList(accessCode: string, updatedList): void {
        this.logger.log('Updating players list');
        const match: Match = this.getMatchByAccessCode(accessCode);
        match.players = updatedList;
    }

    getPlayersList(updateData: UpdateMatch): Player[] {
        const match = this.getMatchByAccessCode(updateData.accessCode);
        return match.getPlayersList();
    }

    updatePlayerAnswers(newPlayerAnswers: UpdateAnswerRequest): void {
        this.logger.log('Updating player Answers');
        const match = this.getMatchByAccessCode(newPlayerAnswers.matchAccessCode);
        match.updatePlayerAnswers(newPlayerAnswers);
    }

    addPlayer(updateData: UpdateMatch): void {
        this.logger.log('Adding a player');
        const match = this.getMatchByAccessCode(updateData.accessCode);
        match.addPlayer(updateData.player);
    }

    addPlayerToBannedPlayer(updateData: UpdateMatch): void {
        this.logger.log('Adding a player to banned Name');
        const match: Match = this.getMatchByAccessCode(updateData.accessCode);
        match.banPlayerName(updateData.player.name);
    }

    deleteMatchByAccessCode(accessCode: string): void {
        this.logger.log('Delete Match', accessCode);
        const matchIndex = this.matches.findIndex((match) => match.accessCode === accessCode);
        if (matchIndex >= 0) this.matches.splice(matchIndex, 1);
        else throw new Error('no match were deleted');
    }

    deleteAllMatches(): void {
        this.logger.log('Delete all matches');
        this.matches = [];
    }

    createMatch(newMatch: Match): void {
        this.logger.log('Adding the new match');
        this.matches.push(Match.parseMatch(newMatch));
    }

    removePlayer(updateData: UpdateMatch): void {
        const match = this.getMatchByAccessCode(updateData.accessCode);
        match.removePlayer(updateData.player);
    }

    removePlayerToBannedName(updateData: UpdateMatch): void {
        this.logger.log('Removing player to banned name list');
        const match = this.getMatchByAccessCode(updateData.accessCode);
        match.removePlayerToBannedName(updateData.player);
    }

    updatePlayerScore(accessCode: string, player: Player, questionId: string): void {
        this.logger.log('Updating player score in match: ', accessCode);
        const match: Match = this.getMatchByAccessCode(accessCode);
        const playerIndex: number = this.getPlayerIndexByName(match.players, player.name);
        const questionScore: number = player.score - match.players[playerIndex].score;
        match.players[playerIndex].score = player.score;
        const questionFound: Question = match.game.questions.find((question) => question.id === questionId);
        if (questionFound && questionFound.type === QUESTION_TYPE.qcm) {
            const playerCheckingForBonus = player;
            this.checkForBonus({ match, playerCheckingForBonus, questionId, questionScore });
        }
    }

    getPlayerFromMatch(accessCode: string, playerName: string): Player | undefined {
        return this.getMatchByAccessCode(accessCode).players.find((player) => player.name === playerName);
    }

    getPlayerIndexByName(players: Player[], playerName: string): number {
        const playerIndex: number = players.findIndex((p) => p.name === playerName);
        if (playerIndex === ERRORS.noIndexFound) throw new Error('Player not found in the match');
        return playerIndex;
    }

    getPlayerAnswers(accessCode: string, playerName: string, questionId: string): PlayerAnswers | undefined {
        return this.getMatchByAccessCode(accessCode).playerAnswers.find(
            (playerAnswers) => playerAnswers.name === playerName && playerAnswers.questionId === questionId,
        );
    }

    setPlayerAnswersLastAnswerTimeAndFinal(accessCode: string, playerAnswers: PlayerAnswers): void {
        this.logger.log(`Updating PlayerAnswers lastAnswerTime attribute for ${playerAnswers.name}`);

        const match = this.getMatchByAccessCode(accessCode);

        match.setFinalPlayerAnswers(playerAnswers);
    }

    applyBonusToPlayer(player: Player, questionScore: number): void {
        player.score += questionScore * FACTORS.firstChoice;
        player.nBonusObtained++;
    }

    checkForBonus(params: { match: Match; playerCheckingForBonus: Player; questionId: string; questionScore: number }): void {
        const { match, playerCheckingForBonus, questionId, questionScore } = params;
        this.logger.log(`${playerCheckingForBonus} checking for bonus`);

        // Calculate the earliestLastAnswerTime, which represents the bigger lastAnswerTime among all player answers.
        // In this context, the player who left the most time on the timer is considered to have answered the earliest.
        const earliestLastAnswerTime: number = match.calculateEarliestLastAnswerTime(questionId);

        const playersIndexesWithEarliestLastAnswerTime: number[] = match.findPlayersWithEarliestLastAnswerTime(questionId, earliestLastAnswerTime);

        if (playersIndexesWithEarliestLastAnswerTime.length === 1) {
            const playerIndexWithEarliestLastAnswerTime = playersIndexesWithEarliestLastAnswerTime[0];
            if (playerCheckingForBonus.name === match.players[playerIndexWithEarliestLastAnswerTime].name) {
                // Apply the bonus to the single player with the oldest time
                this.applyBonusToPlayer(match.players[playerIndexWithEarliestLastAnswerTime], questionScore);
            }
        }
    }

    disablePlayer(data: { accessCode: string; playerName: string }): void {
        const match: Match = this.getMatchByAccessCode(data.accessCode);

        const playerIndex: number = this.getPlayerIndexByName(match.players, data.playerName);
        match.players[playerIndex].isActive = false;
    }

    allPlayersResponded(accessCode: string, questionId: string): boolean {
        const match: Match = this.getMatchByAccessCode(accessCode);
        const finalQuestionPlayerAnswers: PlayerAnswers[] = match.getFinalPlayerAnswers(questionId);
        const activePlayers: Player[] = match.players.filter((player) => player.isActive);

        return finalQuestionPlayerAnswers.length === activePlayers.length;
    }

    async saveMatchHistory(matchHistory: MatchHistory): Promise<void> {
        this.logger.log('Adding the new match history');
        try {
            await this.matchHistoryModel.create(matchHistory);
        } catch (error) {
            return Promise.reject(`Failed to save match history: ${error}`);
        }
    }

    async getMatchHistory(): Promise<MatchHistory[]> {
        this.logger.log('Return match history');
        return await this.matchHistoryModel.find({});
    }

    async deleteMatchHistory(): Promise<void> {
        this.logger.log('Delete match history');
        try {
            await this.matchHistoryModel.deleteMany({});
        } catch (error) {
            return Promise.reject(`Failed to delete match history: ${error.message}`);
        }
    }
}
