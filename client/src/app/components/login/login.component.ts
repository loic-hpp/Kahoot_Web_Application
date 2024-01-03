import { Component, Input } from '@angular/core';
import { JoinMatchService } from '@app/services/join-match/join-match.service';

/**
 * Component that provides the template for the login :
 * To enter match access code and to enter the player's name
 *
 * @class LoginComponent
 */
@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
    @Input() title: string;
    @Input() text: string;
    @Input() inputType: string;
    @Input() label: string;
    constructor(public joinMatchService: JoinMatchService) {}
}
