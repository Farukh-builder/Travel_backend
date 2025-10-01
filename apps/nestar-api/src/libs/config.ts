import { ObjectId } from 'bson';

export const availableAgentsSorts = ['createdAt', 'updateAt', 'memberLikes', 'memberViews', 'memberRank'];
export const availableMembersSorts = ['createdAt', 'updateAt', 'memberLikes', 'memberViews'];

export const availableOptions = ['propertyBarter', 'propertyRent'];
export const availablePropertySorts = [
	'createdAt',
	'updatedAt',
	'propertyLikes',
	'propertyViews',
	'propertyRank',
	'propertyPrice',
];
export const availabeBoardArticleSorts = ['createdAt', 'updatedAt', 'articleLikes', 'articleViews']

 /**  IMAGE CONFIGURATION */
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

export const validMimeTypes = ['image/png', 'image/jpg', 'image/jpeg'];
export const getSerialForImage = (filename: string) => {
	const ext = path.parse(filename).ext;
	return uuidv4() + ext;
};

export const shapeIntoMongoObjectId = (target: any) => {
    return typeof target === 'string' ? new ObjectId(target) : target;
}

export const lookupMember = {
	$lookup: {
		from: 'members',
		localField: 'memberId',
		foreignField: '_id',
		as: 'memberData'
	}
}