import { Module } from '@nestjs/common';
import { MessageResolver } from './message.resolver';
import { MessageService } from './message.service';
import { MongooseModule } from '@nestjs/mongoose';
import MessageSchema from '../../schemas/Message.model';
import { AuthModule } from '../auth/auth.module';
import { SocketModule } from '../../socket/socket.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{
				name: 'Message',
				schema: MessageSchema,
			},
		]),
		AuthModule,
		SocketModule,
	],
	providers: [MessageResolver, MessageService],
	exports: [MessageService],
})
export class MessageModule {}





