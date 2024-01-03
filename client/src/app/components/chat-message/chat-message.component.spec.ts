import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Game } from '@app/classes/game/game';
import { GAMES } from '@app/data/data';
import { AppMaterialModule } from '@app/modules/material.module';
import { MatchPlayerService } from '@app/services/match-player-service/match-player.service';
import { ChatMessageComponent } from './chat-message.component';

describe('ChatMessageComponent', () => {
    let spyMatchService: jasmine.SpyObj<MatchPlayerService>;
    let component: ChatMessageComponent;
    let fixture: ComponentFixture<ChatMessageComponent>;

    beforeEach(() => {
        spyMatchService = jasmine.createSpyObj('MatchPlayerService', ['answerExists', 'match']);
        spyMatchService.match.game = new Game(GAMES.map((obj) => Object.assign({ ...obj }))[0]);
        TestBed.configureTestingModule({
            declarations: [ChatMessageComponent],
            imports: [AppMaterialModule],
            providers: [{ provide: MatchPlayerService, useValue: spyMatchService }],
        });
        fixture = TestBed.createComponent(ChatMessageComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should verify if the message is from the player or another player', () => {
        const message = { playerName: 'Name', matchAccessCode: 'Code', time: '00:00', data: 'data' };
        spyMatchService.player = { name: 'Name', isActive: true, score: 0, nBonusObtained: 0, chatBlocked: false };
        const namePlayer1 = spyMatchService.player.name;
        component.message = message;
        const namePlayer2 = message.playerName;
        fixture.detectChanges();
        expect(component.isSender).toEqual(namePlayer1 === namePlayer2);
    });
});
