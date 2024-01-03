import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MAX_ACCESS_CODE_LENGTH, MAX_PLAYER_NAME_LENGTH } from '@app/constants/constants';
import { JoinMatchService } from '@app/services/join-match/join-match.service';
import { MatchPlayerService } from '@app/services/match-player-service/match-player.service';

/**
 * Angular Component for joining a game match.
 * This component handles the entry of an access code, validation of the code,
 * entry of a player name, and navigation to the waiting room.
 * It allows players to join an existing game match by providing an access code
 * and verifying the code's validity.
 * Once the access code is validated, the player can enter their name to join the game match.
 * If the match is locked by the organizer, an alert message is displayed.
 */

@Component({
    selector: 'app-join-match',
    templateUrl: './join-match.component.html',
    styleUrls: ['./join-match.component.scss'],
})
export class JoinMatchComponent implements OnInit {
    accessCodeError: boolean = false;
    accessCodeIsValid: boolean = false;
    nameError: boolean = false;

    constructor(
        private joinMatchService: JoinMatchService,
        private router: Router,
        private matchPlayerService: MatchPlayerService,
    ) {}

    @HostListener('window:keydown.enter', ['$event'])
    onEnterKey(): void {
        if (!this.accessCodeIsValid) this.onAccessCodeEntry();
        else this.onJoinMatch();
    }

    ngOnInit(): void {
        this.joinMatchService.maxLength = MAX_ACCESS_CODE_LENGTH;
    }

    onAccessCodeEntry(): void {
        this.joinMatchService.isValidAccessCode().subscribe((isAccessCodeValid) => {
            this.accessCodeError = !isAccessCodeValid;
            if (isAccessCodeValid) {
                this.joinMatchService.accessCode = this.joinMatchService.input;
                this.joinMatchService.isMatchAccessible().subscribe((isAccessible) => {
                    if (isAccessible) {
                        this.accessCodeIsValid = isAccessCodeValid;
                        this.joinMatchService.maxLength = MAX_PLAYER_NAME_LENGTH;
                        this.matchPlayerService.hasJoinMatch = true;
                    } else window.alert("L'organisateur a verrouillé cette partie");
                });
            }
            this.joinMatchService.input = '';
        });
    }

    onJoinMatch(): void {
        this.joinMatchService.isValidAccessCode().subscribe((isAccessCodeValid) => {
            if (isAccessCodeValid) {
                this.joinMatchService.isMatchAccessible().subscribe((isAccessible) => {
                    if (isAccessible) {
                        this.joinMatchService.removeSpace();
                        this.joinMatchService.validatePlayerName().subscribe((isPlayerNameValidForGame) => {
                            if (isPlayerNameValidForGame) {
                                this.joinMatchService.playerName = this.joinMatchService.input;
                                this.joinMatchService.input = '';
                                this.router.navigateByUrl(`play/wait/${this.joinMatchService.accessCode}`);
                            } else {
                                this.joinMatchService.input = '';
                                this.nameError = true;
                            }
                        });
                    } else {
                        this.joinMatchService.input = '';
                        window.alert("L'organisateur a verrouillé cette partie");
                    }
                });
            } else {
                this.accessCodeIsValid = false;
                this.joinMatchService.maxLength = MAX_ACCESS_CODE_LENGTH;
                this.matchPlayerService.hasJoinMatch = false;
                this.joinMatchService.input = '';
                this.joinMatchService.accessCode = '';
                window.alert("L'organisateur a annulé cette partie");
                this.router.navigateByUrl('play');
            }
        });
    }
}
