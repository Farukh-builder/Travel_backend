import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length } from 'class-validator';
import { NoticeStatus } from '../../enums/notice.enum';
import { ObjectId } from 'mongoose';

@InputType()
export class NoticeUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@Field(() => NoticeStatus, { nullable: true })
	noticeStatus?: NoticeStatus;

	@IsOptional()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	noticeTitle?: string;

	@IsOptional()
	@Length(3, 500)
	@Field(() => String, { nullable: true })
	noticeContent?: string;
}

