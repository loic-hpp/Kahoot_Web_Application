import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DIALOG_MESSAGE } from '@app/constants/constants';
import { DisplayableMatchHistory } from '@app/interfaces/displayable-match-history';
import { MatchHistory } from '@app/interfaces/match-history';
import { CancelConfirmationService } from '@app/services/cancel-confirmation/cancel-confirmation.service';
import { MatchCommunicationService } from '@app/services/match-communication/match-communication.service';
import { tap } from 'rxjs';

@Component({
    selector: 'app-history',
    templateUrl: './history.component.html',
    styleUrls: ['./history.component.scss'],
})
export class HistoryComponent implements OnInit {
    @ViewChild(MatSort) sort: MatSort;
    dataSource: MatTableDataSource<DisplayableMatchHistory>;
    displayedColumns: string[] = ['gameName', 'bestScore', 'nStartPlayers', 'startTime'];

    constructor(
        private confirmationService: CancelConfirmationService,
        public matchCommunicationService: MatchCommunicationService,
    ) {}

    ngOnInit(): void {
        this.setDataSource();
    }

    setDataSource(): void {
        this.matchCommunicationService
            .getMatchHistory()
            .pipe(
                tap((matchHistory) => {
                    this.dataSource = new MatTableDataSource(this.convertToDisplayableMatchHistory(matchHistory));
                    this.dataSource.sort = this.sort;
                }),
            )
            .subscribe();
    }

    deleteMatchHistory(): void {
        this.confirmationService.askConfirmation(() => {
            this.matchCommunicationService.deleteMatchHistory().subscribe(this.setDataSource.bind(this));
        }, DIALOG_MESSAGE.clearHistory);
    }

    convertToDisplayableMatchHistory(matchHistory: MatchHistory[]): DisplayableMatchHistory[] {
        return matchHistory.map((data) => {
            return {
                matchAccessCode: data.matchAccessCode,
                bestScore: data.bestScore,
                startTime: new Date(data.startTime),
                nStartPlayers: data.nStartPlayers,
                gameName: data.gameName,
            };
        });
    }
}
