import { Field, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { MessageStatus } from '../../enums/message.enum';
import { Member, TotalCounter } from '../member/member';

@ObjectType()
export class Message {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	senderId: ObjectId;

	@Field(() => String)
	receiverId: ObjectId;

	@Field(() => String)
	messageContent: string;

	@Field(() => MessageStatus)
	messageStatus: MessageStatus;

	@Field(() => String, { nullable: true })
	messageRefId?: ObjectId;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	/** from aggregation **/

	@Field(() => Member, { nullable: true })
	senderData?: Member;

	@Field(() => Member, { nullable: true })
	receiverData?: Member;
}

@ObjectType()
export class Messages {
	@Field(() => [Message])
	list: Message[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}





