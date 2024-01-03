import { CHAR_SETS, LENGTHS } from '@app/constants/constants';
import { Injectable } from '@nestjs/common';
@Injectable()
export class AuthService {
    pwdArr = ['2018', '1357', '2022'];
    /** Verify if the password provided by the user is ok */
    login(password: string): string {
        if (this.pwdArr.includes(password)) return this.generateToken(LENGTHS.token);
        else return null;
    }
    /** Generate the token to provide to authenticated users */
    private generateToken(length: number): string {
        let result = '';

        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * CHAR_SETS.token.length);
            result += CHAR_SETS.token.charAt(randomIndex);
        }

        return result;
    }
}
