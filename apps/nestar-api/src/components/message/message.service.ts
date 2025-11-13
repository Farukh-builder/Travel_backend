import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Message, Messages } from '../../libs/dto/message/message';
import { Direction, Message as Msg } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';
import { MessageStatus } from '../../libs/enums/message.enum';
import { MessageInput, MessagesInquiry, GetChatInquiry } from '../../libs/dto/message/message.input';
import { MessageUpdate } from '../../libs/dto/message/message.update';
import { lookupSenderData, lookupReceiverData } from '../../libs/config';
import { SocketGateway } from '../../socket/socket.gateway';

@Injectable()
export class MessageService {
	constructor(
		@InjectModel('Message') private readonly messageModel: Model<Message>,
		private readonly socketGateway: SocketGateway,
	) {}

	public async createMessage(memberId: ObjectId, input: MessageInput): Promise<Message> {
		try {
			input.senderId = memberId;
			const result = await this.messageModel.create(input);

			// Emit message to receiver via WebSocket
			if (result && input.receiverId) {
				const populatedMessage = await this.messageModel
					.findById(result._id)
					.populate('senderId', 'memberNick memberImage memberPhone')
					.populate('receiverId', 'memberNick memberImage memberPhone')
					.lean()
					.exec();

				this.socketGateway.emitMessageToUser(input.receiverId.toString(), populatedMessage);
			}

			return result;
		} catch (err) {
			console.log('Error creating message:', err.message);
			throw new BadRequestException(Msg.CREATE_FAILED);
		}
	}

	public async getMessages(memberId: ObjectId, input: MessagesInquiry): Promise<Messages> {
		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (input.search) {
			const { senderId, receiverId, messageStatus } = input.search;
			if (senderId) match.senderId = senderId;
			if (receiverId) match.receiverId = receiverId;
			if (messageStatus) match.messageStatus = messageStatus;
		}

		const result = await this.messageModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupSenderData,
							{ $unwind: { path: '$senderData', preserveNullAndEmptyArrays: true } },
							lookupReceiverData,
							{ $unwind: { path: '$receiverData', preserveNullAndEmptyArrays: true } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Msg.NO_DATA_FOUND);
		return result[0];
	}

	public async getChatMessages(memberId: ObjectId, input: GetChatInquiry): Promise<Messages> {
		const match: T = {
			$or: [
				{ senderId: memberId, receiverId: input.memberId },
				{ senderId: input.memberId, receiverId: memberId },
			],
		};

		const sort: T = { createdAt: Direction.ASC };

		const result = await this.messageModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupSenderData,
							{ $unwind: { path: '$senderData', preserveNullAndEmptyArrays: true } },
							lookupReceiverData,
							{ $unwind: { path: '$receiverData', preserveNullAndEmptyArrays: true } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		// Mark messages as read
		await this.messageModel
			.updateMany(
				{
					senderId: input.memberId,
					receiverId: memberId,
					messageStatus: MessageStatus.UNREAD,
				},
				{ messageStatus: MessageStatus.READ },
			)
			.exec();

		if (!result.length) throw new InternalServerErrorException(Msg.NO_DATA_FOUND);
		return result[0];
	}

	public async getUnreadCount(memberId: ObjectId): Promise<number> {
		const count = await this.messageModel
			.countDocuments({
				receiverId: memberId,
				messageStatus: MessageStatus.UNREAD,
			})
			.exec();

		return count;
	}

	public async markAsRead(memberId: ObjectId, input: MessageUpdate): Promise<Message> {
		const { _id } = input;

		const result = await this.messageModel
			.findOneAndUpdate(
				{
					_id: _id,
					receiverId: memberId,
				},
				{ messageStatus: MessageStatus.READ },
				{ new: true },
			)
			.exec();

		if (!result) throw new InternalServerErrorException(Msg.UPDATE_FAILED);

		return result;
	}

	public async deleteMessage(memberId: ObjectId, messageId: ObjectId): Promise<Message> {
		const result = await this.messageModel
			.findOneAndDelete({
				_id: messageId,
				$or: [{ senderId: memberId }, { receiverId: memberId }],
			})
			.exec();

		if (!result) throw new InternalServerErrorException(Msg.REMOVE_FAILED);

		return result;
	}
}






