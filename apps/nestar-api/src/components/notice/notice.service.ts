import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Notice, Notices } from '../../libs/dto/notice/notice';
import { MemberService } from '../member/member.service';
import { AllNoticesInquiry, NoticeInput, NoticesInquiry } from '../../libs/dto/notice/notice.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';
import { NoticeStatus } from '../../libs/enums/notice.enum';
import { NoticeUpdate } from '../../libs/dto/notice/notice.update';
import { lookupMember, shapeIntoMongoObjectId } from '../../libs/config';

@Injectable()
export class NoticeService {
    constructor(@InjectModel('Notice') private readonly noticeModel: Model<Notice>,
    private readonly memberService: MemberService,
) {}

public async createNotice(memberId: ObjectId, input: NoticeInput): Promise<Notice> {
    input.memberId = memberId;
    try {
        const result = await this.noticeModel.create(input);
        return result; 
    } catch (err) {
        console.log('Error, Service.model:', err.message);
        throw new BadRequestException(Message.CREATE_FAILED)
    }
}

public async getNotice(memberId: ObjectId, noticeId: ObjectId): Promise<Notice> {
    const search: T = {
        _id: noticeId,
        noticeStatus: NoticeStatus.ACTIVE,
    };

    const targetNotice: Notice = await this.noticeModel.findOne(search).lean().exec();
    if (!targetNotice) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    targetNotice.memberData = await this.memberService.getMember(null, targetNotice.memberId);
    return targetNotice;
}

public async updateNotice(memberId: ObjectId, input: NoticeUpdate): Promise<Notice> {
    const { _id } = input;
    
    const result = await this.noticeModel
     .findOneAndUpdate({ _id: _id, memberId: memberId, noticeStatus: NoticeStatus.ACTIVE}, input,
         {new:true},
    )
    .exec();

    if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

    return result;
}

public async getNotices(memberId: ObjectId, input: NoticesInquiry): Promise<Notices> {
    const { noticeCategory, text } = input.search;
    const match: T = { noticeStatus: NoticeStatus.ACTIVE };
    const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

    if (noticeCategory) match.noticeCategory = noticeCategory;
    if (text) match.noticeTitle = { $regex: new RegExp(text, 'i') };
    if (input.search?.memberId) {
        match.memberId = shapeIntoMongoObjectId(input.search.memberId);
    }
    console.log('match:', match);

    const result = await this.noticeModel
            .aggregate([
            { $match: match },
            { $sort: sort },
            {
              $facet: {
                list: [
                  { $skip: (input.page -1) * input.limit },
                  { $limit: input.limit },
                  lookupMember,
                  { $unwind: '$memberData' },
                ],
                metaCounter: [{ $count: 'total' }],
              }
            }
            ])
            .exec();
        if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
         return result[0];
}

public async getAllNoticesByAdmin(input: AllNoticesInquiry): Promise<Notices> {
    const { noticeStatus, noticeCategory } = input.search;
    const match: T = {};
    const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

    if (noticeStatus) match.noticeStatus = noticeStatus;
    if (noticeCategory) match.noticeCategory = noticeCategory;

    const result = await this.noticeModel
      .aggregate([
      { $match: match },
      { $sort: sort },
      {
        $facet: {
          list: [
            { $skip: (input.page -1) * input.limit },
            { $limit: input.limit },
            lookupMember,
            { $unwind: '$memberData' },
          ],
          metaCounter: [{ $count: 'total' }],
        }
      }
      ])
      .exec();
      if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
      return result[0];
}

public async updateNoticeByAdmin(input: NoticeUpdate): Promise<Notice> {
    const { _id, noticeStatus } = input;
  
    const result = await this.noticeModel
      .findOneAndUpdate(
        { _id: _id },
        input,
        { new: true },
      )
      .exec();

    if (!result) {
      throw new InternalServerErrorException(Message.UPDATE_FAILED);
    }

    return result; 
}

public async removeNoticeByAdmin(noticeId: ObjectId): Promise<Notice> {
    const search: T = { _id: noticeId, noticeStatus: NoticeStatus.DELETE };
    const result = await this.noticeModel.findOneAndDelete(search).exec();
    if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

    return result;
}

}

