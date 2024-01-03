import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ElementRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Game } from '@app/classes/game/game';
import { Match } from '@app/classes/match/match';
import { Question } from '@app/classes/question/question';
import { ChatComponent } from '@app/components/chat/chat.component';
import { QuestionAnswerComponent } from '@app/components/question-answer/question-answer.component';
import { DURATIONS, FEEDBACK_MESSAGES, SocketsOnEvents } from '@app/constants/constants';
import { GAMES } from '@app/data/data';
import { ChatAccessibilityRequest } from '@app/interfaces/chat-accessibility-request';
import { AppMaterialModule } from '@app/modules/material.module';
import { CancelConfirmationService } from '@app/services/cancel-confirmation/cancel-confirmation.service';
import { MatchPlayerService } from '@app/services/match-player-service/match-player.service';
import { QuestionEvaluationService } from '@app/services/question-evaluation/question-evaluation.service';
import { SocketService } from '@app/services/socket-service/socket.service';
import { TimeService } from '@app/services/time-service/time.service';
import { OnGoingMatchComponent } from './on-going-match.component';

describe('OnGoingMatchComponent', () => {
    let component: OnGoingMatchComponent;
    let fixture: ComponentFixture<OnGoingMatchComponent>;
    let matchPlayerServiceSpy: jasmine.SpyObj<MatchPlayerService>;
    let timeServiceSpy: jasmine.SpyObj<TimeService>;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;
    let routerSpy: jasmine.SpyObj<Router>;
    const matchMock: Match = new Match();
    let questionEvaluationServiceSpy: jasmine.SpyObj<QuestionEvaluationService>;
    let spySnackBar: jasmine.SpyObj<MatSnackBar>;
    let mockSnackBarRef: jasmine.SpyObj<MatSnackBarRef<SimpleSnackBar>>;
    let spyCancelConfirmationService: jasmine.SpyObj<CancelConfirmationService>;

    beforeEach(() => {
        matchPlayerServiceSpy = jasmine.createSpyObj('MatchPlayerService', [
            'initializeQuestion',
            'cleanCurrentMatch',
            'setupListenersPLayerView',
            'quitMatch',
            'getCurrentQuestion',
            'joinMatchRoom',
            'showResults',
            'getMaxTime',
            'updateCurrentAnswer',
        ]);
        socketServiceSpy = jasmine.createSpyObj('SocketService', ['isSocketAlive', 'connect', 'on', 'removeListener']);
        timeServiceSpy = jasmine.createSpyObj('TimeService', ['startTimer', 'stopServerTimer']);
        routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
        matchPlayerServiceSpy.matchFinishedEventEmitter = jasmine.createSpyObj('Subject', ['next', 'subscribe']);
        questionEvaluationServiceSpy = jasmine.createSpyObj('QuestionEvaluationService', ['cleanServiceAttributes']);
        mockSnackBarRef = jasmine.createSpyObj<MatSnackBarRef<SimpleSnackBar>>('MatSnackBarRef', [
            'onAction',
            'afterDismissed',
            'dismiss',
            'dismissWithAction',
            '_dismissAfter',
        ]);
        spySnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
        spyCancelConfirmationService = jasmine.createSpyObj('CancelConfirmationService', ['askConfirmation']);

        TestBed.configureTestingModule({
            declarations: [OnGoingMatchComponent, ChatComponent, QuestionAnswerComponent],
            imports: [AppMaterialModule, FormsModule, HttpClientTestingModule],
            providers: [
                { provide: MatchPlayerService, useValue: matchPlayerServiceSpy },
                { provide: SocketService, useValue: socketServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: TimeService, useValue: timeServiceSpy },
                { provide: QuestionEvaluationService, useValue: questionEvaluationServiceSpy },
                { provide: MatSnackBar, useValue: spySnackBar },
                { provide: MatSnackBarRef<SimpleSnackBar>, useValue: mockSnackBarRef },
                { provide: CancelConfirmationService, useValue: spyCancelConfirmationService },
            ],
        });
        fixture = TestBed.createComponent(OnGoingMatchComponent);
        component = fixture.componentInstance;
        matchPlayerServiceSpy.timeService = timeServiceSpy;
        matchPlayerServiceSpy.socketService = socketServiceSpy;
        matchPlayerServiceSpy.match = matchMock;
        matchPlayerServiceSpy.router = routerSpy;
        matchPlayerServiceSpy.currentQuestion = new Question();
        component.matchSrv = matchPlayerServiceSpy;
        spyOn(window, 'alert').and.stub();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call quitMatch on onbeforeunload event', () => {
        matchPlayerServiceSpy.match.game = new Game(GAMES.map((obj) => Object.assign({ ...obj }))[0]);
        timeServiceSpy.startTimer.and.stub();
        matchPlayerServiceSpy.match.testing = true;

        component.ngOnInit();
        window.dispatchEvent(new Event('beforeunload'));
        expect(matchPlayerServiceSpy.quitMatch).toHaveBeenCalled();
    });

    it('should call joinMatchRoom is testing match', () => {
        matchPlayerServiceSpy.match.game = new Game(GAMES.map((obj) => Object.assign({ ...obj }))[0]);
        timeServiceSpy.startTimer.and.stub();
        matchPlayerServiceSpy.match.testing = true;

        component.ngOnInit();
        expect(matchPlayerServiceSpy.joinMatchRoom).toHaveBeenCalled();
    });

    it('should not call quitMatch onbeforeunload event after component destruction', () => {
        component.ngOnDestroy();
        window.dispatchEvent(new Event('beforeunload'));
        expect(matchPlayerServiceSpy.quitMatch).not.toHaveBeenCalled();
    });

    it('should remove listeners on component destruction', () => {
        component.ngOnDestroy();
        expect(matchPlayerServiceSpy.socketService.removeListener).toHaveBeenCalled();
    });

    it('should show alert if listeners cannot be removed on component destruction', () => {
        socketServiceSpy.removeListener.and.throwError(new Error('Error message mock'));
        component.ngOnDestroy();
        expect(window.alert).toHaveBeenCalled();
    });

    it('should return score when getScore is called', () => {
        matchPlayerServiceSpy.player = { name: 'test', isActive: true, score: 1, nBonusObtained: 0, chatBlocked: false };
        const result = component.getScore();
        expect(result).toEqual(matchPlayerServiceSpy.player.score);
    });

    it('should call emit when making enter on keyword', () => {
        const emitEventSpy = spyOn(component.sendEvent, 'emit');
        component.onEnterKey();
        expect(emitEventSpy).toHaveBeenCalled();
    });

    it('should navigate to home when calling redirectToHome keyword', () => {
        component.redirectToHome();
        expect(matchPlayerServiceSpy.router.navigateByUrl).toHaveBeenCalledWith('/home');
    });

    it('should call showResults when calling timer finish', () => {
        component.onTimerFinish();
        expect(matchPlayerServiceSpy.showResults).toHaveBeenCalled();
    });

    it('should call quitMatch on onpopstate', () => {
        matchPlayerServiceSpy.match.game = new Game(GAMES.map((obj) => Object.assign({ ...obj }))[0]);
        timeServiceSpy.startTimer.and.stub();
        matchPlayerServiceSpy.match.testing = true;

        spyOn(component, 'getScore').and.returnValue(0);
        component.ngOnInit();
        matchPlayerServiceSpy.quitMatch.and.returnValue();
        window.dispatchEvent(new Event('popstate'));
        expect(matchPlayerServiceSpy.quitMatch).toHaveBeenCalled();
    });

    it('should call redirectToHome on onpopstate event after component destruction', () => {
        spyOn(component, 'redirectToHome').and.stub();
        component.ngOnDestroy();
        window.dispatchEvent(new Event('popstate'));
        expect(component.redirectToHome).not.toHaveBeenCalled();
    });

    it('restartAudio should relaunch the music by calling play ', () => {
        component.audioZone = {
            nativeElement: {
                currentTime: 1,
                play: () => {
                    return;
                },
            },
        } as ElementRef;
        const playSpy = spyOn(component.audioZone.nativeElement, 'play');
        component.restartAudio();
        expect(playSpy).toHaveBeenCalled();
        expect(component.audioZone.nativeElement.currentTime).toEqual(0);
    });

    it('setPanicMode should add an event listener to PanicModeActivated event', () => {
        component['setPanicMode']();
        expect(socketServiceSpy.on).toHaveBeenCalledWith(SocketsOnEvents.PanicModeActivated, jasmine.any(Function));
        const panicModeCallback = socketServiceSpy.on.calls.argsFor(0)[1];
        panicModeCallback(0);
        expect(component.isPanicMode).toEqual(true);
    });

    it('notifyChatBlocked should open a snackBar and dismiss it after DURATIONS.notifyChatAccessibility', () => {
        spySnackBar.open.and.returnValue(mockSnackBarRef);
        component.notifyChatBlocked();
        expect(spySnackBar.open).toHaveBeenCalledWith(FEEDBACK_MESSAGES.chatBlocked);
        // eslint-disable-next-line no-underscore-dangle
        mockSnackBarRef._dismissAfter.and.returnValue();
        // eslint-disable-next-line no-underscore-dangle
        expect(mockSnackBarRef._dismissAfter).toHaveBeenCalledWith(DURATIONS.notifyChatAccessibility);
    });

    it('notifyChatUnblocked should open a snackBar and dismiss it after DURATIONS.notifyChatAccessibility', () => {
        spySnackBar.open.and.returnValue(mockSnackBarRef);
        component.notifyChatUnblocked();
        expect(spySnackBar.open).toHaveBeenCalledWith(FEEDBACK_MESSAGES.chatUnblocked);
        // eslint-disable-next-line no-underscore-dangle
        mockSnackBarRef._dismissAfter.and.returnValue();
        // eslint-disable-next-line no-underscore-dangle
        expect(mockSnackBarRef._dismissAfter).toHaveBeenCalledWith(DURATIONS.notifyChatAccessibility);
    });

    it('abandonGame should call abandonGameWithoutConfirmation', () => {
        spyCancelConfirmationService.askConfirmation.and.stub();
        component.handleQuitMatchActions();
        expect(spyCancelConfirmationService.askConfirmation).toHaveBeenCalled();
    });

    it('modifyChatAccessibility should call notifyChatUnblocked if !chatBlocked', () => {
        spyOn(component, 'notifyChatUnblocked').and.stub();
        matchPlayerServiceSpy.player = { name: 'test', isActive: true, score: 0, nBonusObtained: 0, chatBlocked: false };
        const chatAccessibilityMock: ChatAccessibilityRequest = {
            matchAccessCode: '1234',
            name: 'test',
            players: [matchPlayerServiceSpy.player],
        };

        component.modifyChatAccessibility();
        expect(socketServiceSpy.on).toHaveBeenCalledWith(SocketsOnEvents.ChatAccessibilityChanged, jasmine.any(Function));

        const newCallback = socketServiceSpy.on.calls.argsFor(0)[1];
        newCallback(chatAccessibilityMock);
        expect(component.notifyChatUnblocked).toHaveBeenCalled();
    });

    it('modifyChatAccessibility should call notifyChatBlocked if chatBlocked', () => {
        spyOn(component, 'notifyChatBlocked').and.stub();
        matchPlayerServiceSpy.player = { name: 'test', isActive: true, score: 0, nBonusObtained: 0, chatBlocked: true };
        const chatAccessibilityMock: ChatAccessibilityRequest = {
            matchAccessCode: '1234',
            name: 'test',
            players: [matchPlayerServiceSpy.player],
        };

        component.modifyChatAccessibility();
        expect(socketServiceSpy.on).toHaveBeenCalledWith(SocketsOnEvents.ChatAccessibilityChanged, jasmine.any(Function));

        const newCallback = socketServiceSpy.on.calls.argsFor(0)[1];
        newCallback(chatAccessibilityMock);
        expect(component.notifyChatBlocked).toHaveBeenCalled();
    });
});
