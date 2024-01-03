import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { AppMaterialModule } from '@app/modules/material.module';
import { JoinMatchService } from '@app/services/join-match/join-match.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
    let component: LoginComponent;
    let fixture: ComponentFixture<LoginComponent>;
    let joinMatchService: JoinMatchService;

    beforeEach(() => {
        joinMatchService = jasmine.createSpyObj('JoinMatchService', ['isValidAccessCode']);
        TestBed.configureTestingModule({
            declarations: [LoginComponent],
            imports: [HttpClientModule, AppMaterialModule, FormsModule],
            providers: [{ provide: JoinMatchService, useValue: joinMatchService }],
        });
        fixture = TestBed.createComponent(LoginComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
