import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Game } from '@app/classes/game/game';
import { KeyGenerator } from '@app/classes/key-generator/key-generator';
import { Match } from '@app/classes/match/match';
import { CHAR_SETS, LENGTHS, NAMES } from '@app/constants/constants';
import { MatchRouteParams } from '@app/interfaces/match-route-params';
import { GameServiceService } from '@app/services/game-service/game-service.service';
import { MatchPlayerService } from '@app/services/match-player-service/match-player.service';
import { Observable, Subscription, of, switchMap, tap } from 'rxjs';

@Component({
    selector: 'app-game-preview',
    templateUrl: './game-preview.component.html',
    styleUrls: ['./game-preview.component.scss'],
})

/**
 * Component that shows a selected game details.
 * The manager can create a match with that game or he can test it
 * On both cases, if the game was deleted or is no longer visible, he will be notified
 * and redirected to the Creation view so he can select another game from the updated list
 */
export class GamePreviewComponent implements OnInit {
    validationSubscription: Subscription;
    game$: Observable<Game>;
    currentGame: Game;
    private keyGenerator: KeyGenerator = new KeyGenerator();
    private accessCode: string = 'xxxx';

    constructor(
        private gameService: GameServiceService,
        private route: ActivatedRoute,
        private matchPlayerService: MatchPlayerService,
    ) {}

    ngOnInit(): void {
        this.game$ = this.gameService.getGameById(this.route.snapshot.params['id']).pipe(
            tap((game) => {
                this.currentGame = game;
            }),
        );
        this.game$.subscribe({
            error: (err) => {
                window.alert(err);
            },
        });
        this.gameService.gameVisibility$.subscribe({
            next: () => {
                this.gameService.router.navigateByUrl('/create');
            },
        });
    }

    getCurrentFormattedTime(): string {
        const date = new Date();
        const dateLocale = date.toLocaleDateString('sv-SE');
        const timeLocale = date.toLocaleTimeString('sv-SE');
        return `${dateLocale} ${timeLocale}`;
    }

    onCreateMatch(id: string): void {
        const matchInfo: MatchRouteParams = { id, testing: false };
        this.validateAccessCodeRecursively().subscribe(() => {
            this.gameService.verifyGameIsAvailable(id, `create/wait/game/${JSON.stringify(matchInfo)}`);
            this.matchPlayerService.setCurrentMatch(
                new Match({
                    game: this.currentGame,
                    begin: this.getCurrentFormattedTime(),
                    end: '',
                    bestScore: 0,
                    accessCode: this.accessCode,
                    testing: false,
                    players: [],
                    managerName: `${NAMES.manager.toLowerCase()}`,
                    isAccessible: true,
                    bannedNames: [`${NAMES.manager.toLowerCase()}`, `${NAMES.system.toLowerCase()}`],
                    playerAnswers: [],
                    panicMode: false,
                    timer: 0,
                    timing: true,
                }),
                {
                    name: NAMES.manager,
                    isActive: true,
                    score: 0,
                    nBonusObtained: 0,
                    chatBlocked: false,
                },
            );
            this.matchPlayerService.initializeScore();
        });
    }

    onTestGame(id: string): void {
        this.validateAccessCodeRecursively().subscribe(() => {
            this.gameService.verifyGameIsAvailable(id, `play/match/${id}`);
            this.matchPlayerService.setCurrentMatch(
                new Match({
                    game: this.currentGame,
                    begin: this.getCurrentFormattedTime(),
                    end: '',
                    bestScore: 0,
                    accessCode: this.accessCode,
                    testing: true,
                    players: [],
                    managerName: `${NAMES.manager.toLowerCase()}`,
                    isAccessible: true,
                    bannedNames: [`${NAMES.manager.toLowerCase()}`, `${NAMES.system.toLowerCase()}`],
                    playerAnswers: [],
                    panicMode: false,
                    timer: 0,
                    timing: true,
                }),
                {
                    name: NAMES.tester,
                    isActive: true,
                    score: 0,
                    nBonusObtained: 0,
                    chatBlocked: false,
                },
            );
            this.matchPlayerService.initializeScore();
        });
    }

    validateAccessCodeRecursively(): Observable<boolean> {
        this.accessCode = this.keyGenerator.generateKey(CHAR_SETS.accessCode, LENGTHS.accessCode);
        return this.matchPlayerService.validateAccessCode(this.accessCode).pipe(
            switchMap((accessCodeExists: boolean) => {
                if (!accessCodeExists) {
                    return of(true);
                } else {
                    return this.validateAccessCodeRecursively();
                }
            }),
        );
    }
}
