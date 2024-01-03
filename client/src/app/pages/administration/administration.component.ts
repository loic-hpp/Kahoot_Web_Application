/* eslint-disable no-underscore-dangle */
import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Game } from '@app/classes/game/game';
import { NewGameNameComponent } from '@app/components/new-game-name/new-game-name.component';
import { DIALOG, SNACKBAR_DURATION, SNACKBAR_MESSAGE } from '@app/constants/constants';
import { FileManagerService } from '@app/services/file-manager-service/file-manager.service';
import { GameServiceService } from '@app/services/game-service/game-service.service';
import { Observable, Subscription, of, switchMap } from 'rxjs';

@Component({
    selector: 'app-administration',
    templateUrl: './administration.component.html',
    styleUrls: ['./administration.component.scss'],
})

/**
 * Component where the games are managed:
 * it calls the GamePanel component that includes the list of all the games
 * The administrator can add, modify or delete a game.
 * He can also import or export a game and change the game's visibility
 */
export class AdministrationComponent {
    @ViewChild('importButton') importButton: ElementRef;
    validationSubscription: Subscription;
    gamesUpdatedSubscription: Subscription;
    // eslint-disable-next-line max-params
    constructor(
        public gameService: GameServiceService,
        private fileManager: FileManagerService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
    ) {}

    getGameList(): Observable<Game[]> {
        return this.gameService.getGameList();
    }

    spreadClickOnImport(): void {
        this.importButton.nativeElement.click();
    }

    import(event: Event): void {
        this.fileManager
            .import(event)
            .then((stringGame) => {
                if (stringGame) {
                    this.processImportedGame(stringGame);
                }
            })
            .catch((e) => {
                window.alert("L'importation a échoué\n" + JSON.stringify(e));
            });
    }

    /*
     * validate recursively game name then import it */
    validateNameRecursively(game: Game): Observable<boolean> {
        return this.gameService.validateName(game.title).pipe(
            switchMap((nameExists: boolean) => {
                if (!nameExists) {
                    // if name is valid
                    this.gameService.nameExists = nameExists;
                    this.gameService.importGame(game);
                    this.validationSubscription.unsubscribe(); // Stop the validation
                    this.showSnackbar(SNACKBAR_MESSAGE.gameImported);
                    return of(false);
                } else {
                    // If name is not valid, continue validation recursively
                    return this.dialog
                        .open(NewGameNameComponent, { width: DIALOG.newNameWidth })
                        .afterClosed()
                        .pipe(
                            switchMap(() => {
                                if (!this.gameService.adminCanceledImport) return this.validateNameRecursively(game);
                                else {
                                    this.gameService.adminCanceledImport = false;
                                    return of(true);
                                }
                            }),
                        );
                }
            }),
        );
    }

    importedTypeAreValid(game: Game): boolean {
        const validationMessages = Game.validateAttributesTypes(game);
        this.gameService.errorMessages = validationMessages;
        return validationMessages.length === 0;
    }

    private processValidGame(): void {
        if (this.gameService.questionSrv.validateAllQuestions()) {
            this.validationSubscription = this.validateNameRecursively(this.gameService.currentGame).subscribe();
        } else {
            this.gameService.questionSrv.displayErrors();
            this.gameService.resetCurrentGame();
        }
    }

    private processImportedGame(stringGame: string): void {
        try {
            const game = JSON.parse(stringGame) as Game;
            if (this.importedTypeAreValid(game)) {
                this.gameService.currentGame = Game.parseGame(game);
                this.gameService.questionSrv.questions = game.questions;
                this.gameService.nameExists = false; // should be set true after if necessary
                if (this.gameService.isCurrentGameValid()) {
                    this.processValidGame();
                } else {
                    this.gameService.displayErrors();
                    this.gameService.resetCurrentGame();
                }
            } else {
                this.gameService.displayErrors();
            }
        } catch (e) {
            if (e instanceof SyntaxError) window.alert("L'importation a échoué car le JSON n'est pas valide");
            else window.alert('Une erreur est survenue ' + JSON.stringify(e));
        }
    }

    private showSnackbar(message: string): void {
        this.snackBar.open(message, 'Fermer', {
            duration: SNACKBAR_DURATION,
        });
    }
}
