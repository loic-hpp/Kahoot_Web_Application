import { ElementRef, EventEmitter } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Match } from '@app/classes/match/match';
import { NAMES } from '@app/constants/constants';
import { ACTIVE_PLAYERS } from '@app/data/data';
import { Player } from '@app/interfaces/player';
import { AppMaterialModule } from '@app/modules/material.module';
import { ChatService } from '@app/services/chat-service/chat.service';
import { HistogramService } from '@app/services/histogram-service/histogram.service';
import { MatchPlayerService } from '@app/services/match-player-service/match-player.service';
import { SocketService } from '@app/services/socket-service/socket.service';
import { TimeService } from '@app/services/time-service/time.service';
import { ChatComponent } from './chat.component';

describe('ChatComponent', () => {
    let component: ChatComponent;
    let histogramServiceSpy: jasmine.SpyObj<HistogramService>;
    let fixture: ComponentFixture<ChatComponent>;
    let spySocketService: jasmine.SpyObj<SocketService>;
    let spyMatchService: jasmine.SpyObj<MatchPlayerService>;
    let spyChatService: jasmine.SpyObj<ChatService>;
    let spyTimeService: jasmine.SpyObj<TimeService>;
    const mockPlayer: Player = {
        name: 'Name',
        isActive: true,
        score: 0,
        nBonusObtained: 0,
        chatBlocked: false,
    };

    beforeEach(() => {
        histogramServiceSpy = jasmine.createSpyObj('HistogramService', ['destroy', 'createChart']);
        spySocketService = jasmine.createSpyObj('SocketService', ['isSocketAlive', 'connect']);
        spyChatService = jasmine.createSpyObj('ChatService', ['setupListeners', 'send']);
        spyMatchService = jasmine.createSpyObj('MatchPlayerService', ['answerExists']);
        spyTimeService = jasmine.createSpyObj('TimeService', ['getCurrentTime']);

        TestBed.configureTestingModule({
            declarations: [ChatComponent],
            imports: [AppMaterialModule, FormsModule],
            providers: [
                { provide: SocketService, useValue: spySocketService },
                { provide: MatchPlayerService, useValue: spyMatchService },
                { provide: ChatService, useValue: spyChatService },
                { provide: ElementRef, useValue: { nativeElement: {} } },
                { provide: HistogramService, useValue: histogramServiceSpy },
                { provide: TimeService, useValue: spyTimeService },
            ],
        });
        fixture = TestBed.createComponent(ChatComponent);
        component = fixture.componentInstance;
        spyMatchService.player = ACTIVE_PLAYERS.map((obj) => Object.assign({ ...obj }))[0];
        spyMatchService.chatService = spyChatService;
        spyMatchService.socketService = spySocketService;
        spyMatchService.timeService = spyTimeService;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('toggleChatVisibility should change the visibility', () => {
        component.isChatVisible = false;
        component.toggleChatVisibility();
        expect(component.isChatVisible).toEqual(true);
    });

    it('onAnimationDone should destroy histogram chart if it is set and the player is the manager', () => {
        spyOn(component, 'scrollToBottom').and.stub();
        const chartSpy = jasmine.createSpyObj({ destroy: null });
        histogramServiceSpy.chart = chartSpy;
        spyMatchService.player.name = NAMES.manager;
        histogramServiceSpy.isShowingMatchResults = true;
        component.onAnimationDone();
        expect(histogramServiceSpy.chart.destroy).toHaveBeenCalled();
        expect(histogramServiceSpy.createChart).toHaveBeenCalled();
    });

    it('should call onEntryKey when sendEvent emits an event', () => {
        const mockEventEmitter = new EventEmitter<void>();
        component.sendEvent = mockEventEmitter;
        fixture.detectChanges();
        const onEntryKeySpy = spyOn(component, 'onEntryKey');
        component.sendEvent.emit();
        expect(onEntryKeySpy).toHaveBeenCalled();
    });

    it('should send a message when message is not empty and does not contain only spaces', () => {
        const match = new Match();
        match.accessCode = '1234';
        component.message = 'test';
        spyOn(component, 'containsOnlySpaces').and.returnValue(false);

        spyTimeService.getCurrentTime.and.returnValue('2023-11-05 12:00:00');

        spyMatchService.player = mockPlayer;
        spyMatchService.match = match;
        spyMatchService.match.accessCode = match.accessCode;

        const playerName = spyMatchService.player.name;
        const matchAccessCode = spyMatchService.match.accessCode;

        const time = spyTimeService.getCurrentTime();
        const data = component.message;
        component.sendMsg(component.message);
        expect(spyChatService.send).toHaveBeenCalledWith({
            playerName,
            matchAccessCode,
            time,
            data,
        });

        expect(component.message).toBe('');
    });

    it('should scroll to bottom when a message is sent', () => {
        const spyScrollToBottom = spyOn(component, 'scrollToBottom');
        spyChatService.hasJustSentMessage = true;
        fixture.detectChanges();
        expect(spyScrollToBottom).toHaveBeenCalled();
        expect(spyChatService.hasJustSentMessage).toBeFalse();
    });

    it('should not scroll to bottom when there is no new sent message', () => {
        const spyScrollToBottom = spyOn(component, 'scrollToBottom');
        spyChatService.hasJustSentMessage = false;
        fixture.detectChanges();
        expect(spyScrollToBottom).not.toHaveBeenCalled();
        expect(spyChatService.hasJustSentMessage).toBeFalse();
    });

    it('should change the state of the input when clicking and or not on it', () => {
        const initialStateInput = spyMatchService.isTyping;
        component.changeTypingState();
        const finalStateInput = spyMatchService.isTyping;
        expect(finalStateInput).toEqual(!initialStateInput);
    });

    it('should call onSend when Enter button is pressed', () => {
        const onSendSpy = spyOn(component, 'sendMsg');
        const keyTest = 'Enter';
        const buttonEvent = {
            key: keyTest,
            preventDefault: () => {
                return;
            },
        } as KeyboardEvent;
        spyMatchService.isTyping = true;
        spyOn(buttonEvent, 'preventDefault');
        component.onEntryKey(buttonEvent);
        expect(onSendSpy).toHaveBeenCalled();
    });

    it('should return true if input contains only spaces', () => {
        component.message = '     ';
        expect(component.containsOnlySpaces()).toBeTrue();
    });

    it('should return false if input does not contains only spaces', () => {
        component.message = 'test   ';
        expect(component.containsOnlySpaces()).toBeFalse();
    });

    it('should scroll to bottom if there is a message sent', () => {
        spyChatService.hasJustSentMessage = false;
        spyOn(component, 'scrollToBottom');
        fixture.detectChanges();
        expect(component.scrollToBottom).not.toHaveBeenCalled();
        expect(spyChatService.hasJustSentMessage).toBe(false);
    });

    it('should scroll to the bottom', () => {
        component.chatZone = { nativeElement: { scrollTop: 100, scrollHeight: 150 } } as ElementRef;

        component.scrollToBottom();

        expect(component.chatZone.nativeElement.scrollTop).toEqual(component.chatZone.nativeElement.scrollHeight);
    });
});
