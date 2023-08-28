import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class HashingUtil {
  hashPhoneNumber(phoneNumber: string): string {
    return crypto.createHash('md5').update(phoneNumber).digest('hex');
  }
}
