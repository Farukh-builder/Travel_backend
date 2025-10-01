import { Module } from '@nestjs/common';
import { BoardArticleResolver } from './board-article.resolver';
import { BoardArticleService } from './board-article.service';
import { Mongoose } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { Property } from '../../libs/dto/property/property';
import PropertySchema from '../../schemas/Property.model';
import BoardArticleSchema from '../../schemas/BoardArticle.model';
import { AuthModule } from '../auth/auth.module';
import { MemberModule } from '../member/member.module';
import { ViewModule } from '../view/view.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'BoardArticle',
        schema: BoardArticleSchema
      }
    ]),
    AuthModule,
    MemberModule,
    ViewModule
  ],
  providers: [BoardArticleResolver, BoardArticleService],
  exports: [BoardArticleModule]
})
export class BoardArticleModule {}
