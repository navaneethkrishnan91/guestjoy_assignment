import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationModule } from './conversation/conversation.module';
import { Conversation } from './conversation/entities/conversation.entity';
import { MessageModule } from './message/message.module';
import { Message } from './message/entities/message.entity';
import { AuthMiddleware } from './auth/auth.middleware';
import { LoggerMiddleware } from './logger/logger.middleware';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'db',
      port: 3306,
      username: 'root',
      database: 'guest_joy',
      entities: [Conversation, Message],
      synchronize: true,
    }),
    ConversationModule,
    MessageModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware, LoggerMiddleware).forRoutes('*');
  }
}
