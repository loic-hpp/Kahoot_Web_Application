import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Token } from '@app/interfaces/token';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})

/**
 * Service that manages the authentication: validate the password
 */
export class AuthService {
    private token: string = '';
    constructor(private http: HttpClient) {}

    login(pwd: string): Observable<boolean> {
        return this.http.post<Token>(`${environment.serverUrl}/auth`, { pwd }).pipe(
            map((token) => {
                this.token = token.token;
                return this.isLogged();
            }),
            catchError(() => {
                return of(false);
            }),
        );
    }

    isLogged(): boolean {
        return !!this.token;
    }
}
