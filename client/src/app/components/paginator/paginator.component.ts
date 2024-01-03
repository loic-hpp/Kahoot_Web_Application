/* eslint-disable no-underscore-dangle */
import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Game } from '@app/classes/game/game';
import { GameServiceService } from '@app/services/game-service/game-service.service';

@Component({
    selector: 'app-paginator',
    templateUrl: './paginator.component.html',
    styleUrls: ['./paginator.component.scss'],
})
export class PaginatorComponent implements OnInit, AfterViewInit {
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @Input() inAdminVue: boolean = false;
    nbGames: number = 0;
    dataSource = new MatTableDataSource<Game>();
    constructor(public gameService: GameServiceService) {}

    ngOnInit(): void {
        this.gameService.getGameList().subscribe((games) => {
            this.updateVisibleGamesCount(games);
            if (!this.inAdminVue) {
                games = games.filter((game) => game.isVisible);
            }
            this.dataSource.data = games.slice(0, this.paginator.pageSize);
        });
        this.gameService.gamesUpdated$.subscribe(() => {
            const event: PageEvent = { pageIndex: this.paginator.pageIndex, pageSize: this.paginator.pageSize } as PageEvent;
            this.onPageChange(event);
        });

        this.gameService.gameVisibility$.subscribe(() => {
            const event: PageEvent = { pageIndex: this.paginator.pageIndex, pageSize: this.paginator.pageSize } as PageEvent;
            this.onPageChange(event);
        });
    }

    ngAfterViewInit(): void {
        if (this.paginator) {
            this.paginator._intl.itemsPerPageLabel = 'Jeux par page:';
            this.paginator._intl.nextPageLabel = 'Page suivante';
            this.paginator._intl.previousPageLabel = 'Page précédente';
            this.paginator._intl.getRangeLabel = (page: number, pageSize: number, length: number): string => {
                if (length === 0 || pageSize === 0) {
                    return `0 -- ${length} de ${length}`;
                }

                length = Math.max(length, 0);

                const startIndex = page * pageSize;
                const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;

                return `${startIndex + 1} -- ${endIndex} de ${length}`;
            };
        }
    }

    updateVisibleGamesCount(games: Game[]): void {
        if (!this.inAdminVue) {
            games = games.filter((game) => game.isVisible);
        }
        this.nbGames = games.length;
    }
    onPageChange(event: PageEvent): void {
        this.gameService.getGameList().subscribe((games) => {
            if (!this.inAdminVue) {
                games = games.filter((game) => game.isVisible);
            }
            this.dataSource.data = games.slice(event.pageIndex * event.pageSize, (event.pageIndex + 1) * event.pageSize);

            this.updateVisibleGamesCount(games);

            if (this.dataSource.data.length === 0) {
                this.paginator.previousPage();
            }
        });
    }

    navigatePreview(id: string): void {
        this.gameService.verifyGameIsAvailable(id, `create/preview/games/${id}`);
    }
}
