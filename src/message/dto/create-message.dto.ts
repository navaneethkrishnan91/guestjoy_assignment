import { IsNumberString, IsString } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  message: string;

  @IsString()
  name: string;

  @IsNumberString()
  phoneNumber: string;
}
