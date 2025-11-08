import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Notification {
  @Field(() => ID)
  _id: string;

  @Field()
  receiverId: string;

  @Field({ nullable: true })
  senderId?: string;

  @Field()
  message: string;

  @Field({ nullable: true })
  type?: string; // LIKE | FOLLOW | COMMENT | PROPERTY

  @Field({ defaultValue: false })
  isRead: boolean;

  @Field(() => Date)
  createdAt: Date;
}
