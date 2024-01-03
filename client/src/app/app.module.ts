import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { AppMaterialModule } from '@app/modules/material.module';
import { AdministrationComponent } from '@app/pages/administration/administration.component';
import { AppComponent } from '@app/pages/app/app.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { NgChartsModule } from 'ng2-charts';
import { ChatMessageComponent } from './components/chat-message/chat-message.component';
import { ChatComponent } from './components/chat/chat.component';
import { ConfirmationComponentComponent } from './components/confirmation-component/confirmation-component.component';
import { CreateQuestionComponent } from './components/create-question/create-question.component';
import { GameFormComponent } from './components/game-form/game-form.component';
import { GamePanelComponent } from './components/game-panel/game-panel.component';
import { HistogramComponent } from './components/histogram/histogram.component';
import { LoginComponent } from './components/login/login.component';
import { LogoComponent } from './components/logo/logo.component';
import { ModifyQuestionComponent } from './components/modify-question/modify-question.component';
import { NewGameNameComponent } from './components/new-game-name/new-game-name.component';
import { PlayerCardComponent } from './components/player-card/player-card.component';
import { PlayersListComponent } from './components/players-list/players-list.component';
import { QrlEvaluationComponent } from './components/qrl-evaluation/qrl-evaluation.component';
import { QuestionAnswerComponent } from './components/question-answer/question-answer.component';
import { QuestionDisplayComponent } from './components/question-display/question-display.component';
import { QuestionFormComponent } from './components/question-form/question-form.component';
import { QuestionListComponent } from './components/question-list/question-list.component';
import { TransitionDialogComponent } from './components/transition-dialog/transition-dialog.component';
import { AuthenticationComponent } from './pages/authentication/authentication.component';
import { CreateGameComponent } from './pages/create-game/create-game.component';
import { CreationComponent } from './pages/creation/creation.component';
import { GamePreviewComponent } from './pages/game-preview/game-preview.component';
import { HistoryComponent } from './pages/history/history.component';
import { JoinMatchComponent } from './pages/join-match/join-match.component';
import { ManagerWaitingRoomComponent } from './pages/manager-waiting-room/manager-waiting-room.component';
import { MatchManagersSideComponent } from './pages/match-managers-side/match-managers-side.component';
import { MatchResultComponent } from './pages/match-result/match-result.component';
import { OnGoingMatchComponent } from './pages/on-going-match/on-going-match.component';
import { QuestionResultComponent } from './pages/question-result/question-result.component';
import { WaitingRoomComponent } from './pages/waiting-room/waiting-room.component';
import { PaginatorComponent } from './components/paginator/paginator.component';
/**
 * Main module that is used in main.ts.
 * All automatically generated components will appear in this module.
 * Please do not move this module in the module folder.
 * Otherwise Angular Cli will not know in which module to put new component
 */
@NgModule({
    declarations: [
        AppComponent,
        MainPageComponent,
        AuthenticationComponent,
        AdministrationComponent,
        CreateGameComponent,
        HistoryComponent,
        JoinMatchComponent,
        WaitingRoomComponent,
        GamePanelComponent,
        QuestionFormComponent,
        CreationComponent,
        GamePreviewComponent,
        OnGoingMatchComponent,
        QuestionAnswerComponent,
        QuestionListComponent,
        ChatComponent,
        GameFormComponent,
        CreateQuestionComponent,
        ModifyQuestionComponent,
        QuestionResultComponent,
        NewGameNameComponent,
        MatchResultComponent,
        LoginComponent,
        QuestionDisplayComponent,
        MatchManagersSideComponent,
        ChatMessageComponent,
        PlayerCardComponent,
        ChatMessageComponent,
        LoginComponent,
        ManagerWaitingRoomComponent,
        TransitionDialogComponent,
        PlayersListComponent,
        HistogramComponent,
        LogoComponent,
        QrlEvaluationComponent,
        ConfirmationComponentComponent,
        PaginatorComponent,
    ],
    imports: [AppMaterialModule, AppRoutingModule, BrowserAnimationsModule, BrowserModule, FormsModule, HttpClientModule, NgChartsModule],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
