import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdministrationComponent } from '@app/pages/administration/administration.component';
import { AuthenticationComponent } from '@app/pages/authentication/authentication.component';
import { CreateGameComponent } from '@app/pages/create-game/create-game.component';
import { CreationComponent } from '@app/pages/creation/creation.component';
import { GamePreviewComponent } from '@app/pages/game-preview/game-preview.component';
import { HistoryComponent } from '@app/pages/history/history.component';
import { JoinMatchComponent } from '@app/pages/join-match/join-match.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { ManagerWaitingRoomComponent } from '@app/pages/manager-waiting-room/manager-waiting-room.component';
import { MatchManagersSideComponent } from '@app/pages/match-managers-side/match-managers-side.component';
import { MatchResultComponent } from '@app/pages/match-result/match-result.component';
import { OnGoingMatchComponent } from '@app/pages/on-going-match/on-going-match.component';
import { QuestionResultComponent } from '@app/pages/question-result/question-result.component';
import { WaitingRoomComponent } from '@app/pages/waiting-room/waiting-room.component';
import { AdminRoadGuard } from '@app/services/admin-road-service/admin-road.guard';
import { ManagerWaitingRoomGuard } from '@app/services/manager/manager-waiting-room.guard';
import { MatchResultGuard } from '@app/services/match-result/match-result.guard';
import { MatchRoadGuard } from '@app/services/match-road-service/match-road.guard';
import { WaitingRoomRoadGuard } from '@app/services/waiting-room-road-service/waiting-room-road.guard';

const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: MainPageComponent },
    { path: 'administration', component: AuthenticationComponent },
    { path: 'administration/home', component: AdministrationComponent, canActivate: [AdminRoadGuard] },
    { path: 'administration/create-game', component: CreateGameComponent, canActivate: [AdminRoadGuard] },
    { path: 'administration/create-game/:id', component: CreateGameComponent, canActivate: [AdminRoadGuard] },
    { path: 'administration/history', component: HistoryComponent, canActivate: [AdminRoadGuard] },
    { path: 'create', component: CreationComponent },
    { path: 'create/wait/game/:id', component: ManagerWaitingRoomComponent, canActivate: [ManagerWaitingRoomGuard] },
    { path: 'create/preview/games/:id', component: GamePreviewComponent },
    { path: 'play', component: JoinMatchComponent },
    { path: 'play/manager/match/:id', component: MatchManagersSideComponent, canActivate: [ManagerWaitingRoomGuard] },
    { path: 'play/wait/:accessCode', component: WaitingRoomComponent, canActivate: [WaitingRoomRoadGuard] },
    { path: 'play/result/:id', component: MatchResultComponent, canActivate: [MatchResultGuard] },
    { path: 'play/question-result/:id', component: QuestionResultComponent, canActivate: [MatchRoadGuard] },
    { path: 'play/match/:id', component: OnGoingMatchComponent, canActivate: [MatchRoadGuard] },
    { path: '**', redirectTo: '/home' },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: true })],
    exports: [RouterModule],
})
export class AppRoutingModule {}
