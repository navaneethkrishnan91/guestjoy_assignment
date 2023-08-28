import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Conversation } from '../conversation/entities/conversation.entity';
import { DataSource, Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { HashingUtil } from '../utils/hashing.util';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    private dataSource: DataSource,
    private readonly hashingUtil: HashingUtil,
  ) {}

  async create(createMessageDto: CreateMessageDto): Promise<Message> {
    const { message, phoneNumber, name } = createMessageDto;

    let conversation = await this.conversationRepository.findOne({
      where: {
        phoneNumber: this.hashingUtil.hashPhoneNumber(phoneNumber),
      },
    });

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (!conversation) {
        conversation = new Conversation();
        conversation.phoneNumber =
          this.hashingUtil.hashPhoneNumber(phoneNumber);
        conversation.name = name;
      }

      conversation.lastMessageTimestamp = new Date();
      conversation = await queryRunner.manager.save(conversation);

      const newMessage = new Message();
      newMessage.message = message;
      newMessage.conversation = conversation;
      await queryRunner.manager.save(newMessage);

      await queryRunner.commitTransaction();

      return newMessage;
    } catch (err) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }
}
