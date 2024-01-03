import { animate, state, style, transition, trigger } from '@angular/animations';
import { AfterViewChecked, Component, ElementRef, EventEmitter, HostListener, Input, OnInit, ViewChild } from '@angular/core';
import { NAMES } from '@app/constants/constants';
import { HistogramService } from '@app/services/histogram-service/histogram.service';
import { MatchPlayerService } from '@app/services/match-player-service/match-player.service';

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss'],
    animations: [
        trigger('chatAnimation', [
            state('open', style({ opacity: 1 })),
            state('closed', style({ width: '0', opacity: 0 })),
            transition('open => closed', [animate('0.6s ease-in-out')]),
            transition('closed => open', [animate('0.6s ease-in-out')]),
        ]),
    ],
})

/**
 * Manages the message zone in a match. It's
 * responsible for sending a message and the
 * scroll bar of the messages.
 * @class ChatComponent
 * @implements {OnInit, AfterViewChecked}
 */
export class ChatComponent implements OnInit, AfterViewChecked {
    @ViewChild('chatZone') chatZone: ElementRef;
    @Input() sendEvent: EventEmitter<void>;
    message: string;
    isChatVisible: boolean = true;

    constructor(
        public matchService: MatchPlayerService,
        private histogramService: HistogramService,
    ) {}

    @HostListener('document:keydown.enter', ['$event'])
    onEntryKey(event: KeyboardEvent): void {
        if (this.matchService.isTyping)
            if (event.key === 'Enter') {
                event.preventDefault();
                this.sendMsg(this.message);
            }
    }

    ngAfterViewChecked(): void {
        if (this.matchService.chatService.hasJustSentMessage) {
            this.scrollToBottom();
            this.matchService.chatService.hasJustSentMessage = false;
        }
    }

    ngOnInit(): void {
        this.message = '';
        this.matchService.isTyping = false;
        if (this.sendEvent) {
            this.sendEvent.subscribe((event: KeyboardEvent) => {
                this.onEntryKey(event);
            });
        }
    }

    sendMsg(data: string): void {
        if (this.message && !this.containsOnlySpaces()) {
            this.matchService.chatService.send({
                playerName: this.matchService.player.name,
                matchAccessCode: this.matchService.match.accessCode,
                time: this.matchService.timeService.getCurrentTime(),
                data,
            });
        }
        this.message = '';
    }

    changeTypingState(): void {
        this.matchService.isTyping = !this.matchService.isTyping;
    }

    scrollToBottom(): void {
        const container = this.chatZone.nativeElement;
        container.scrollTop = container.scrollHeight;
    }

    containsOnlySpaces(): boolean {
        const spaceRegex = /^\s*$/;
        // Use the test method to check if the input contains only spaces
        return spaceRegex.test(this.message);
    }

    onAnimationDone(): void {
        this.scrollToBottom();
        if (this.matchService.player.name === NAMES.manager || this.histogramService.isShowingMatchResults) {
            if (this.histogramService.chart) {
                this.histogramService.chart.destroy();
            }
            this.histogramService.createChart();
        }
    }

    toggleChatVisibility(): void {
        this.isChatVisible = !this.isChatVisible;
    }
}
