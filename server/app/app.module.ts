import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './controllers/auth/auth.controller';
import { GameController } from './controllers/game/game.controller';
import { MatchController } from './controllers/match/match.controller';
import { SocketHandlerGateway } from './gateways/socket-handler/socket-handler.gateway';
import { Game, gameSchema } from './model/database/game';
import { MatchHistory, matchHistorySchema } from './model/database/match-history';
import { AuthService } from './services/auth/auth.service';
import { GameService } from './services/game/game.service';
import { MatchService } from './services/match/match.service';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => ({
                uri: config.get<string>('DATABASE_CONNECTION_STRING'), // Loaded from .env
            }),
        }),
        MongooseModule.forFeature([
            { name: Game.name, schema: gameSchema },
            { name: MatchHistory.name, schema: matchHistorySchema },
        ]),
    ],
    controllers: [GameController, AuthController, MatchController],
    providers: [GameService, AuthService, Logger, MatchService, SocketHandlerGateway],
})
export class AppModule {}
