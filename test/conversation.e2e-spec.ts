import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { INestApplication } from '@nestjs/common';
import { Conversation } from '../src/conversation/entities/conversation.entity';
import { Repository } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateConversationDto } from '../src/conversation/dto/create-conversation.dto';
import { HashingUtil } from '../src/utils/hashing.util';
import { Message } from '../src/message/entities/message.entity';

describe('ParcelsController (e2e)', () => {
  let app: INestApplication;
  let createdConversation: Conversation;
  let conversationRepository: Repository<Conversation>;
  let hashingUtil: HashingUtil;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: 'db',
          port: 3306,
          username: 'root',
          password: '',
          database: 'guest_joy',
          entities: [Conversation, Message],
          synchronize: true,
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    conversationRepository = moduleFixture.get('ConversationRepository');
    hashingUtil = moduleFixture.get<HashingUtil>(HashingUtil);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /conversation', () => {
    it('should create a new conversation', async () => {
      const conversation: CreateConversationDto = {
        phoneNumber: '123123567891',
        name: 'Tim',
      };

      const response = await request(app.getHttpServer())
        .post('/conversation')
        .set('authorization', 'guestjoy')
        .send(conversation)
        .expect(201);

      createdConversation = response.body;

      expect(createdConversation.phoneNumber).toEqual(hashingUtil.hashPhoneNumber(conversation.phoneNumber));
      expect(createdConversation.name).toEqual(conversation.name);
    });
  });

  describe('GET /conversation', () => {
    it('should find the created conversation in the results', async () => {
      const response = await request(app.getHttpServer())
        .get(`/conversation/${createdConversation.id}`)
        .set('authorization', 'guestjoy')
        .expect(200);

      const convsersation = response.body;

      expect(convsersation.id).toEqual(createdConversation.id);
      expect(convsersation.name).toEqual(createdConversation.name);
      expect(convsersation.phoneNumber).toEqual(createdConversation.phoneNumber);
    });
  });
});