import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BatchService } from './batch.service';
import { BatchController } from './batch.controller';
import { DatabaseModule } from './database/database.module';
import { ScheduleModule } from '@nestjs/schedule';


@Module({
  imports: [ConfigModule.forRoot(), DatabaseModule, ScheduleModule.forRoot()],
  controllers: [BatchController],
  providers: [BatchService],
})
export class BatchModule {}
