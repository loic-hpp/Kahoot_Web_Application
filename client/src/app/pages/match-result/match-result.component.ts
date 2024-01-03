import { Component, OnDestroy, OnInit } from '@angular/core';
import { HistogramService } from '@app/services/histogram-service/histogram.service';
import { MatchPlayerService } from '@app/services/match-player-service/match-player.service';
/**
 * Component of the match results view.
 * It displays the player's list with their score and bonus obtained and has the same chat zone as
 * the match view for both of players and manager.
 * The player or manager can click on "Accueil" button to navigate to the main page
 */
@Component({
    selector: 'app-match-result',
    templateUrl: './match-result.component.html',
    styleUrls: ['./match-result.component.scss'],
})
export class MatchResultComponent implements OnInit, OnDestroy {
    constructor(
        private matchPlayerService: MatchPlayerService,
        public histogramService: HistogramService,
    ) {}

    ngOnInit(): void {
        this.histogramService.isShowingMatchResults = true;
        window.onbeforeunload = () => {
            this.redirectToHome();
        };
        window.onpopstate = () => {
            this.redirectToHome();
        };
    }

    ngOnDestroy(): void {
        this.histogramService.isShowingMatchResults = false;
        window.onbeforeunload = () => {
            return;
        };
        window.onpopstate = () => {
            return;
        };

        this.histogramService.questionsStats = new Map();
    }

    redirectToHome(): void {
        this.histogramService.playersAnswered = [];
        this.histogramService.playersWithFinalAnswers = [];
        this.histogramService.quittedPlayers = [];
        this.histogramService.isShowingMatchResults = false;
        this.matchPlayerService.cleanCurrentMatch();
        this.matchPlayerService.router.navigateByUrl('/home');
    }

    onShowPreviousChart(): void {
        this.histogramService.currentChartIndex =
            (this.histogramService.currentChartIndex - 1 + this.histogramService.questionsChartData.length) %
            this.histogramService.questionsChartData.length;
        if (this.histogramService.chart) {
            this.histogramService.chart.destroy();
        }
        this.histogramService.createChart();
    }

    onShowNextChart(): void {
        this.histogramService.currentChartIndex = (this.histogramService.currentChartIndex + 1) % this.histogramService.questionsChartData.length;
        if (this.histogramService.chart) {
            this.histogramService.chart.destroy();
        }
        this.histogramService.createChart();
    }
}
