import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';

/**
 * This service allows us to keep one socket instance through all the app and handle the
 * communication with the server socket in a general way without business logic.
 */
@Injectable({
    providedIn: 'root',
})
export class SocketService {
    socket: Socket;

    isSocketAlive(): boolean {
        return this.socket && this.socket.connected;
    }

    /**
     * This method should be call before using any other web socket feature.
     * You can use isSocketAlive to validate is already connected.
     */
    connect(): void {
        this.socket = io(environment.serverUrlRoot, { transports: ['websocket'], upgrade: false });
    }

    disconnect(): void {
        this.socket.disconnect();
    }

    on<T>(event: string, action: (data: T) => void): void {
        this.socket.on(event, action);
    }

    removeListener(event: string): void {
        this.socket.removeListener(event);
    }

    /*
     * The callback after sending a message doesn't work because NestJS doesn't implement it
     */
    // eslint-disable-next-line @typescript-eslint/ban-types
    send<T>(event: string, data?: T, callback?: Function): void {
        this.socket.emit(event, ...[data, callback].filter((x) => x));
    }
}
