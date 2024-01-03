import { Injectable } from '@angular/core';
import { DURATIONS, SocketsOnEvents, SocketsSendEvents } from '@app/constants/constants';
import { StopServerTimerRequest } from '@app/interfaces/stop-server-timer-request';
import { TimerRequest } from '@app/interfaces/timer-request';
import { JoinMatchService } from '@app/services/join-match/join-match.service';
import { SocketService } from '@app/services/socket-service/socket.service';

type TimerCallback = () => void;
/**
 * This class allows to centralize the timers management.
 */
@Injectable({
    providedIn: 'root',
})
export class TimeService {
    private counter: number = 0;
    constructor(
        public socketService: SocketService,
        public joinMatchService: JoinMatchService,
    ) {}

    get timer(): number {
        return this.counter;
    }

    set timer(counter: number) {
        if (counter === 0) this.stopTimer();
        else this.counter = counter;
    }

    /**
     * action parameter is a function that is going to be called when the time finish.
     */
    startTimer(startValue: number, matchAccessCode: string, finalAction: TimerCallback): void {
        if (!this.joinMatchService.playerName) {
            this.socketService.send<TimerRequest>(SocketsSendEvents.StartTimer, {
                roomId: matchAccessCode,
                timer: startValue,
                timeInterval: DURATIONS.timerInterval,
            });
        }
        this.counter = startValue;
        this.socketService.on<TimerRequest>(SocketsOnEvents.NewTime, (timerRequest: TimerRequest) => {
            this.counter = timerRequest.timer;
            if (timerRequest.timer < 1) {
                this.counter = 0;
                this.socketService.removeListener(SocketsOnEvents.NewTime);
                finalAction();
            }
        });
    }

    startHistogramTimer(matchAccessCode: string, action: TimerCallback): void {
        this.socketService.send<TimerRequest>(SocketsSendEvents.HistogramTime, {
            roomId: matchAccessCode,
            timer: 0,
            timeInterval: DURATIONS.timerInterval,
        });

        this.socketService.on<TimerRequest>(SocketsOnEvents.HistogramTime, (timerRequest: TimerRequest) => {
            if (timerRequest.timer === DURATIONS.qrlHistogramUpdateInterval) action();
        });
    }

    startPanicModeTimer(matchAccessCode: string): void {
        if (!this.joinMatchService.playerName) {
            this.socketService.send<TimerRequest>(SocketsSendEvents.StartTimer, {
                roomId: matchAccessCode,
                timer: this.counter,
                timeInterval: DURATIONS.panicModeInterval,
            });
        }
    }

    stopServerTimer(matchAccessCode: string, isHistogramTimer: boolean = false): void {
        this.socketService.send<StopServerTimerRequest>(SocketsSendEvents.StopTimer, {
            roomId: matchAccessCode,
            isHistogramTimer,
        });
    }

    stopTimer(): void {
        this.counter = 0;
        this.socketService.removeListener(SocketsOnEvents.NewTime);
    }

    resumeTimer(matchAccessCode: string, action: TimerCallback): void {
        this.startTimer(this.counter, matchAccessCode, action);
    }

    getCurrentTime(): string {
        const currentTime = new Date();
        const hours = currentTime.getHours().toString().padStart(2, '0');
        const minutes = currentTime.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }
}
