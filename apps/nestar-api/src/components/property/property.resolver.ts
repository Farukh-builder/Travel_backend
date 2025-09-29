import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { PropertyService } from './property.service';
import { Properties, Property } from '../../libs/dto/property/property';
import { AgentPropertiesInquiry, AllPropertiesInquiry, PropertiesInquiry, PropertyInput } from '../../libs/dto/property/property.input';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { WithoutGuard } from '../auth/guards/without.guard';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { PropertyUpdate } from '../../libs/dto/property/property.update';
import { Agent } from 'http';

@Resolver()
export class PropertyResolver {
    constructor(private readonly propertyService: PropertyService) {}

    @Roles(MemberType.AGENT)
    @UseGuards(RolesGuard) // Check Authenticated tst
    @Mutation(() => Property)
    public async createProperty(
        @Args('input') input: PropertyInput, 
        @AuthMember('_id') memberId: ObjectId,
    ): Promise<Property> {
     console.log('Mutation: createProperty');
     input.memberId = memberId;

     return await this.propertyService.createProperty(input)
    }

    // GetProperty

    @UseGuards(WithoutGuard)
    @Query((returns) => Property)
    public  async getProperty(
        @Args('propertyId') input: string, 
        @AuthMember('_id') memberId: ObjectId,
    ): Promise<Property> {
        console.log('Query: getProperty');
        const propertyId = shapeIntoMongoObjectId(input)
        return await this.propertyService.getProperty(memberId, propertyId)
    }

    // UpdateProperty

    @Roles(MemberType.AGENT)
    @UseGuards(RolesGuard) // Check Authenticated tst
    @Mutation((returns) => Property)
    public async updateProperty(
        @Args('input') input: PropertyUpdate, 
        @AuthMember('_id') memberId: ObjectId,
    ): Promise<Property> {
        console.log('Mutation: updateProperty');
        input._id = shapeIntoMongoObjectId(input._id);
        return await this.propertyService.updateProperty(memberId, input)
    }
    

    // GetProperties

    @UseGuards(WithoutGuard)
    @Query((returns) => Properties)
    public async getProperties(
        @Args('input') input: PropertiesInquiry, 
        @AuthMember('_id') memberId: ObjectId,
    ): Promise<Properties> {
        console.log('Query: getProperties');
        return await this.propertyService.getProperties(memberId, input)
    }

    // GetAgentProperties

    @Roles(MemberType.AGENT)
    @UseGuards(RolesGuard) // Check Authenticated tst
    @Query((returns) => Properties)
    public async getAgentProperties(
        @Args('input') input: AgentPropertiesInquiry, 
        @AuthMember('_id') memberId: ObjectId,
    ): Promise<Properties> {
        console.log('Query: getAgentProperties');
        return await this.propertyService.getAgentProperties(memberId, input);
    }

    /** ADMIN **/
    

    @Roles(MemberType.ADMIN)
    @UseGuards(RolesGuard) 
    @Query((returns) => Properties)
    public async getAllPropertiesByAdmin(
        @Args('input') input: AllPropertiesInquiry, 
        @AuthMember('_id') memberId: ObjectId,
    ): Promise<Properties> {
      console.log('Query: getAllPropertiesByAdmin');
      return await this.propertyService.getAllPropertiesByAdmin(input);
    }
}
