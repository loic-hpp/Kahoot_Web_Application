import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Game } from '@app/classes/game/game';
import { KeyGenerator } from '@app/classes/key-generator/key-generator';
import { CHAR_SETS, HTTP_RESPONSES, LENGTHS } from '@app/constants/constants';
import { QuestionService } from '@app/services/question-service/question.service';
import { Observable, Subject, map, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
/**
 * Manages the validation, addition, modification and deletion of a game
 */
export class GameServiceService {
    keyGenerator: KeyGenerator = new KeyGenerator();
    gameVisibilitySubject: Subject<string> = new Subject<string>();
    gameVisibility$ = this.gameVisibilitySubject.asObservable();
    currentGame: Game;
    adminCanceledImport: boolean = false;
    nameExists: boolean;
    errorMessages: string[] = [];
    gameExists: boolean = false;
    gamesUpdatedSubject = new Subject<void>();
    gamesUpdated$ = this.gamesUpdatedSubject.asObservable();
    private games$: Observable<Game[]>;

    constructor(
        private http: HttpClient,
        public questionSrv: QuestionService,
        public router: Router,
    ) {
        this.resetCurrentGame();
        this.updateGameList();
    }

    /**
     * Updates the gameService's games list with the last version in the database
     */
    updateGameList(): void {
        this.games$ = this.getAllGames().pipe(map((games) => Game.parseGames(games)));
        this.gamesUpdatedSubject.next();
    }

    /**
     * Completes the creation of a new game and returns if the operation was successful or displays errors if the game completed isn't valid
     * @returns if all current games attributes was set successfully
     */
    completeCreationIsSuccessful(): boolean {
        this.setMissingAttributes();
        if (this.isCurrentGameValid()) {
            this.currentGame.id = this.generateId(LENGTHS.gameId);
            return true;
        } else {
            this.displayErrors();
            return false;
        }
    }

    /**
     * Displays the errors that caused the non validation of a game
     */
    displayErrors(): void {
        window.alert(`L'enregistrement du jeu a échoué à cause des erreurs suivantes : \n${this.errorMessages.join('\n')}`);
        this.errorMessages = [];
    }

    /**
     * Completes the modification  of a existing game and returns if the operation was successful or displays errors if the game completed isn't valid
     * @returns if all games attributes was set successfully
     */
    completeUpdateIsSuccessful(): boolean {
        this.setCommonAttributes();
        if (this.isCurrentGameValid()) return true;
        else {
            this.displayErrors();
            return false;
        }
    }

    isCurrentGameValid(): boolean {
        this.errorMessages = this.currentGame.validateGame(this.nameExists);
        return this.errorMessages.length === 0;
    }

    /**
     * Call the add game method to add the current game in the games list then reset the current game
     * @returns an observable of the game created
     */
    createGame(): Observable<Game> {
        return this.addGame(this.currentGame).pipe(
            map((game) => {
                this.resetCurrentGame();
                return game;
            }),
        );
    }

    verifyGameIsAvailable(id: string, route: string): void {
        this.getGameById(id)
            .pipe(
                tap((game) => {
                    if (game?.isVisible) {
                        this.router.navigateByUrl(route);
                    } else {
                        window.alert("Ce jeu n'est plus accessible. Veuillez choisir un autre jeu de la liste suivante");
                        this.gameVisibilitySubject.next('Game no more visible');
                        this.updateGameList();
                    }
                }),
            )
            .subscribe({
                error: (err) => {
                    if (err.status === HTTP_RESPONSES.notFound) {
                        window.alert("Le jeu n'a pas été trouvé. Veuillez choisir un autre jeu de la liste suivante");
                        this.gameVisibilitySubject.next('Game no more visible');
                        this.updateGameList();
                    } else {
                        window.alert("Une erreur s'est produite.");
                    }
                },
            });
    }

    getGameById(id: string): Observable<Game> {
        return this.http.get<Game>(`${environment.serverUrl}/games/${id}`).pipe(map((game) => Game.parseGame(game)));
    }

    deleteGame(id: string): Observable<Game | null> {
        return this.http.delete<Game | null>(`${environment.serverUrl}/games/${id}`).pipe(
            tap(() => {
                this.updateGameList();
            }),
        );
    }

    addGame(game: Game): Observable<Game> {
        return this.http.post<Game>(`${environment.serverUrl}/games`, game).pipe(
            tap(() => {
                this.updateGameList();
            }),
        );
    }

    /**
     * completes the the missing attributes in an imported game then adds it to the games list if it's valid
     * @param game imported game to add in the games list
     */
    importGame(game: Game): void {
        this.currentGame = game;
        game.questions.forEach((question) => {
            question.id = this.generateId(LENGTHS.questionId);
            question.timeAllowed = game.duration;
        });
        this.questionSrv.questions = game.questions;
        if (this.completeCreationIsSuccessful()) this.createGame().subscribe();
    }

    updateGame(game: Game): Observable<Game> {
        if (this.gameExists) {
            return this.http.put<Game>(`${environment.serverUrl}/games`, game).pipe(
                tap(() => {
                    this.updateGameList();
                    this.resetCurrentGame();
                }),
            );
        } else {
            return this.addGame(game).pipe();
        }
    }

    /**
     * @param game game to verify if it already exists in the games list
     * @returns an observable of the game
     */
    verifyGameExists(game: Game): Observable<Game> {
        return this.getGameById(game.id).pipe(
            tap(() => {
                this.gameExists = true;
            }),
        );
    }

    updateGameVisibility(id: string, isVisible: boolean): Observable<Game> {
        const updateData = { isVisible };
        return this.http.patch<Game>(environment.serverUrl + `/games/${id}/update-visibility`, updateData);
    }

    /**
     * sets attributes that need to be set in the creation and modification of a game
     */
    setCommonAttributes(): void {
        this.currentGame.questions = this.questionSrv.questions;

        const date = new Date();
        const dateLocale = date.toLocaleDateString('sv-SE');
        const timeLocale = date.toLocaleTimeString('sv-SE');
        const dateTimeLocale = `${dateLocale} ${timeLocale}`;

        this.currentGame.lastModification = dateTimeLocale;
    }

    /**
     * sets attributes that only need to be set in the creation of a new game
     */
    setMissingAttributes(): void {
        this.setCommonAttributes();
        this.currentGame.isVisible = false;
    }

    resetCurrentGame(): void {
        this.currentGame = new Game();
        this.currentGame.questions = [];
        this.questionSrv.resetQuestions();
    }

    validateName(title: string): Observable<boolean> {
        return this.http.post<{ titleExists: boolean }>(`${environment.serverUrl}/games/title`, { title }).pipe(map((result) => result.titleExists));
    }

    generateId(length: number): string {
        return this.keyGenerator.generateKey(CHAR_SETS.id, length);
    }

    getGameList(): Observable<Game[]> {
        return this.games$;
    }

    /**
     * @returns the games list from database
     */
    getAllGames(): Observable<Game[]> {
        return this.http.get<Game[]>(`${environment.serverUrl}/games`);
    }
}
