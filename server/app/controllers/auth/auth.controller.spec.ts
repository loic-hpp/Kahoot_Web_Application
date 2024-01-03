import { AuthService } from '@app/services/auth/auth.service';
import { HttpStatus, INestApplication, Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import * as request from 'supertest';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
    let controller: AuthController;
    let authService: SinonStubbedInstance<AuthService>;
    let logger: SinonStubbedInstance<Logger>;
    let app: INestApplication;

    beforeEach(async () => {
        authService = createStubInstance(AuthService);
        logger = createStubInstance(Logger);
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                { provide: AuthService, useValue: authService },
                { provide: Logger, useValue: logger },
            ],
        }).compile();
        controller = module.get<AuthController>(AuthController);
        app = module.createNestApplication();
        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('POST /', () => {
        it('should authenticate a user with status 200 and return a token', async () => {
            const password = { pwd: 'password123' };

            jest.spyOn(authService, 'login').mockReturnValue('validToken');

            const response = await request(app.getHttpServer()).post('/auth').send(password).set('Accept', 'application/json').expect(HttpStatus.OK);

            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body.token).toEqual('validToken');
        });

        it('should handle authentication failure and return status 403', async () => {
            const password = { pwd: 'invalidPassword' };

            jest.spyOn(authService, 'login').mockReturnValue(null);

            const response = await request(app.getHttpServer())
                .post('/auth')
                .send(password)
                .set('Accept', 'application/json')
                .expect(HttpStatus.FORBIDDEN);

            expect(response.status).toBe(HttpStatus.FORBIDDEN);
            expect(response.text).toContain('Authentication failed');
        });

        it('should handle errors and return status 404', async () => {
            const password = { pwd: 'password123' };

            const errorMessage = 'An error occurred';

            authService.login.throws(new Error(errorMessage));

            const response = await request(app.getHttpServer())
                .post('/auth')
                .send(password)
                .set('Accept', 'application/json')
                .expect(HttpStatus.NOT_FOUND);

            expect(response.status).toBe(HttpStatus.NOT_FOUND);
            expect(response.text).toContain(errorMessage);
        });

        it('should handle a falsy password', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth')
                .send(undefined)
                .set('Accept', 'application/json')
                .expect(HttpStatus.FORBIDDEN);

            expect(response.status).toBe(HttpStatus.FORBIDDEN);
            expect(response.text).toContain('Authentication failed');
        });
    });
});
