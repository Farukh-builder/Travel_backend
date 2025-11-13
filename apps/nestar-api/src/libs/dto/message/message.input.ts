import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { MessageStatus } from '../../enums/message.enum';
import { Direction } from '../../enums/common.enum';
import { availableMessageSorts } from '../../config';

@InputType()
export class MessageInput {
	@IsNotEmpty()
	@Field(() => String)
	receiverId: ObjectId;

	@IsNotEmpty()
	@Length(1, 500)
	@Field(() => String)
	messageContent: string;

	senderId?: ObjectId;
}

@InputType()
class MessageSearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	senderId?: ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	receiverId?: ObjectId;

	@IsOptional()
	@Field(() => MessageStatus, { nullable: true })
	messageStatus?: MessageStatus;
}

@InputType()
export class MessagesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableMessageSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsOptional()
	@Field(() => MessageSearch, { nullable: true })
	search?: MessageSearch;
}

@InputType()
export class GetChatInquiry {
	@IsNotEmpty()
	@Field(() => String)
	memberId: ObjectId;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;
}






