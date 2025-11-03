import { registerEnumType } from '@nestjs/graphql';

export enum PropertyType {
	RELAXTION = 'RELAXTION',
	ADVANTURE = 'ADVANTURE',
	FAMILY = 'FAMILY',
}
registerEnumType(PropertyType, {
	name: 'PropertyType',
});

export enum PropertyStatus {
	ACTIVE = 'ACTIVE',
	INACTIVE = 'INACTIVE',
	DELETE = 'DELETE',
}
registerEnumType(PropertyStatus, {
	name: 'PropertyStatus',
});

export enum PropertyLocation {
  SEOUL = 'SEOUL',
  TOKYO = 'TOKYO',
  BANGKOK = 'BANGKOK',
  DUBAI = 'DUBAI',
  PARIS = 'PARIS',
  LONDON = 'LONDON',
  NEW_YORK = 'NEW_YORK',
  ROME = 'ROME',
  SINGAPORE = 'SINGAPORE',
  BALI = 'BALI',
}

registerEnumType(PropertyLocation, {
	name: 'PropertyLocation',
});
