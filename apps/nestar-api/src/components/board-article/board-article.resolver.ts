import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { BoardArticleService } from './board-article.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { BoardArticle, BoardArticles } from '../../libs/dto/board-article/board-article';
import { AllBoardArticlesInquiry, BoardArticleInput, BoardArticlesInquiry } from '../../libs/dto/board-article/board-article.input';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { WithoutGuard } from '../auth/guards/without.guard';
import { BoardArticleUpdate } from '../../libs/dto/board-article/board-article.update';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';

@Resolver()
export class BoardArticleResolver {
    constructor(private readonly boardArticleService: BoardArticleService) {}
    
    // CreateBoardArticle

    @UseGuards(AuthGuard)
    @Mutation((returns) => BoardArticle)
    public async createBoardArticle(
        @Args('input') input: BoardArticleInput,
        @AuthMember('_id') memberId: ObjectId,
    ): Promise<BoardArticle> {
        console.log('Mutation: createBoardArticle');
        return await this.boardArticleService.createBoardArticle(memberId, input);
    }

    // GetBoardArticle

    @UseGuards(WithoutGuard)
    @Query((returns) => BoardArticle)
    public async getBoardArticle(
        @Args('articleId') input: string,
        @AuthMember('_id') memberId: ObjectId,
    ): Promise<BoardArticle> {
        console.log('Mutation: getBoardArticle');
        const articleId = shapeIntoMongoObjectId(input)
        return await this.boardArticleService.getBoardArticle(memberId, articleId)
    }

    // UpdateBoardArticle

    @UseGuards(AuthGuard)
    @Mutation((returns) => BoardArticle)
    public async updateBoardArticle(
        @Args('input') input: BoardArticleUpdate,
        @AuthMember('_id') memberId: ObjectId,
    ): Promise<BoardArticle> {
        console.log('Mutation: updateBoardArticle');
        input._id = shapeIntoMongoObjectId(input._id);
        return await this.boardArticleService.updateBoardArticle(memberId, input)
    }

    // GetBoardArticles

    @UseGuards(WithoutGuard)
    @Query((returns) => BoardArticles)
    public async getBoardArticles(
        @Args('input') input: BoardArticlesInquiry,
        @AuthMember('_id') memberId: ObjectId,
    ): Promise<BoardArticles> {
     console.log('Mutation: getBoardArticles');
     return await this.boardArticleService.getBoardArticles(memberId, input)
    }


    @UseGuards(AuthGuard)
    @Mutation(() => BoardArticle)
    public async likeTargetBoardArticle(
        @Args('articleId') input: string,
        @AuthMember('_id') memberId: ObjectId,
    ): Promise<BoardArticle> {
       console.log('Mutation: likeTargetBoardArticle');
       const likeRefId = shapeIntoMongoObjectId(input)
       return await this.boardArticleService.likeTargetBoardArticle(memberId, likeRefId);
    }

    /** ADMIN */

    // GetAllArticlesByAdmin

    @Roles(MemberType.ADMIN)
    @UseGuards(RolesGuard) 
    @Query((returns) => BoardArticles)
    public async getAllBoardArticlesByAdmin(
        @Args('input') input: AllBoardArticlesInquiry, 
        @AuthMember('_id') memberId: ObjectId,
 ): Promise<BoardArticles> {
    console.log('Query: getAllPropertiesByAdmin');
    return await this.boardArticleService.getAllBoardArticlesByAdmin(input);
    }

    // updateBoardarticleByAdmin

    @Roles(MemberType.ADMIN)
    @UseGuards(RolesGuard) 
    @Mutation((returns) => BoardArticle)
    public async updateBoardArticleByAdmin(
        @Args('input') input: BoardArticleUpdate,
        @AuthMember('_id') memberId: ObjectId,
    ): Promise<BoardArticle> {
      console.log('Mutation: updateboardArticleByAdmin');
    input._id = shapeIntoMongoObjectId(input._id);
    return await this.boardArticleService.updateBoardArticleByAdmin(input)
    }
  

     // RemoveBoardArticleByAdmin

    @Roles(MemberType.ADMIN)
    @UseGuards(RolesGuard) 
    @Mutation((returns) => BoardArticle)
    public async removeBoardArticleByAdmin(
        @Args('articleId') input: string,
        @AuthMember('_id') memberId: ObjectId,
    ): Promise<BoardArticle> {
    console.log('Mutation: removeBoardArticlebyAdmin');
    const articleId = shapeIntoMongoObjectId(input)
    return await this.boardArticleService.removeBoardArticlebyAdmin(articleId)
    }

    
}
