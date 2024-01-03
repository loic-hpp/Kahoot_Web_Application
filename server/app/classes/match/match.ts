import { PlayerAnswers } from '@app/classes/player-answers/player-answers';
import { Question } from '@app/classes/question/question';
import { ERRORS } from '@app/constants/constants';
import { IMatch } from '@app/interfaces/i-match';
import { Player } from '@app/interfaces/player';
import { UpdateAnswerRequest } from '@app/interfaces/update-answer-request';
import { Game } from '@app/model/database/game';
import { MatchHistory } from '@app/model/database/match-history';

/** Class used to represent a match in the server
 * with all the methods necessary to manage the match*/
export class Match {
    game: Game;
    begin: string;
    end: string;
    bestScore: number;
    accessCode: string;
    testing: boolean;
    players: Player[];
    managerName: string;
    isAccessible: boolean;
    bannedNames: string[];
    playerAnswers: PlayerAnswers[];
    panicMode: boolean = false;
    timer: number;
    timing: boolean = true;

    constructor(data: Partial<Match> = {}) {
        this.game = data.game || null;
        this.begin = data.begin || '';
        this.end = data.end || '';
        this.bestScore = data.bestScore || 0;
        this.accessCode = data.accessCode || '';
        this.testing = data.testing || false;
        this.players = data.players || [];
        this.managerName = data.managerName || '';
        this.isAccessible = data.isAccessible || false;
        this.bannedNames = data.bannedNames || [];
        this.playerAnswers = data.playerAnswers || [];
        this.panicMode = data.panicMode || false;
        this.timer = data.timer || 0;
        this.timing = data.timing || true;
    }

    static parseMatch(match: IMatch): Match {
        const questions = match.game.questions.map((question) => new Question(question));
        const parsedMatch = new Match(match);
        parsedMatch.game.questions = questions;
        return parsedMatch;
    }

    isPlayerNameValid(name: string): boolean {
        const names = this.players.map((player) => player.name);
        return (
            !names.find((playerName) => playerName.toLowerCase() === name.toLowerCase()) &&
            !this.bannedNames.find((playerName) => playerName.toLowerCase() === name.toLowerCase())
        );
    }

    banPlayerName(name: string): void {
        this.bannedNames.push(name);
    }

    getPlayersList(): Player[] {
        return this.players;
    }

    getPlayersAnswersList(): PlayerAnswers[] {
        return this.playerAnswers;
    }
    addPlayer(player: Player): void {
        this.players.push(player);
    }

    removePlayer(playerParam: Player): void {
        const playerIndex = this.players.findIndex((player) => player.name === playerParam.name);
        if (playerIndex >= 0) this.players.splice(playerIndex, 1);
    }

    removePlayerToBannedName(playerParam: Player): void {
        const nameIndex = this.bannedNames.findIndex((name) => name === playerParam.name);
        if (nameIndex >= 0) this.bannedNames.splice(nameIndex, 1);
    }

    updatePlayerAnswers(newPlayerAnswers: UpdateAnswerRequest): void {
        const answersIndex: number = this.playerAnswers.findIndex(
            (playerAnswers) =>
                playerAnswers.name === newPlayerAnswers.playerAnswers.name && playerAnswers.questionId === newPlayerAnswers.playerAnswers.questionId,
        );
        if (answersIndex < 0) {
            this.playerAnswers.push(new PlayerAnswers(newPlayerAnswers.playerAnswers));
        } else {
            this.playerAnswers[answersIndex].qcmAnswers = newPlayerAnswers.playerAnswers.qcmAnswers;
            this.playerAnswers[answersIndex].isTypingQrl = newPlayerAnswers.playerAnswers.isTypingQrl;
            this.playerAnswers[answersIndex].isFirstAttempt = newPlayerAnswers.playerAnswers.isFirstAttempt;
        }
    }

    setFinalPlayerAnswers(playerAnswers: PlayerAnswers): void {
        const answers = new PlayerAnswers(playerAnswers);
        answers.final = true;
        if (this.playerAnswers.length === 0) {
            this.playerAnswers.push(answers);
        } else {
            const playerAnswerIndex = this.playerAnswers.findIndex((pa) => pa.arePlayerAnswersEqual(answers));
            if (playerAnswerIndex !== ERRORS.noIndexFound) {
                this.playerAnswers[playerAnswerIndex].qrlAnswer = answers.qrlAnswer;
                this.playerAnswers[playerAnswerIndex].lastAnswerTime = answers.lastAnswerTime;
                this.playerAnswers[playerAnswerIndex].final = answers.final;
                this.playerAnswers[playerAnswerIndex].obtainedPoints = answers.obtainedPoints;
            } else {
                this.playerAnswers.push(answers);
            }
        }
    }

    getPlayerIndexByName(playerName: string): number {
        return this.players.findIndex((p) => p.name === playerName);
    }

    /**
     *
     * @param questionId the question id
     * @returns The earliest answer time of a player
     */
    calculateEarliestLastAnswerTime(questionId: string): number {
        const relevantAnswers = this.playerAnswers.filter(
            (playerAnswers) => playerAnswers.final && playerAnswers.questionId === questionId && playerAnswers.obtainedPoints > 0,
        );
        const answerTimes = relevantAnswers.map((playerAnswers) => {
            const playerIndex: number = this.getPlayerIndexByName(playerAnswers.name);
            return playerIndex !== ERRORS.noIndexFound && this.players[playerIndex].isActive ? parseInt(playerAnswers.lastAnswerTime, 10) || 0 : 0;
        });
        if (answerTimes.length === 0) {
            return 0;
        }
        return answerTimes.reduce((max, current) => {
            return Math.max(max, current);
        }, answerTimes[0]);
    }

    /**
     *
     * @param questionId the id of the question
     * @param earliestLastAnswerTime the earliest answer time
     * @returns player with the earliest answer time
     */
    findPlayersWithEarliestLastAnswerTime(questionId: string, earliestLastAnswerTime: number): number[] {
        const playersIndexesWithEarliestLastAnswerTime = [];

        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            if (player.isActive) {
                const playerAnswer = this.playerAnswers.find(
                    (pa) => pa.name === player.name && pa.questionId === questionId && pa.final && pa.obtainedPoints > 0,
                );
                if (playerAnswer) {
                    const currentLastAnswerTime = parseInt(playerAnswer.lastAnswerTime, 10);
                    if (!isNaN(currentLastAnswerTime) && currentLastAnswerTime === earliestLastAnswerTime) {
                        playersIndexesWithEarliestLastAnswerTime.push(i);
                    }
                }
            }
        }
        return playersIndexesWithEarliestLastAnswerTime;
    }

    getFinalPlayerAnswers(questionId: string): PlayerAnswers[] {
        return this.playerAnswers.filter((pa) => {
            const associatedPlayer = this.players.find((player) => player.name === pa.name);
            return associatedPlayer && associatedPlayer.isActive && pa.questionId === questionId && pa.final;
        });
    }

    getMatchHistory(): MatchHistory {
        return {
            matchAccessCode: this.accessCode,
            bestScore: this.getBestScore(),
            startTime: this.begin,
            nStartPlayers: this.players.length,
            gameName: this.game.title,
        };
    }

    getBestScore(): number {
        return this.players.reduce((prevPlayer, currentPlayer) => (prevPlayer.score > currentPlayer.score ? prevPlayer : currentPlayer)).score;
    }
}
