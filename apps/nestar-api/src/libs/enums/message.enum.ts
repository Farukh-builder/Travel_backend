import { registerEnumType } from '@nestjs/graphql';

export enum MessageStatus {
	UNREAD = 'UNREAD',
	READ = 'READ',
}
registerEnumType(MessageStatus, {
	name: 'MessageStatus',
});

export enum MessageGroup {
	CHAT = 'CHAT',
}
registerEnumType(MessageGroup, {
	name: 'MessageGroup',
});

