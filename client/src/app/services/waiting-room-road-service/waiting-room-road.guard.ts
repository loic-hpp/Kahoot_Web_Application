import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { MatchPlayerService } from '@app/services/match-player-service/match-player.service';

@Injectable({
    providedIn: 'root',
})
/**
 * Guard for the road waiting room
 * Only players can access this road
 */
export class WaitingRoomRoadGuard {
    constructor(
        private matchPlayerService: MatchPlayerService,
        private router: Router,
    ) {}
    canActivate(): boolean {
        // Make sure that a player testing a game can not access Waiting Room
        const isLogged = this.matchPlayerService.hasJoinMatch;
        if (!isLogged) this.router.navigateByUrl('play');
        return isLogged;
    }
}
