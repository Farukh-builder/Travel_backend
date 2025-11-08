import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { NoticeService } from './notice.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Notice, Notices } from '../../libs/dto/notice/notice';
import { AllNoticesInquiry, NoticeInput, NoticesInquiry } from '../../libs/dto/notice/notice.input';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { WithoutGuard } from '../auth/guards/without.guard';
import { NoticeUpdate } from '../../libs/dto/notice/notice.update';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';

@Resolver()
export class NoticeResolver {
    constructor(private readonly noticeService: NoticeService) {}
    
    // CreateNotice

    @UseGuards(AuthGuard)
    @Mutation((returns) => Notice)
    public async createNotice(
        @Args('input') input: NoticeInput,
        @AuthMember('_id') memberId: ObjectId,
    ): Promise<Notice> {
        console.log('Mutation: createNotice');
        return await this.noticeService.createNotice(memberId, input);
    }

    // GetNotice

    @UseGuards(WithoutGuard)
    @Query((returns) => Notice)
    public async getNotice(
        @Args('noticeId') input: string,
        @AuthMember('_id') memberId: ObjectId,
    ): Promise<Notice> {
        console.log('Query: getNotice');
        const noticeId = shapeIntoMongoObjectId(input)
        return await this.noticeService.getNotice(memberId, noticeId)
    }

    // UpdateNotice

    @UseGuards(AuthGuard)
    @Mutation((returns) => Notice)
    public async updateNotice(
        @Args('input') input: NoticeUpdate,
        @AuthMember('_id') memberId: ObjectId,
    ): Promise<Notice> {
        console.log('Mutation: updateNotice');
        input._id = shapeIntoMongoObjectId(input._id);
        return await this.noticeService.updateNotice(memberId, input)
    }

    // GetNotices

    @UseGuards(WithoutGuard)
    @Query((returns) => Notices)
    public async getNotices(
        @Args('input') input: NoticesInquiry,
        @AuthMember('_id') memberId: ObjectId,
    ): Promise<Notices> {
     console.log('Query: getNotices');
     return await this.noticeService.getNotices(memberId, input)
    }

    /** ADMIN */

    // GetAllNoticesByAdmin

    @Roles(MemberType.ADMIN)
    @UseGuards(RolesGuard) 
    @Query((returns) => Notices)
    public async getAllNoticesByAdmin(
        @Args('input') input: AllNoticesInquiry, 
        @AuthMember('_id') memberId: ObjectId,
 ): Promise<Notices> {
    console.log('Query: getAllNoticesByAdmin');
    return await this.noticeService.getAllNoticesByAdmin(input);
    }

    // updateNoticeByAdmin

    @Roles(MemberType.ADMIN)
    @UseGuards(RolesGuard) 
    @Mutation((returns) => Notice)
    public async updateNoticeByAdmin(
        @Args('input') input: NoticeUpdate,
        @AuthMember('_id') memberId: ObjectId,
    ): Promise<Notice> {
      console.log('Mutation: updateNoticeByAdmin');
    input._id = shapeIntoMongoObjectId(input._id);
    return await this.noticeService.updateNoticeByAdmin(input)
    }
  

     // RemoveNoticeByAdmin

    @Roles(MemberType.ADMIN)
    @UseGuards(RolesGuard) 
    @Mutation((returns) => Notice)
    public async removeNoticeByAdmin(
        @Args('noticeId') input: string,
        @AuthMember('_id') memberId: ObjectId,
    ): Promise<Notice> {
    console.log('Mutation: removeNoticeByAdmin');
    const noticeId = shapeIntoMongoObjectId(input)
    return await this.noticeService.removeNoticeByAdmin(noticeId)
    }

    
}

