import { IsNumberString, IsString } from 'class-validator';

export class CreateConversationDto {
  @IsNumberString()
  phoneNumber: string;

  @IsString()
  name: string;
}
