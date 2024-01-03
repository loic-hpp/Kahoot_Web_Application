import { Component, Input } from '@angular/core';
import { SocketsSendEvents } from '@app/constants/constants';
import { Player } from '@app/interfaces/player';
import { PlayerRequest } from '@app/interfaces/player-request';
import { SocketService } from '@app/services/socket-service/socket.service';

/**
 * This component represents a player card that can be displayed within the waiting room.
 * It allows interaction with players, such as excluding a player (if the user is the manager).
 *
 * @class PlayerCardComponent
 */
@Component({
    selector: 'app-player-card',
    templateUrl: './player-card.component.html',
    styleUrls: ['./player-card.component.scss'],
})
export class PlayerCardComponent {
    @Input() player: Player = { name: '', isActive: true, score: 0, nBonusObtained: 0, chatBlocked: false };
    @Input() isManager: boolean = false;
    @Input() accessCode: string = '';

    constructor(private socketService: SocketService) {}

    excludePlayer(): void {
        this.socketService.send<PlayerRequest>(SocketsSendEvents.RemovePlayer, {
            roomId: this.accessCode,
            name: this.player.name,
            hasPlayerLeft: false,
        });
    }
}
