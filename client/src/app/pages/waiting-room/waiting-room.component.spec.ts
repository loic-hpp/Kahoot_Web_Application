import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Match } from '@app/classes/match/match';
import { LogoComponent } from '@app/components/logo/logo.component';
import { TransitionDialogComponent } from '@app/components/transition-dialog/transition-dialog.component';
import { NAMES, SocketsOnEvents, SocketsSendEvents, TRANSITIONS_DURATIONS } from '@app/constants/constants';
import { EXAMPLES, GAMES } from '@app/data/data';
import { IMatch } from '@app/interfaces/i-match';
import { PlayerRequest } from '@app/interfaces/player-request';
import { CancelConfirmationService } from '@app/services/cancel-confirmation/cancel-confirmation.service';
import { DialogTransitionService } from '@app/services/dialog-transition-service/dialog-transition.service';
import { JoinMatchService } from '@app/services/join-match/join-match.service';
import { MatchPlayerService } from '@app/services/match-player-service/match-player.service';
import { SocketService } from '@app/services/socket-service/socket.service';
import { TimeService } from '@app/services/time-service/time.service';
import { of } from 'rxjs';
import { WaitingRoomComponent } from './waiting-room.component';
describe('WaitingRoomComponent', () => {
    let component: WaitingRoomComponent;
    let fixture: ComponentFixture<WaitingRoomComponent>;
    let matchPlayerServiceSpy: jasmine.SpyObj<MatchPlayerService>;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;
    let routerSpy: jasmine.SpyObj<Router>;
    let joinMatchServiceSpy: jasmine.SpyObj<JoinMatchService>;
    let matDialogSpy: jasmine.SpyObj<MatDialog>;
    let matDialogRefSpy: jasmine.SpyObj<MatDialogRef<TransitionDialogComponent>>;
    let timeServiceSpy: jasmine.SpyObj<TimeService>;
    let spyCancelConfirmationService: jasmine.SpyObj<CancelConfirmationService>;
    let dialogServiceSpy: jasmine.SpyObj<DialogTransitionService>;
    const iMatchMock: IMatch = {
        game: Object.assign(GAMES[0]),
        begin: '',
        end: '',
        bestScore: 0,
        accessCode: EXAMPLES.accessCode,
        testing: false,
        players: [],
        managerName: 'organisateur',
        isAccessible: true,
        bannedNames: ['organisateur'],
        playerAnswers: [],
        panicMode: false,
        timer: 0,
        timing: true,
    };

    beforeEach(() => {
        matchPlayerServiceSpy = jasmine.createSpyObj('MatchPlayerService', [
            'joinMatchRoom',
            'setCurrentMatch',
            'match',
            'initializeScore',
            'setupListenersPLayerView',
        ]);
        socketServiceSpy = jasmine.createSpyObj('SocketService', ['isSocketAlive', 'connect', 'disconnect', 'on', 'send']);
        routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
        joinMatchServiceSpy = jasmine.createSpyObj('JoinMatchService', ['joinMatchRoom']);
        matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        matDialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
        timeServiceSpy = jasmine.createSpyObj('TimeService', ['startTimer']);
        dialogServiceSpy = jasmine.createSpyObj('DialogTransitionService', ['closeTransitionDialog', 'openTransitionDialog']);
        spyCancelConfirmationService = jasmine.createSpyObj('CancelConfirmationService', ['askConfirmation']);
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            declarations: [WaitingRoomComponent, LogoComponent],
            providers: [
                { provide: MatchPlayerService, useValue: matchPlayerServiceSpy },
                { provide: SocketService, useValue: socketServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: JoinMatchService, useValue: joinMatchServiceSpy },
                { provide: MatDialog, useValue: matDialogSpy },
                { provide: MatDialogRef, useValue: matDialogRefSpy },
                { provide: TimeService, useValue: timeServiceSpy },
                { provide: CancelConfirmationService, useValue: spyCancelConfirmationService },
                { provide: TransitionDialogComponent, useValue: dialogServiceSpy },
            ],
        });
        fixture = TestBed.createComponent(WaitingRoomComponent);
        component = fixture.componentInstance;
        matchPlayerServiceSpy.router = routerSpy;
        matchPlayerServiceSpy.socketService = socketServiceSpy;
        matchPlayerServiceSpy.setCurrentMatch(new Match(iMatchMock), {
            name: NAMES.manager,
            isActive: true,
            score: 0,
            nBonusObtained: 0,
            chatBlocked: false,
        });
        timeServiceSpy.joinMatchService = joinMatchServiceSpy;
        spyOn(window, 'alert').and.stub();
        fixture.detectChanges();
        socketServiceSpy.connect.calls.reset();
        socketServiceSpy.disconnect.calls.reset();
        matchPlayerServiceSpy.socketService = socketServiceSpy;
        matchPlayerServiceSpy.timeService = timeServiceSpy;
    });

    describe('creation', () => {
        it('should create', () => {
            expect(component).toBeTruthy();
        });
    });
    describe('destruction', () => {
        it('should call abandonGameWithoutConfirmation on onbeforeunload event', () => {
            spyOn(component, 'abandonGameWithoutConfirmation').and.callFake(() => {
                return;
            });
            window.dispatchEvent(new Event('beforeunload'));
            expect(component.abandonGameWithoutConfirmation).toHaveBeenCalled();
        });
        it('should not call abandonGameWithoutConfirmation on onbeforeunload event after component destruction', () => {
            spyOn(component, 'abandonGameWithoutConfirmation').and.callFake(() => {
                return;
            });
            component.ngOnDestroy();
            window.dispatchEvent(new Event('beforeunload'));
            expect(component.abandonGameWithoutConfirmation).not.toHaveBeenCalled();
        });
        it('should call abandonGameWithoutConfirmation on onpopstate event', () => {
            spyOn(component, 'abandonGameWithoutConfirmation').and.callFake(() => {
                return;
            });
            window.dispatchEvent(new Event('popstate'));
            expect(component.abandonGameWithoutConfirmation).toHaveBeenCalled();
        });
        it('should not call abandonGame on onpopstate event after component destruction', () => {
            spyOn(component, 'abandonGame').and.callFake(() => {
                return;
            });
            component.ngOnDestroy();
            window.dispatchEvent(new Event('popstate'));
            expect(component.abandonGame).not.toHaveBeenCalled();
        });
    });
    describe('abandonGameWithoutConfirmation', () => {
        it('should call send with the right parameters on removePlayer ', () => {
            joinMatchServiceSpy.accessCode = EXAMPLES.accessCode;
            matchPlayerServiceSpy.player.name = EXAMPLES.playerName;
            const playerRequestMock: PlayerRequest = {
                roomId: EXAMPLES.accessCode,
                name: EXAMPLES.playerName,
                hasPlayerLeft: true,
            };

            socketServiceSpy.send.and.callFake((event: string, data: unknown) => {
                expect(event).toEqual(SocketsSendEvents.RemovePlayer);
                expect(data).toEqual(playerRequestMock);
            });

            component.abandonGameWithoutConfirmation();

            expect(socketServiceSpy.send).toHaveBeenCalledWith(SocketsSendEvents.RemovePlayer, playerRequestMock);
        });

        it('abandonGame should call abandonGameWithoutConfirmation', () => {
            spyCancelConfirmationService.askConfirmation.and.stub();
            component.abandonGame();
            expect(spyCancelConfirmationService.askConfirmation).toHaveBeenCalled();
        });
    });
    describe('connect', () => {
        it('should call setupListeners and connect method of socket service if socket is not alive', () => {
            socketServiceSpy.isSocketAlive.and.returnValue(false);
            const setupListenersSpy = spyOn(component, 'setupListeners').and.callFake(() => {
                return;
            });
            component.connect();
            expect(socketServiceSpy.connect).toHaveBeenCalled();
            expect(setupListenersSpy).toHaveBeenCalled();
        });

        it('should not call setupListeners and connect method of socket service if socket is alive', () => {
            socketServiceSpy.isSocketAlive.and.returnValue(true);
            const setupListenersSpy = spyOn(component, 'setupListeners').and.callFake(() => {
                return;
            });
            component.connect();
            expect(socketServiceSpy.connect).not.toHaveBeenCalled();
            expect(setupListenersSpy).not.toHaveBeenCalled();
        });
        it('should call connect, joinMatchRoom, and set player', () => {
            spyOn(component, 'connect').and.callThrough();
            joinMatchServiceSpy.playerName = EXAMPLES.playerName;

            component.ngOnInit();

            expect(component.connect).toHaveBeenCalled();
            expect(joinMatchServiceSpy.joinMatchRoom).toHaveBeenCalled();
            expect(component.matchSrv.player).toEqual({
                name: EXAMPLES.playerName,
                isActive: true,
                score: 0,
                nBonusObtained: 0,
                chatBlocked: false,
            });
        });
    });

    describe('setMatchInformations', () => {
        it('should call setCurrentMatch method of matchPlayerService with right parameters', () => {
            matchPlayerServiceSpy.player.name = EXAMPLES.playerName;
            const player = { name: EXAMPLES.playerName, isActive: true, score: 0, nBonusObtained: 0, chatBlocked: false };
            const match = Match.parseMatch(iMatchMock);
            component.setMatchInformations(match);
            expect(matchPlayerServiceSpy.setCurrentMatch).toHaveBeenCalledWith(match, player);
        });
        it('should initialiseScore and players in matchPlayerService with right data', () => {
            const iMatch = Object.assign(iMatchMock);
            iMatch.players = [{}, {}];
            const match = Match.parseMatch(iMatch);
            matchPlayerServiceSpy.player.name = EXAMPLES.playerName;
            component.setMatchInformations(match);
            expect(matchPlayerServiceSpy.initializeScore).toHaveBeenCalled();
            expect(matchPlayerServiceSpy.match.players.length).toEqual(2);
            expect(matchPlayerServiceSpy.player.score).toEqual(0);
        });
    });

    describe('setTransitionToMatchView', () => {
        it('should call startTimer with right parameters', () => {
            matchPlayerServiceSpy.match = new Match(iMatchMock);

            socketServiceSpy.send.and.stub();

            const dialogRefMock = {
                afterClosed: () => of(true),
                close: () => true,
            } as unknown as MatDialogRef<TransitionDialogComponent>;

            matDialogSpy.open.and.returnValue(dialogRefMock);
            matDialogRefSpy.close.and.callFake(() => {
                return;
            });
            timeServiceSpy.startTimer.and.callFake(() => {
                return;
            });
            component.setTransitionToMatchView();
            const [time, accessCode, callback] = timeServiceSpy.startTimer.calls.mostRecent().args;

            expect(time).toEqual(TRANSITIONS_DURATIONS.startOfTheGame);
            expect(accessCode).toEqual(iMatchMock.accessCode);
            expect(typeof callback).toBe('function');
            callback();
            expect(matchPlayerServiceSpy.router.navigateByUrl).toHaveBeenCalledWith(`/play/match/${iMatchMock.game.id}`);
        });
    });

    describe('quitCanceledGame', () => {
        it('should call window.alert disconnect, navigateByUrl and close if dialog is open', () => {
            component.quitCanceledGame();
            expect(window.alert).toHaveBeenCalled();
            expect(matchPlayerServiceSpy.socketService.disconnect).toHaveBeenCalled();
            expect(matchPlayerServiceSpy.router.navigateByUrl).toHaveBeenCalledWith('/home');
            expect(matDialogRefSpy.close).not.toHaveBeenCalled();
        });
        it('should call window.alert disconnect, navigateByUrl but not close if dialog is closed', () => {
            const dialogRefMock = {
                afterClosed: () => of(true),
                close: () => true,
            } as unknown as MatDialogRef<TransitionDialogComponent>;

            matDialogSpy.open.and.returnValue(dialogRefMock);
            matDialogRefSpy.close.and.callFake(() => {
                return;
            });
            component.quitCanceledGame();
            expect(window.alert).toHaveBeenCalled();
            expect(matchPlayerServiceSpy.socketService.disconnect).toHaveBeenCalled();
            expect(matchPlayerServiceSpy.router.navigateByUrl).toHaveBeenCalledWith('/home');
        });
    });

    describe('set up listeners', () => {
        it('should set Up Listener for joinMatch', () => {
            component.setupListeners();

            expect(socketServiceSpy.on).toHaveBeenCalledWith(SocketsOnEvents.JoinBegunMatch, jasmine.any(Function));
            const matchData = new Match(iMatchMock);
            matchPlayerServiceSpy.match = matchData;

            const callCount = socketServiceSpy.on.calls.count();
            for (let i = 0; i < callCount; i++) {
                const args = socketServiceSpy.on.calls.argsFor(i);
                const eventName = args[0];
                const callback = args[1];

                if (eventName === SocketsOnEvents.JoinBegunMatch) {
                    spyOn(component, 'setMatchInformations').and.callFake(() => {
                        return;
                    });
                    spyOn(component, 'setTransitionToMatchView').and.callFake(() => {
                        return;
                    });
                    callback(matchData);
                    expect(component.setMatchInformations).toHaveBeenCalledWith(matchData);
                    expect(component.setTransitionToMatchView).toHaveBeenCalled();
                    break;
                }
            }
        });
        it('should set Up Listener for cancelGame', () => {
            spyOn(component, 'setMatchInformations').and.callFake(() => {
                return;
            });
            spyOn(component, 'setTransitionToMatchView').and.callFake(() => {
                return;
            });
            component.setupListeners();
            expect(socketServiceSpy.on).toHaveBeenCalledWith(SocketsOnEvents.GameCanceled, jasmine.any(Function));

            const callCount = socketServiceSpy.on.calls.count();
            for (let i = 0; i < callCount; i++) {
                const args = socketServiceSpy.on.calls.argsFor(i);
                const eventName = args[0];
                const callback = args[1];

                if (eventName === SocketsOnEvents.GameCanceled) {
                    const spy = spyOn(component, 'quitCanceledGame').and.callFake(() => {
                        return;
                    });
                    callback({});
                    expect(spy).toHaveBeenCalled();
                    break;
                }
            }
        });
    });
});
