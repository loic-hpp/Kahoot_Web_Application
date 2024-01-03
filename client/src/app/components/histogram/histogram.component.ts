import { Component, HostListener, OnInit } from '@angular/core';
import { HistogramService } from '@app/services/histogram-service/histogram.service';

/**
 * Component that provides the histogram template for the manager
 * It gets the data from the HistogramService
 * We set up a listener to update the histogram after each (de)selection
 *
 * @class HistogramComponent
 * @implements {OnInit}
 */

@Component({
    selector: 'app-histogram',
    templateUrl: './histogram.component.html',
    styleUrls: ['./histogram.component.scss'],
})
export class HistogramComponent implements OnInit {
    constructor(public histogramService: HistogramService) {}

    @HostListener('window:resize', ['$event'])
    onResize(): void {
        if (this.histogramService.chart) {
            this.histogramService.chart.destroy();
        }
        this.histogramService.createChart();
    }

    ngOnInit(): void {
        this.histogramService.setupListeners();
        if (!this.histogramService.isShowingQuestionResults) {
            if (this.histogramService.chart) {
                this.histogramService.chart.destroy();
            }
            this.histogramService.createChart();
        }
    }
}
