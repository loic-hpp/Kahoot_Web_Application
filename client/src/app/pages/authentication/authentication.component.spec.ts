import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppMaterialModule } from '@app/modules/material.module';
import { AuthService } from '@app/services/auth-service/auth.service';
import { of } from 'rxjs';
import { AuthenticationComponent } from './authentication.component';
import { LogoComponent } from '@app/components/logo/logo.component';

describe('AuthenticationComponent', () => {
    let component: AuthenticationComponent;
    let fixture: ComponentFixture<AuthenticationComponent>;
    let spyAuthService: jasmine.SpyObj<AuthService>;
    let spyRouter: jasmine.SpyObj<Router>;

    beforeEach(() => {
        spyAuthService = jasmine.createSpyObj('AuthService', ['login']);
        spyRouter = jasmine.createSpyObj('Router', ['navigateByUrl']);

        TestBed.configureTestingModule({
            declarations: [AuthenticationComponent, LogoComponent],
            imports: [AppMaterialModule, FormsModule],
            providers: [
                { provide: AuthService, useValue: spyAuthService },
                { provide: Router, useValue: spyRouter },
            ],
        });
        fixture = TestBed.createComponent(AuthenticationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call navigateByURL when login is called', () => {
        spyAuthService.login.and.returnValue(of(true));
        component.password = 'test';
        component.onLogin();
        expect(spyAuthService.login).toHaveBeenCalledWith('test');
    });

    it('should navigate to administration/home if password is valid', () => {
        spyAuthService.login.and.returnValue(of(true));
        component.onLogin();
        expect(spyRouter.navigateByUrl).toHaveBeenCalledWith('administration/home');
    });

    it('should navigate to administration/home if password is invalid', () => {
        spyAuthService.login.and.returnValue(of(false));
        component.onLogin();
        expect(spyRouter.navigateByUrl).toHaveBeenCalledWith('administration');
    });

    it('should call to onLogin when the Enter button is pressed', () => {
        spyOn(component, 'onLogin');
        const event = new KeyboardEvent('keydown', { key: 'Enter' });
        window.dispatchEvent(event);
        fixture.detectChanges();
        expect(component.onLogin).toHaveBeenCalled();
    });
});
