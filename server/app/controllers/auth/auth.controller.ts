import { AuthService } from '@app/services/auth/auth.service';
import { Body, Controller, HttpStatus, Logger, Post, Res } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { Response } from 'express';

/**
 * This file represent the controller to access the authentication road of our server
 * Here is the handling of authentication request
 */
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private logger: Logger,
    ) {}

    @Post('/')
    @ApiOkResponse({
        description: 'Authenticate a user',
    })
    login(@Body() password, @Res() res: Response) {
        try {
            if (!password.pwd) {
                res.status(HttpStatus.FORBIDDEN).send('Authentication failed: Empty password');
                return;
            }
            this.logger.log('Authenticating a user');
            const token = this.authService.login(password.pwd);
            if (token) res.status(HttpStatus.OK).json({ token });
            else res.status(HttpStatus.FORBIDDEN).send('Authentication failed');
        } catch (e) {
            this.logger.log("une erreur s'est produite", e);
            res.status(HttpStatus.NOT_FOUND).send(e.message);
        }
    }
}
