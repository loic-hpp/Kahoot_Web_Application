import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LogoComponent } from '@app/components/logo/logo.component';
import { MATCHES_HISTORY } from '@app/data/data';
import { DisplayableMatchHistory } from '@app/interfaces/displayable-match-history';
import { MatchHistory } from '@app/interfaces/match-history';
import { AppMaterialModule } from '@app/modules/material.module';
import { CancelConfirmationService } from '@app/services/cancel-confirmation/cancel-confirmation.service';
import { MatchCommunicationService } from '@app/services/match-communication/match-communication.service';
import { of } from 'rxjs';
import { HistoryComponent } from './history.component';

describe('HistoryComponent', () => {
    let component: HistoryComponent;
    let fixture: ComponentFixture<HistoryComponent>;
    let spyMatchCommunicationService: jasmine.SpyObj<MatchCommunicationService>;
    let spyCancelConfirmationService: jasmine.SpyObj<CancelConfirmationService>;
    const matchesHistoryMock: MatchHistory[] = MATCHES_HISTORY.map((obj) => Object.assign({ ...obj }));

    beforeEach(() => {
        spyMatchCommunicationService = jasmine.createSpyObj('MatchCommunicationService', ['getMatchHistory', 'deleteMatchHistory']);
        spyCancelConfirmationService = jasmine.createSpyObj('CancelConfirmationService', ['askConfirmation']);

        TestBed.configureTestingModule({
            declarations: [HistoryComponent, LogoComponent],
            imports: [AppMaterialModule],
            providers: [
                { provide: CancelConfirmationService, useValue: spyCancelConfirmationService },
                { provide: MatchCommunicationService, useValue: spyMatchCommunicationService },
            ],
        });
        fixture = TestBed.createComponent(HistoryComponent);
        component = fixture.componentInstance;
        spyMatchCommunicationService.getMatchHistory.and.returnValue(of([]));
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call deleteMatchHistory from service', () => {
        spyCancelConfirmationService.askConfirmation.and.callFake((action: () => void) => {
            action();
        });
        spyMatchCommunicationService.deleteMatchHistory.and.returnValue(of());
        component.deleteMatchHistory();
        expect(spyMatchCommunicationService.deleteMatchHistory).toHaveBeenCalled();
    });

    it('should return a DisplayableMatchHistory', () => {
        const expectedResult: DisplayableMatchHistory[] = [
            {
                matchAccessCode: '',
                bestScore: 10,
                startTime: new Date('2023-11-22 18:18:59'),
                nStartPlayers: 5,
                gameName: 'gameNameMock',
            },
        ];
        const result = component.convertToDisplayableMatchHistory(matchesHistoryMock);
        expect(result).toEqual(expectedResult);
    });
});
