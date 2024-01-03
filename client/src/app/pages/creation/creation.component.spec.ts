/* eslint-disable no-underscore-dangle */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LogoComponent } from '@app/components/logo/logo.component';
import { CreationComponent } from './creation.component';
import { PaginatorComponent } from '@app/components/paginator/paginator.component';
import { GameServiceService } from '@app/services/game-service/game-service.service';

describe('CreationComponent', () => {
    let component: CreationComponent;
    let fixture: ComponentFixture<CreationComponent>;
    let gameServiceSpy: jasmine.SpyObj<GameServiceService>;

    beforeEach(() => {
        gameServiceSpy = jasmine.createSpyObj('GameServiceService', [
            'importGame',
            'getGameList',
            'validateName',
            'importGame',
            'validateOtherAttributes',
            'resetCurrentGame',
            'displayErrors',
            'validateAttributesTypes',
            'gamesUpdated$',
        ]);
        TestBed.configureTestingModule({
            declarations: [CreationComponent, LogoComponent, PaginatorComponent],
            imports: [BrowserAnimationsModule, MatCardModule],
            providers: [{ provide: GameServiceService, useValue: gameServiceSpy }],
        });
        fixture = TestBed.createComponent(CreationComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
