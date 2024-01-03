import { Match } from '@app/classes/match/match';
import { Passwords } from '@app/constants/constants';
import { UpdateMatch } from '@app/interfaces/update-match';
import { Validation } from '@app/interfaces/validation';
import { MatchHistory } from '@app/model/database/match-history';
import { MatchService } from '@app/services/match/match.service';
import { Body, Controller, Delete, Get, HttpStatus, Logger, Param, Patch, Post, Res } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

/**
 * This file contains all the roads linked to the handling of requests on match
 */
@ApiTags('Matches')
@Controller('matches')
export class MatchController {
    constructor(
        private readonly matchService: MatchService,
        private logger: Logger,
    ) {}

    @Get('/')
    @ApiOkResponse({
        description: 'Return the list of all matchs',
        type: Match,
        isArray: true,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    getAllMatches(@Res() res: Response) {
        try {
            res.status(HttpStatus.OK).json(this.matchService.matches);
        } catch (error) {
            res.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @Get('/match/validity/:accessCode')
    @ApiOkResponse({
        description: 'Return access code validity',
        type: Boolean,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    accessCodeExists(@Param('accessCode') accessCode: string, @Res() res: Response) {
        try {
            const accessCodeExists = this.matchService.accessCodeExists(accessCode);
            res.status(HttpStatus.OK).json(accessCodeExists);
        } catch (e) {
            this.logger.log('an error occurred', e);
            res.status(HttpStatus.NOT_FOUND).send(e.message);
        }
    }

    @Get('/match/accessibility/:accessCode')
    @ApiOkResponse({
        description: 'Return match accessibility status',
        type: Boolean,
    })
    isAccessible(@Param('accessCode') accessCode: string, @Res() res: Response) {
        try {
            const isAccessible: boolean = this.matchService.isAccessible(accessCode);
            res.status(HttpStatus.OK).json(isAccessible);
        } catch (e) {
            this.logger.log('an error occurred', e);
            res.status(HttpStatus.NOT_FOUND).send(e.message);
        }
    }

    @Get('/match/:accessCode')
    @ApiOkResponse({
        description: 'Return match',
        type: Match,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    getMatchByAccessCode(@Param('accessCode') accessCode: string, @Res() res: Response) {
        try {
            const match: Match | undefined = this.matchService.getMatchByAccessCode(accessCode);
            if (match) res.status(HttpStatus.OK).json(match);
            else res.status(HttpStatus.NOT_FOUND).send('Match not found');
        } catch (e) {
            this.logger.log('an error occurred', e);
            res.status(HttpStatus.NOT_FOUND).send(e.message);
        }
    }

    @Post('/match/playerNameValidity')
    @ApiOkResponse({
        description: 'Return player name existence',
        type: Boolean,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    isPlayerNameValidForGame(@Body() bodyMessage: Validation, @Res() res: Response) {
        try {
            const isPlayerNameValidForGame: boolean = this.matchService.isPlayerNameValidForGame(bodyMessage);
            res.status(HttpStatus.OK).json(isPlayerNameValidForGame);
        } catch (e) {
            this.logger.log('an error occurred', e);
            res.status(HttpStatus.NOT_FOUND).send(e.message);
        }
    }

    @Delete('/match/:accessCode')
    @ApiOkResponse({
        description: 'delete a a match when it is over',
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    deleteMatchByAccessCode(@Param('accessCode') accessCode: string, @Res() res: Response) {
        try {
            this.matchService.deleteMatchByAccessCode(accessCode);
            res.status(HttpStatus.OK).send();
        } catch (error) {
            res.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @Delete('/')
    @ApiOkResponse({
        description: 'delete all matches to clear server',
    })
    @ApiNotFoundResponse({
        description: 'Return UNAUTHORIZED http status when password is incorrect or INTERNAL_SERVER_ERROR if the request failed',
    })
    deleteAllMatches(@Body() identifier: { password: string }, @Res() res: Response) {
        try {
            if (identifier.password === Passwords.DeleteAllMatches) {
                this.matchService.deleteAllMatches();
                res.status(HttpStatus.OK).send();
            } else res.status(HttpStatus.UNAUTHORIZED).send('Bad password');
        } catch (error) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
        }
    }

    @Post('/match/')
    @ApiOkResponse({
        description: 'create a new match',
    })
    @ApiNotFoundResponse({
        description: 'Return INTERNAL_SERVER_ERROR http status when the request failed',
    })
    createMatch(@Body() newMatch: Match, @Res() res: Response) {
        try {
            const accessCodeExists = this.matchService.accessCodeExists(newMatch.accessCode);
            // If the match already exist (verify accessCode)
            if (accessCodeExists) {
                res.status(HttpStatus.CONFLICT).send('This match already exists');
            } else {
                this.matchService.createMatch(newMatch);
                res.status(HttpStatus.CREATED).send();
            }
        } catch (e) {
            this.logger.log('an error occurred', e);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(e.message);
        }
    }

    @Patch('/match/accessibility/:accessCode')
    @ApiOkResponse({
        description: 'modify match accessibility',
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    setAccessibility(@Param('accessCode') accessCode: string, @Res() response: Response) {
        try {
            this.matchService.setAccessibility(accessCode);
            response.status(HttpStatus.OK).send();
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @Post('/match/player')
    @ApiOkResponse({
        description: 'add a player to match player list',
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    addPlayer(@Body() updateData: UpdateMatch, @Res() response: Response) {
        try {
            this.matchService.addPlayer(updateData);
            response.status(HttpStatus.OK).send();
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @Post('/match/:accessCode/history')
    @ApiOkResponse({
        description: 'Validate and save match history',
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    async saveHistory(@Param('accessCode') accessCode: string, @Res() response: Response) {
        try {
            const match = this.matchService.getMatchByAccessCode(accessCode);
            await this.matchService.saveMatchHistory(match.getMatchHistory());
            response.status(HttpStatus.OK).send();
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @Get('/history')
    @ApiOkResponse({
        description: 'Return the match history',
        type: MatchHistory,
        isArray: true,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    async getMatchHistory(@Res() res: Response) {
        try {
            res.status(HttpStatus.OK).json(await this.matchService.getMatchHistory());
        } catch (error) {
            res.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @Delete('/history')
    @ApiOkResponse({
        description: 'delete match history',
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when the request failed',
    })
    deleteMatchHistory(@Res() res: Response) {
        try {
            this.matchService.deleteMatchHistory();
            res.status(HttpStatus.OK).send();
        } catch (error) {
            res.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }
}
