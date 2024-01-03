import { Question } from '@app/classes/question/question';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class CreateGameDto {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsString()
    title: string;

    @ApiProperty()
    @IsString()
    description: string;

    @ApiProperty()
    @IsNumber()
    duration: number;

    @ApiProperty()
    @IsString()
    lastModification: string;

    @ApiProperty()
    questions: Question[];

    @ApiProperty()
    @IsBoolean()
    isVisible: boolean;
}
