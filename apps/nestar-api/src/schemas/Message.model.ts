import { Schema } from 'mongoose';
import { MessageStatus } from '../libs/enums/message.enum';

const MessageSchema = new Schema(
	{
		senderId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		receiverId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		messageContent: {
			type: String,
			required: true,
		},

		messageStatus: {
			type: String,
			enum: MessageStatus,
			default: MessageStatus.UNREAD,
		},

		messageRefId: {
			type: Schema.Types.ObjectId,
			required: false,
		},
	},
	{ timestamps: true, collection: 'messages' },
);

MessageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
MessageSchema.index({ receiverId: 1, messageStatus: 1 });

export default MessageSchema;






