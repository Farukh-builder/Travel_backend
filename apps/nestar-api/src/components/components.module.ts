import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { PropertyModule } from './property/property.module';
import { AuthModule } from './auth/auth.module';
import { CommentModule } from './comment/comment.module';
import { LikeModule } from './like/like.module';
import { ViewModule } from './view/view.module';
import { FollowModule } from './follow/follow.module';
import { BoardArticleModule } from './board-article/board-article.module';
import { NoticeModule } from './notice/notice.module';
import { NotificationModule } from './notification/notification.module';
import { MessageModule } from './message/message.module';


@Module({
  imports: [
    MemberModule, 
    AuthModule, 
    PropertyModule,  
    LikeModule, 
    ViewModule, 
    CommentModule, 
    FollowModule, 
    BoardArticleModule,
    NoticeModule,
    NotificationModule,
    MessageModule, 
  ],
  providers: [],
})
export class ComponentsModule {}
