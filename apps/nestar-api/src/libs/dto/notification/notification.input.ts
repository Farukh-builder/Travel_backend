import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class NotificationInput {
  @Field()
  receiverId: string;

  @Field({ nullable: true })
  senderId?: string;

  @Field()
  message: string;

  @Field({ nullable: true })
  type?: string; // “FOLLOW”, “LIKE”, “COMMENT” va h.k.
}
