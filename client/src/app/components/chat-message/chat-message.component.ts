import { Component, Input, OnInit } from '@angular/core';
import { Message } from '@app/interfaces/message';
import { MatchPlayerService } from '@app/services/match-player-service/match-player.service';

@Component({
    selector: 'app-chat-message',
    templateUrl: './chat-message.component.html',
    styleUrls: ['./chat-message.component.scss'],
})

/**
 * Manages the messages in a match and
 * the name of the sender of the message.
 * @class ChatMessageComponent
 * @implements {OnInit}
 */
export class ChatMessageComponent implements OnInit {
    @Input() message: Message;
    isSender: boolean;

    constructor(private matchService: MatchPlayerService) {}
    ngOnInit(): void {
        this.isSender = this.matchService.player.name === this.message.playerName;
    }
}
