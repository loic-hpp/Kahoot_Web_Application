import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { FACTORS, NAMES, PLAYERS_NAME_COLORS, SocketsSendEvents } from '@app/constants/constants';
import { ChatAccessibilityRequest } from '@app/interfaces/chat-accessibility-request';
import { Player } from '@app/interfaces/player';
import { HistogramService } from '@app/services/histogram-service/histogram.service';
import { MatchPlayerService } from '@app/services/match-player-service/match-player.service';

/**
 * Component that provides the template for the players list with name and score columns.
 * If its the match results view we add a nBonusObtained column,
 * and players are sorted by score in descending order.
 * The list can also be sorted by the client using arrows next to each column title
 *
 * @class PlayersListComponent
 * @implements {OnInit, AfterViewInit}
 */
@Component({
    selector: 'app-players-list',
    templateUrl: './players-list.component.html',
    styleUrls: ['./players-list.component.scss'],
})
export class PlayersListComponent implements OnInit, AfterViewInit {
    @ViewChild(MatSort) sort: MatSort;
    @Input() isResultView: boolean = false;
    displayedColumns: string[] = ['state', 'name', 'score', 'chatAccessibility'];
    blockedPlayerName: string[];
    isSortingByStateAscending: boolean = false;
    isSortingByPlayersState: boolean = false;

    constructor(
        public matchPlayerService: MatchPlayerService,
        private histogramService: HistogramService,
    ) {}

    ngOnInit(): void {
        this.matchPlayerService.initializePlayersList();
        this.clearSortingByPlayersState();
        this.blockedPlayerName = [];
        if (this.isResultView) {
            if (this.matchPlayerService.player.name === NAMES.manager)
                this.displayedColumns = ['name', 'score', 'nBonusObtained', 'chatAccessibility'];
            else this.displayedColumns = ['name', 'score', 'nBonusObtained'];
            this.sortPlayersListByDefault();
        }
    }

    ngAfterViewInit(): void {
        this.matchPlayerService.dataSource.sort = this.sort;
    }

    hasPlayerResponded(playerName: string): boolean {
        return !!this.histogramService.playersAnswered.find((name) => name === playerName);
    }

    playerHasQuitted(playerName: string): boolean {
        return !!this.histogramService.quittedPlayers.find((name) => name === playerName);
    }

    playerHasFinalAnswer(playerName: string): boolean {
        return !!this.histogramService.playersWithFinalAnswers.find((name) => name === playerName);
    }

    getDisplayColor(playerName: string): string {
        if (this.isResultView) return PLAYERS_NAME_COLORS.black;
        if (this.playerHasQuitted(playerName)) return PLAYERS_NAME_COLORS.black;
        if (this.playerHasFinalAnswer(playerName)) return PLAYERS_NAME_COLORS.green;
        else if (this.hasPlayerResponded(playerName)) return PLAYERS_NAME_COLORS.yellow;
        else return PLAYERS_NAME_COLORS.red;
    }

    sortPlayersListByDefault(): void {
        this.matchPlayerService.dataSource.data.sort((firstPlayer, nextPlayer) => {
            const scoreComparison = nextPlayer.score - firstPlayer.score;
            if (scoreComparison === 0) {
                return firstPlayer.name.localeCompare(nextPlayer.name);
            }
            return scoreComparison;
        });
        this.matchPlayerService.dataSource.sort = this.sort;
    }

    sortByPlayersState(): void {
        this.sort?.sort({ id: '', start: 'asc', disableClear: false });
        if (!this.isSortingByStateAscending && this.isSortingByPlayersState) {
            this.isSortingByPlayersState = false;
            this.matchPlayerService.dataSource.sort = this.sort;
            return;
        }
        this.isSortingByPlayersState = true;
        this.isSortingByStateAscending = !this.isSortingByStateAscending;
        const factor = this.isSortingByStateAscending ? FACTORS.ascendingSort : FACTORS.descendingSort;
        this.matchPlayerService.dataSource.data.sort((firstPlayer, nextPlayer) => {
            const stateComparison = factor * this.comparePlayersStates(firstPlayer, nextPlayer);
            if (stateComparison === 0) {
                return firstPlayer.name.localeCompare(nextPlayer.name);
            }
            return stateComparison;
        });
        this.matchPlayerService.dataSource.sort = this.sort;
    }

    comparePlayersStates(firstPlayer: Player, nextPlayer: Player): number {
        const colorsOrder: string[] = [PLAYERS_NAME_COLORS.black, PLAYERS_NAME_COLORS.green, PLAYERS_NAME_COLORS.yellow, PLAYERS_NAME_COLORS.red];
        return (
            colorsOrder.findIndex((color) => this.getDisplayColor(firstPlayer.name) === color) -
            colorsOrder.findIndex((color) => this.getDisplayColor(nextPlayer.name) === color)
        );
    }

    clearSortingByPlayersState(): void {
        this.isSortingByPlayersState = false;
        this.isSortingByStateAscending = false;
    }

    sendChatAccessibility(name: string): void {
        this.matchPlayerService.match.players.forEach((player) => {
            if (player.name === name) {
                player.chatBlocked = !player.chatBlocked;
            }
        });
        this.matchPlayerService.socketService.send<ChatAccessibilityRequest>(SocketsSendEvents.ChangeChatAccessibility, {
            matchAccessCode: this.matchPlayerService.match.accessCode,
            name,
            players: this.matchPlayerService.match.players,
        });
    }
}
