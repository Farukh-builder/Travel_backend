import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { MessageService } from './message.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Message, Messages } from '../../libs/dto/message/message';
import { MessageInput, MessagesInquiry, GetChatInquiry } from '../../libs/dto/message/message.input';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { MessageUpdate } from '../../libs/dto/message/message.update';

@Resolver()
export class MessageResolver {
	constructor(private readonly messageService: MessageService) {}

	@UseGuards(AuthGuard)
	@Mutation((returns) => Message)
	public async createMessage(
		@Args('input') input: MessageInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Message> {
		console.log('Mutation: createMessage');
		input.receiverId = shapeIntoMongoObjectId(input.receiverId);
		return await this.messageService.createMessage(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query((returns) => Messages)
	public async getMessages(
		@Args('input') input: MessagesInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Messages> {
		console.log('Query: getMessages');
		return await this.messageService.getMessages(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query((returns) => Messages)
	public async getChatMessages(
		@Args('input') input: GetChatInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Messages> {
		console.log('Query: getChatMessages');
		input.memberId = shapeIntoMongoObjectId(input.memberId);
		return await this.messageService.getChatMessages(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query((returns) => Number)
	public async getUnreadMessagesCount(@AuthMember('_id') memberId: ObjectId): Promise<number> {
		console.log('Query: getUnreadMessagesCount');
		return await this.messageService.getUnreadCount(memberId);
	}

	@UseGuards(AuthGuard)
	@Mutation((returns) => Message)
	public async markMessageAsRead(
		@Args('input') input: MessageUpdate,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Message> {
		console.log('Mutation: markMessageAsRead');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.messageService.markAsRead(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation((returns) => Message)
	public async deleteMessage(
		@Args('messageId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Message> {
		console.log('Mutation: deleteMessage');
		const messageId = shapeIntoMongoObjectId(input);
		return await this.messageService.deleteMessage(memberId, messageId);
	}
}






