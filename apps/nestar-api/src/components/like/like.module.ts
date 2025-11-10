import { Module, forwardRef } from '@nestjs/common';
import { LikeService } from './like.service';
import { Mongoose } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import LikeSchema from '../../schemas/Like.model';
import { NotificationModule } from '../notification/notification.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: 'Like',
                schema: LikeSchema,
            }
        ]),
        forwardRef(() => NotificationModule),
    ],
    providers: [LikeService],
    exports: [LikeService],
})
export class LikeModule {}
