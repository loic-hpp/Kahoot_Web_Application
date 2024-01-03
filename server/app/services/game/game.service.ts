import { gameList } from '@app/data/starting-game-list';
import { Game, GameDocument } from '@app/model/database/game';
import { CreateGameDto } from '@app/model/dto/game/create-game.dto';
import { Message } from '@common/message';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
/** Service to interface with the database to manage matches */
export class GameService {
    constructor(
        @InjectModel(Game.name) public gameModel: Model<GameDocument>,
        private readonly logger: Logger,
    ) {
        this.start();
    }

    async start() {
        if ((await this.gameModel.countDocuments()) === 0) {
            await this.populateDB();
        }
    }

    async populateDB(): Promise<void> {
        this.logger.log({ title: 'Populate', body: 'Populate DB with initial values' } as Message);
        const games: CreateGameDto[] = gameList;
        await this.gameModel.insertMany(games);
    }

    async getAllGames(): Promise<Game[]> {
        this.logger.log('Return list of games');
        await this.start();
        return await this.gameModel.find({});
    }

    async getGameById(id: string): Promise<Game | null> {
        this.logger.log('Game returned');
        return await this.gameModel.findOne({ id });
    }

    async addGame(newGame: CreateGameDto): Promise<void> {
        this.logger.log('Adding the new game');
        try {
            await this.gameModel.create(newGame);
        } catch (error) {
            return Promise.reject(`Failed to insert game: ${error}`);
        }
    }
    async updateGame(modifiedGame: Game): Promise<void> {
        this.logger.log('Updating the game');
        const filterQuery = { id: modifiedGame.id };
        try {
            const game = await this.gameModel.findOne({ title: modifiedGame.title });
            // if the new name is used by a different game
            if (game && game.id !== modifiedGame.id) return Promise.reject('Name already used');
            else {
                const res = await this.gameModel.replaceOne(filterQuery, modifiedGame);
                if (res.matchedCount === 0) {
                    return Promise.reject('Could not find game');
                }
            }
        } catch (error) {
            return Promise.reject(`Failed to update game: ${error.message}`);
        }
    }

    async deleteGameById(id: string): Promise<void> {
        this.logger.log('Delete game');
        try {
            const res = await this.gameModel.deleteOne({ id });
            if (res.deletedCount === 0) {
                return Promise.reject('Could not find game');
            }
        } catch (error) {
            return Promise.reject(`Failed to delete game: ${error.message}`);
        }
    }

    async updateGameVisibility(id: string, isVisible: boolean): Promise<void> {
        try {
            this.logger.log('visibility parameter updated');
            const res = await this.gameModel.updateOne({ id }, { isVisible });
            if (res.matchedCount === 0) {
                return Promise.reject('Game not found');
            }
        } catch (error) {
            return Promise.reject(`Failed to update document: ${error.message}`);
        }
    }

    async titleExists({ title }): Promise<boolean> {
        const game = await this.gameModel.findOne({ title });
        return !!game;
    }
}
