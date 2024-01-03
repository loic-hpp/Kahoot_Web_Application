import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@app/services/auth-service/auth.service';
import { tap } from 'rxjs';

/**
 * The `AuthenticationComponent` is responsible for providing user authentication functionality in the application.
 * Users can input a password to log in, and this component interacts with the authentication service to determine
 * if the provided password is correct. Upon successful login, the user is redirected to the administrative dashboard;
 * otherwise, an error message is displayed.
 *
 * @class AuthenticationComponent
 */

@Component({
    selector: 'app-authentication',
    templateUrl: './authentication.component.html',
    styleUrls: ['./authentication.component.scss'],
})
export class AuthenticationComponent {
    password!: string;
    passwordError: boolean = false;
    constructor(
        private auth: AuthService,
        private router: Router,
    ) {}

    @HostListener('window:keydown.enter', ['$event'])
    onEnterKey(): void {
        this.onLogin();
    }

    onLogin(): void {
        this.auth
            .login(this.password)
            .pipe(
                tap((isLogged: boolean) => {
                    if (isLogged) this.router.navigateByUrl('administration/home');
                    else {
                        this.router.navigateByUrl('administration');
                        this.passwordError = true;
                        this.password = '';
                    }
                }),
            )
            .subscribe();
    }
}
