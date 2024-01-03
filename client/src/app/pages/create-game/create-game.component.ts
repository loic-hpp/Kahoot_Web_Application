import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { Game } from '@app/classes/game/game';
import { DIALOG_MESSAGE, SNACKBAR_DURATION, SNACKBAR_MESSAGE } from '@app/constants/constants';
import { CancelConfirmationService } from '@app/services/cancel-confirmation/cancel-confirmation.service';
import { GameServiceService } from '@app/services/game-service/game-service.service';

@Component({
    selector: 'app-create-game',
    templateUrl: './create-game.component.html',
    styleUrls: ['./create-game.component.scss'],
})

/**
 * Manages the creation and modification of a game by using the game form component and adding elements
 * to save the creation or modification or cancel it.
 */
export class CreateGameComponent implements OnInit {
    oldGameName: string;

    // eslint-disable-next-line max-params
    constructor(
        public gameService: GameServiceService,
        private confirmationService: CancelConfirmationService,
        private route: ActivatedRoute,
        private snackBar: MatSnackBar,
    ) {}

    ngOnInit(): void {
        const gameId = this.route.snapshot.params['id'];
        if (gameId) {
            this.gameService.getGameById(gameId).subscribe((game: Game) => {
                this.gameService.currentGame = game;
                this.oldGameName = game.title;
                this.gameService.questionSrv.questions = this.gameService.currentGame.questions;
            });
        }
    }

    onSave(): void {
        if (this.gameService.currentGame.id) {
            this.onUpdateGame();
        } else {
            this.onCreateGame();
        }
    }

    onCancel(): void {
        this.confirmationService.askConfirmation(
            () => {
                this.gameService.resetCurrentGame();
                this.gameService.router.navigateByUrl('administration/home');
            },
            this.gameService.currentGame.id ? DIALOG_MESSAGE.cancelModifyGame : DIALOG_MESSAGE.cancelGameCreation,
        );
    }

    onCreateGame(): void {
        this.gameService.validateName(this.gameService.currentGame.title).subscribe({
            error: (e) => {
                window.alert('Une erreur est survenue' + JSON.stringify(e));
            },
            next: (nameExists) => {
                try {
                    this.validNameHandler(nameExists);
                } catch (e) {
                    window.alert('Une erreur est survenue' + JSON.stringify(e));
                }
            },
        });
    }

    onUpdateGame(): void {
        this.gameService.validateName(this.gameService.currentGame.title).subscribe({
            error: (e) => {
                window.alert('Une erreur est survenue' + JSON.stringify(e));
            },
            next: (nameExists) => {
                this.gameService.nameExists = this.oldGameName === this.gameService.currentGame.title ? false : nameExists;
                if (this.gameService.completeUpdateIsSuccessful()) {
                    this.gameService.verifyGameExists(this.gameService.currentGame).subscribe({
                        next: () => {
                            this.gameService.updateGame(this.gameService.currentGame).subscribe({
                                next: () => {
                                    this.gameService.router.navigateByUrl('administration/home');
                                    this.showSnackbar(SNACKBAR_MESSAGE.gameUpdated);
                                },
                            });
                        },
                        error: () => {
                            if (this.gameService.completeCreationIsSuccessful())
                                this.gameService.createGame().subscribe({
                                    next: () => {
                                        this.gameService.router.navigateByUrl('administration/home');
                                    },
                                });
                        },
                    });
                }
            },
        });
    }

    validNameHandler(nameExists: boolean): void {
        this.gameService.currentGame.questions.forEach((question) => (question.timeAllowed = this.gameService.currentGame.duration));
        this.gameService.nameExists = nameExists;
        if (this.gameService.completeCreationIsSuccessful()) {
            this.gameService.createGame().subscribe({
                next: () => {
                    this.gameService.router.navigateByUrl('administration/home');
                    this.showSnackbar(SNACKBAR_MESSAGE.gameCreated);
                },
            });
        }
    }

    private showSnackbar(message: string): void {
        this.snackBar.open(message, 'Fermer', {
            duration: SNACKBAR_DURATION,
        });
    }
}
