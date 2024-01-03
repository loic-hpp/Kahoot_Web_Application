import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Match } from '@app/classes/match/match';
import { MatchHistory } from '@app/interfaces/match-history';
import { Validation } from '@app/interfaces/validation';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from 'src/environments/environment';

/**
 * This class allows to centralize la communication with the server during a match.
 */
@Injectable({
    providedIn: 'root',
})
export class MatchCommunicationService {
    constructor(private httpClient: HttpClient) {}

    isValidAccessCode(accessCode: string): Observable<boolean> {
        if (!accessCode) return of(false);
        return this.httpClient.get<boolean>(`${environment.serverUrl}/matches/match/validity/${accessCode}`).pipe(
            map((accessCodeExists) => accessCodeExists),
            catchError(() => {
                window.alert('An error occurred:\n');
                return of(false);
            }),
        );
    }

    validatePlayerName(accessCode: string, name: string): Observable<boolean> {
        const validationObject: Validation = {
            accessCode,
            name,
        };
        return this.httpClient.post<boolean>(`${environment.serverUrl}/matches/match/playerNameValidity`, validationObject).pipe(
            map((isPlayerNameValidForGame) => isPlayerNameValidForGame),
            catchError(() => {
                window.alert('An error occurred:\n');
                return of(false);
            }),
        );
    }

    isMatchAccessible(accessCode: string): Observable<boolean> {
        return this.httpClient.get<boolean>(`${environment.serverUrl}/matches/match/accessibility/${accessCode}`).pipe(
            map((isAccessible) => isAccessible),
            catchError(() => {
                window.alert('An error occurred:\n');
                return of(false);
            }),
        );
    }

    setAccessibility(accessCode: string): Observable<unknown> {
        return this.httpClient.patch(`${environment.serverUrl}/matches/match/accessibility/${accessCode}`, {}).pipe(
            catchError(() => {
                window.alert("Une erreur est survenue lors de la modification de l'accessibilité\n");
                return of();
            }),
        );
    }

    createMatch(match: Match): Observable<unknown> {
        return this.httpClient.post(`${environment.serverUrl}/matches/match`, match).pipe(
            catchError(() => {
                window.alert('Une erreur est survenue lors de la création de la partie:\n');
                return of();
            }),
        );
    }

    deleteMatchByAccessCode(accessCode: string): Observable<unknown> {
        return this.httpClient.delete<Match | null>(`${environment.serverUrl}/matches/match/${accessCode}`).pipe(
            catchError(() => {
                window.alert('Une erreur est survenue lors de la suppression de la partie:\n');
                return of();
            }),
        );
    }

    saveMatchHistory(matchAccessCode: string): Observable<unknown> {
        return this.httpClient.post(`${environment.serverUrl}/matches/match/${matchAccessCode}/history`, null).pipe(
            catchError(() => {
                window.alert('Une erreur est survenue lors de la création de la historique du match:\n}');
                return of();
            }),
        );
    }

    getMatchHistory(): Observable<MatchHistory[]> {
        return this.httpClient.get<MatchHistory[]>(`${environment.serverUrl}/matches/history`);
    }

    deleteMatchHistory(): Observable<unknown> {
        return this.httpClient.delete(`${environment.serverUrl}/matches/history`).pipe(
            catchError(() => {
                window.alert("Une erreur est survenue lors de la suppression de l'historique\n");
                return of();
            }),
        );
    }
}
