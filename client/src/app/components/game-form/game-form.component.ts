import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NavigationEnd, Router } from '@angular/router';
import { CreateQuestionComponent } from '@app/components/create-question/create-question.component';
import { DIALOG, QCM_TIME } from '@app/constants/constants';
import { GameServiceService } from '@app/services/game-service/game-service.service';

/**
 * Component that manages the game's creation and modification form
 *
 * @class GameFormComponent
 * @implements {OnInit}
 */
@Component({
    selector: 'app-game-form',
    templateUrl: './game-form.component.html',
    styleUrls: ['./game-form.component.scss'],
})
export class GameFormComponent implements OnInit {
    constructor(
        public gameService: GameServiceService,
        public dialog: MatDialog,
        private router: Router,
    ) {}

    ngOnInit(): void {
        this.gameService.currentGame.duration = QCM_TIME.min;
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                this.gameService.resetCurrentGame();
            }
        });
    }

    validateQcmTime(): void {
        if (!this.gameService.currentGame.validateQcmTime(this.gameService.currentGame.duration)) {
            window.alert('Le temps des QCM doit être compris entre 10 et 60 secondes');
            this.gameService.currentGame.duration = this.gameService.currentGame.duration > QCM_TIME.max ? QCM_TIME.max : QCM_TIME.min;
        }
    }

    validateNameInput(): boolean {
        return this.gameService.currentGame.validateTextField(this.gameService.currentGame.title);
    }

    validateDescriptionInput(): boolean {
        return this.gameService.currentGame.validateTextField(this.gameService.currentGame.description);
    }

    onOpenQuestionForm(): void {
        this.dialog.open(CreateQuestionComponent, { width: DIALOG.questionFormWidth, disableClose: true });
    }
}
