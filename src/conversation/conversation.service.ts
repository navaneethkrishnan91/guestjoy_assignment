import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { Conversation } from './entities/conversation.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Message } from '../message/entities/message.entity';
import { HashingUtil } from '../utils/hashing.util';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    private dataSource: DataSource,
    private readonly hashingUtil: HashingUtil,
  ) {}

  async create(
    createConversationDto: CreateConversationDto,
  ): Promise<Conversation> {
    const { phoneNumber, name } = createConversationDto;

    const conversation = await this.conversationRepository.findOne({
      where: {
        phoneNumber: this.hashingUtil.hashPhoneNumber(phoneNumber),
      },
    });

    if (conversation) {
      throw new HttpException(
        {
          message: `Entity with the phone number ${phoneNumber} already exists`,
          phoneNumber: 'Phone number must be unique',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const newConversation = new Conversation();
    newConversation.phoneNumber = this.hashingUtil.hashPhoneNumber(phoneNumber);
    newConversation.name = name;
    newConversation.lastMessageTimestamp = new Date();

    return this.conversationRepository.save(newConversation);
  }

  findOne(id: number): Promise<Conversation> {
    return this.conversationRepository.findOne({
      where: {
        id,
      },
    });
  }

  async remove(id: number): Promise<void> {
    // Find the conversation
    const conversation = await this.conversationRepository.findOne({
      where: {
        id,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.delete(Message, { conversation: conversation });
      await queryRunner.manager.delete(Conversation, { id });

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  findMessages(id: number) {
    return this.conversationRepository.findOne({
      where: {
        id,
      },
      relations: {
        messages: true,
      },
    });
  }
}
