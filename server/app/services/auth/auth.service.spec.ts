import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
    let service: AuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [AuthService, Logger],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('login', () => {
        it('should return a token for a valid password', () => {
            const validPassword = '2018';
            const token = service.login(validPassword);
            expect(token).toBeTruthy();
        });

        it('should return null for an invalid password', () => {
            const invalidPassword = '1234';
            const token = service.login(invalidPassword);
            expect(token).toBeNull();
        });
    });

    describe('generateToken', () => {
        it('should generate a token of the specified length', () => {
            const length = 10;
            const token = service['generateToken'](length);
            expect(token).toHaveLength(length);
        });
    });
});
