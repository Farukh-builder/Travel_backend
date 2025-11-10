import { BadRequestException, forwardRef, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Notification, Notifications } from '../../libs/dto/notification/notification';
import { MemberService } from '../member/member.service';
import { NotificationInput, NotificationsInquiry } from '../../libs/dto/notification/notification.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';
import { NotificationGroup, NotificationStatus, NotificationType } from '../../libs/enums/notification.enum';
import { NotificationUpdate } from '../../libs/dto/notification/notification.update';
import { lookupAuthorData, shapeIntoMongoObjectId } from '../../libs/config';
import { LikeGroup } from '../../libs/enums/like.enum';
import { CommentGroup } from '../../libs/enums/comment.enum';
import { SocketGateway } from '../../socket/socket.gateway';

@Injectable()
export class NotificationService {
	constructor(
		@InjectModel('Notification') private readonly notificationModel: Model<Notification>,
		@InjectModel('Property') private readonly propertyModel: Model<any>,
		@InjectModel('BoardArticle') private readonly boardArticleModel: Model<any>,
		@Inject(forwardRef(() => MemberService))
		private readonly memberService: MemberService,
		private readonly socketGateway: SocketGateway,
	) {}

	public async createNotification(input: NotificationInput): Promise<Notification | null> {
		try {
			// Don't create notification if author is receiver (self-action)
			if (input.authorId?.toString() === input.receiverId?.toString()) {
				console.log('Skipping notification: author is receiver');
				return null;
			}

			const existingNotification = await this.notificationModel
				.findOne({
					authorId: input.authorId,
					receiverId: input.receiverId,
					notificationType: input.notificationType,
					notificationGroup: input.notificationGroup,
					notificationStatus: NotificationStatus.WAIT,
					...(input.propertyId && { propertyId: input.propertyId }),
					...(input.articleId && { articleId: input.articleId }),
				})
				.exec();

			if (existingNotification) {
				console.log('Similar notification already exists');
				return existingNotification;
			}

			const result = await this.notificationModel.create(input);
			console.log('Notification created:', result._id);

			if (result && input.receiverId) {
				this.socketGateway.emitNotificationToUser(input.receiverId.toString(), {
					_id: result._id,
					notificationType: result.notificationType,
					notificationGroup: result.notificationGroup,
					notificationTitle: result.notificationTitle,
					notificationDesc: result.notificationDesc,
					notificationStatus: result.notificationStatus,
					authorId: result.authorId,
					createdAt: result.createdAt,
				});
			}

			return result;
		} catch (err) {
			console.log('Error creating notification:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getNotifications(memberId: ObjectId, input: NotificationsInquiry): Promise<Notifications> {
		const match: T = { receiverId: memberId };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (input.search) {
			const { notificationStatus, notificationType, notificationGroup } = input.search;
			if (notificationStatus) match.notificationStatus = notificationStatus;
			if (notificationType) match.notificationType = notificationType;
			if (notificationGroup) match.notificationGroup = notificationGroup;
		}

		console.log('Getting notifications for member:', memberId);

		const result = await this.notificationModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupAuthorData,
							{ $unwind: { path: '$authorData', preserveNullAndEmptyArrays: true } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result[0];
	}

	public async getUnreadCount(memberId: ObjectId): Promise<number> {
		const count = await this.notificationModel
			.countDocuments({
				receiverId: memberId,
				notificationStatus: NotificationStatus.WAIT,
			})
			.exec();

		return count;
	}

	public async markAsRead(memberId: ObjectId, input: NotificationUpdate): Promise<Notification> {
		const { _id } = input;

		const result = await this.notificationModel
			.findOneAndUpdate(
				{
					_id: _id,
					receiverId: memberId,
				},
				{ notificationStatus: NotificationStatus.READ },
				{ new: true },
			)
			.exec();

		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return result;
	}

	public async markAllAsRead(memberId: ObjectId): Promise<boolean> {
		const result = await this.notificationModel
			.updateMany(
				{
					receiverId: memberId,
					notificationStatus: NotificationStatus.WAIT,
				},
				{ notificationStatus: NotificationStatus.READ },
			)
			.exec();

		console.log(`Marked ${result.modifiedCount} notifications as read`);
		return true;
	}

	public async deleteNotification(memberId: ObjectId, notificationId: ObjectId): Promise<Notification> {
		const result = await this.notificationModel
			.findOneAndDelete({
				_id: notificationId,
				receiverId: memberId,
			})
			.exec();

		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		return result;
	}


	public async createLikeNotification(data: {
		authorId: ObjectId;
		likeRefId: ObjectId;
		likeGroup: LikeGroup;
	}): Promise<void> {
		try {
			let receiverId: ObjectId;
			let notificationGroup: NotificationGroup;
			let notificationTitle = 'liked your';
			let notificationDesc = '';
			let propertyId: ObjectId | undefined;
			let articleId: ObjectId | undefined;

			if (data.likeGroup === LikeGroup.PROPERTY) {
				// Get property and owner
				const property = await this.getPropertyById(data.likeRefId);
				receiverId = property.memberId;
				notificationGroup = NotificationGroup.PROPERTY;
				notificationTitle = 'liked your property';
				notificationDesc = property.propertyTitle || '';
				propertyId = data.likeRefId;
			} else if (data.likeGroup === LikeGroup.ARTICLE) {
				// Get article and author
				const article = await this.getBoardArticleById(data.likeRefId);
				receiverId = article.memberId;
				notificationGroup = NotificationGroup.ARTICLE;
				notificationTitle = 'liked your article';
				notificationDesc = article.articleTitle || '';
				articleId = data.likeRefId;
			} else if (data.likeGroup === LikeGroup.MEMBER) {
				// Member like (profile)
				receiverId = data.likeRefId;
				notificationGroup = NotificationGroup.MEMBER;
				notificationTitle = 'liked your profile';
			} else {
				return;
			}

			await this.createNotification({
				notificationType: NotificationType.LIKE,
				notificationGroup,
				notificationTitle,
				notificationDesc,
				authorId: data.authorId,
				receiverId,
				propertyId,
				articleId,
			});
		} catch (err) {
			console.log('Error creating like notification:', err.message);
		}
	}

	public async createCommentNotification(data: {
		authorId: ObjectId;
		commentRefId: ObjectId;
		commentGroup: CommentGroup;
		commentContent: string;
	}): Promise<void> {
		try {
			let receiverId: ObjectId;
			let notificationGroup: NotificationGroup;
			let notificationTitle = 'commented on your';
			let notificationDesc = data.commentContent.substring(0, 100);
			let propertyId: ObjectId | undefined;
			let articleId: ObjectId | undefined;

			if (data.commentGroup === CommentGroup.PROPERTY) {
				const property = await this.getPropertyById(data.commentRefId);
				receiverId = property.memberId;
				notificationGroup = NotificationGroup.PROPERTY;
				notificationTitle = 'commented on your property';
				propertyId = data.commentRefId;
			} else if (data.commentGroup === CommentGroup.ARTICLE) {
				const article = await this.getBoardArticleById(data.commentRefId);
				receiverId = article.memberId;
				notificationGroup = NotificationGroup.ARTICLE;
				notificationTitle = 'commented on your article';
				articleId = data.commentRefId;
			} else if (data.commentGroup === CommentGroup.MEMBER) {
				receiverId = data.commentRefId;
				notificationGroup = NotificationGroup.MEMBER;
				notificationTitle = 'commented on your profile';
			} else {
				return;
			}

			await this.createNotification({
				notificationType: NotificationType.COMMENT,
				notificationGroup,
				notificationTitle,
				notificationDesc,
				authorId: data.authorId,
				receiverId,
				propertyId,
				articleId,
			});
		} catch (err) {
			console.log('Error creating comment notification:', err.message);
		}
	}

	public async createFollowNotification(data: { authorId: ObjectId; followingId: ObjectId }): Promise<void> {
		try {
			await this.createNotification({
				notificationType: NotificationType.FOLLOW,
				notificationGroup: NotificationGroup.MEMBER,
				notificationTitle: 'started following you',
				notificationDesc: '',
				authorId: data.authorId,
				receiverId: data.followingId,
			});
		} catch (err) {
			console.log('Error creating follow notification:', err.message);
		}
	}

	public async removeNotificationOnUnlike(data: {
		authorId: ObjectId;
		likeRefId: ObjectId;
		likeGroup: LikeGroup;
	}): Promise<void> {
		try {
			let notificationGroup: NotificationGroup;

			if (data.likeGroup === LikeGroup.PROPERTY) {
				notificationGroup = NotificationGroup.PROPERTY;
			} else if (data.likeGroup === LikeGroup.ARTICLE) {
				notificationGroup = NotificationGroup.ARTICLE;
			} else if (data.likeGroup === LikeGroup.MEMBER) {
				notificationGroup = NotificationGroup.MEMBER;
			} else {
				return;
			}

			await this.notificationModel
				.findOneAndDelete({
					authorId: data.authorId,
					notificationType: NotificationType.LIKE,
					notificationGroup,
					notificationStatus: NotificationStatus.WAIT,
					$or: [{ propertyId: data.likeRefId }, { articleId: data.likeRefId }, { receiverId: data.likeRefId }],
				})
				.exec();

			console.log('Notification removed on unlike');
		} catch (err) {
			console.log('Error removing notification on unlike:', err.message);
		}
	}

	public async removeNotificationOnUnfollow(data: { authorId: ObjectId; followingId: ObjectId }): Promise<void> {
		try {
			await this.notificationModel
				.findOneAndDelete({
					authorId: data.authorId,
					receiverId: data.followingId,
					notificationType: NotificationType.FOLLOW,
					notificationGroup: NotificationGroup.MEMBER,
					notificationStatus: NotificationStatus.WAIT,
				})
				.exec();

			console.log('Notification removed on unfollow');
		} catch (err) {
			console.log('Error removing notification on unfollow:', err.message);
		}
	}

	/** HELPER METHODS */

	private async getPropertyById(propertyId: ObjectId): Promise<any> {
		const property = await this.propertyModel.findById(propertyId).lean().exec();
		if (!property) throw new InternalServerErrorException('Property not found');
		return property;
	}

	private async getBoardArticleById(articleId: ObjectId): Promise<any> {
		const article = await this.boardArticleModel.findById(articleId).lean().exec();
		if (!article) throw new InternalServerErrorException('Article not found');
		return article;
	}
}

