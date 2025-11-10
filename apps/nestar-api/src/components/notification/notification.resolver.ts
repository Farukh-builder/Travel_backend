import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { NotificationService } from './notification.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Notification, Notifications } from '../../libs/dto/notification/notification';
import { NotificationsInquiry } from '../../libs/dto/notification/notification.input';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { NotificationUpdate } from '../../libs/dto/notification/notification.update';

@Resolver()
export class NotificationResolver {
	constructor(private readonly notificationService: NotificationService) {}

	// GetNotifications

	@UseGuards(AuthGuard)
	@Query((returns) => Notifications)
	public async getNotifications(
		@Args('input') input: NotificationsInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Notifications> {
		console.log('Query: getNotifications');
		return await this.notificationService.getNotifications(memberId, input);
	}

	// GetUnreadCount

	@UseGuards(AuthGuard)
	@Query((returns) => Number)
	public async getUnreadCount(@AuthMember('_id') memberId: ObjectId): Promise<number> {
		console.log('Query: getUnreadCount');
		return await this.notificationService.getUnreadCount(memberId);
	}

	// MarkNotificationAsRead

	@UseGuards(AuthGuard)
	@Mutation((returns) => Notification)
	public async markNotificationAsRead(
		@Args('input') input: NotificationUpdate,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Notification> {
		console.log('Mutation: markNotificationAsRead');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.notificationService.markAsRead(memberId, input);
	}

	// MarkAllNotificationsAsRead

	@UseGuards(AuthGuard)
	@Mutation((returns) => Boolean)
	public async markAllNotificationsAsRead(@AuthMember('_id') memberId: ObjectId): Promise<boolean> {
		console.log('Mutation: markAllNotificationsAsRead');
		return await this.notificationService.markAllAsRead(memberId);
	}

	// DeleteNotification

	@UseGuards(AuthGuard)
	@Mutation((returns) => Notification)
	public async deleteNotification(
		@Args('notificationId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Notification> {
		console.log('Mutation: deleteNotification');
		const notificationId = shapeIntoMongoObjectId(input);
		return await this.notificationService.deleteNotification(memberId, notificationId);
	}
}




