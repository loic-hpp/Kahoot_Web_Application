import { Component } from '@angular/core';

@Component({
    selector: 'app-creation',
    templateUrl: './creation.component.html',
    styleUrls: ['./creation.component.scss'],
})

/**
 * Component where all the visible games are shown, by their titles.
 * If a game was deleted or is no longer visible when the manager select it,
 * he will be notified and he can select another game from the updated list
 */
export class CreationComponent {}
