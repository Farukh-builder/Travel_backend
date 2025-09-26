import { ObjectId } from 'bson';

export const availableAgentsSorts = ['createdAt', 'updateAt', 'memberLikes', 'memberViews', 'memberRank']

export const shapeIntoMongoObjectId = (target: any) => {
    return typeof target === 'string' ? new ObjectId(target) : target;
}