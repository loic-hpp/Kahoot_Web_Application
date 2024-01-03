import { Component, Input, OnInit, Renderer2 } from '@angular/core';
import { Game } from '@app/classes/game/game';
import { DIALOG_MESSAGE } from '@app/constants/constants';
import { CancelConfirmationService } from '@app/services/cancel-confirmation/cancel-confirmation.service';
import { GameServiceService } from '@app/services/game-service/game-service.service';

/**
 * The `GamePanelComponent` represents a user interface component that displays and manages individual game panels
 * within the administrative dashboard. Each panel allows users to interact with and perform various actions on
 * a specific game, such as toggling its visibility, exporting it as a JSON file, or navigating to a modification page.
 *
 * @class GamePanelComponent
 * @implements {OnInit}
 */

@Component({
    selector: 'app-game-panel',
    templateUrl: './game-panel.component.html',
    styleUrls: ['./game-panel.component.scss'],
})
export class GamePanelComponent implements OnInit {
    @Input() gameDirective: Game;

    isVisible: boolean = true;

    constructor(
        private gameService: GameServiceService,
        private renderer: Renderer2,
        private confirmationService: CancelConfirmationService,
    ) {}

    ngOnInit(): void {
        this.isVisible = this.gameDirective.isVisible;
    }

    toggleVisibility(): void {
        this.gameService.verifyGameExists(this.gameDirective).subscribe({
            next: () => {
                if (this.gameService.gameExists) {
                    this.isVisible = !this.isVisible;
                    this.gameService.updateGameVisibility(this.gameDirective.id, this.isVisible).subscribe({
                        error: (error: unknown) => {
                            window.alert('Error occurred while updating visibility' + error);
                        },
                    });
                } else {
                    window.alert('Ce jeu a deja ete supprime');
                    this.gameService.updateGameList();
                }
            },
            error: () => {
                window.alert('Ce jeu a deja ete supprime');
                this.gameService.updateGameList();
            },
        });
    }

    deleteGameWithConfirmation(): void {
        this.confirmationService.askConfirmation(this.deleteGame.bind(this), DIALOG_MESSAGE.gameDeletion);
    }

    deleteGame(): void {
        this.gameService.verifyGameExists(this.gameDirective).subscribe({
            next: () => {
                if (this.gameService.gameExists) {
                    this.gameService.deleteGame(this.gameDirective.id).subscribe({
                        error: (error: unknown) => {
                            window.alert('Error occurred while deleting game' + error);
                        },
                    });
                } else {
                    window.alert('Ce jeu a deja ete supprime');
                    this.gameService.updateGameList();
                }
            },
            error: () => {
                window.alert('Ce jeu a deja ete supprime');
                this.gameService.updateGameList();
            },
        });
    }

    navigateModify(): void {
        this.gameService.verifyGameExists(this.gameDirective).subscribe({
            next: () => {
                if (this.gameService.gameExists) {
                    this.gameService.router.navigateByUrl(`administration/create-game/${this.gameDirective.id}`);
                } else {
                    window.alert('Le jeu a été supprimé');
                }
            },
            error: () => {
                this.gameService.updateGameList();
                window.alert('Le jeu a été supprimé');
            },
        });
    }

    export(): void {
        this.gameService.verifyGameExists(this.gameDirective).subscribe({
            next: () => {
                if (this.gameService.gameExists) {
                    this.exportGame();
                } else {
                    window.alert('Le jeu a été supprimé');
                }
            },
            error: () => {
                this.gameService.updateGameList();
                window.alert('Le jeu a été supprimé');
            },
        });
    }

    filterStringify(game: Game): string {
        const propertiesToCheck: string[] = ['isVisible', '_id', '__v'];
        return JSON.stringify(game, (key, value) => {
            if (key === 'questions' && Array.isArray(value)) {
                return value.map((question) => {
                    if (question && typeof question === 'object' && 'id' in question && 'timeAllowed' in question) {
                        delete question.id;
                        delete question.timeAllowed;
                    }
                    return question;
                });
            }
            if (propertiesToCheck.includes(key)) {
                return undefined;
            }
            return value;
        });
    }

    exportGame(): void {
        const gameJson: string = this.filterStringify(this.gameDirective);
        const blob: Blob = new Blob([gameJson], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const downloadLink = this.renderer.createElement('a');
        this.renderer.setAttribute(downloadLink, 'href', url);
        this.renderer.setAttribute(downloadLink, 'download', `${this.gameDirective.title}.json`);

        downloadLink.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        window.URL.revokeObjectURL(url);
    }
}
