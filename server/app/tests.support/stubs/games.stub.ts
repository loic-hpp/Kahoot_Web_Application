import { gameList } from '@app/data/starting-game-list';
import { Game } from '@app/model/database/game';

/**
 * Fake data for tests purpose */
export const GAMES_STUB = (): Game[] => {
    return gameList;
};
