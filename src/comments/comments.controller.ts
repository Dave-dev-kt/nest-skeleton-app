import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { CreateCommentDto } from './Dto/createComment.dto';
import { UpdateCommentDto } from './Dto/updateComment.dto';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';

@ApiTags('Comments')
@ApiBearerAuth()
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentService: CommentsService) {}

  @Post('create')
  @UseGuards(AuthGuard('jwt'))
  create(@Body() createCommentDto: CreateCommentDto, @Req() req: Request) {
    const userId = req.user['userId'];

    return this.commentService.createComment(createCommentDto, userId);
  }

  @Put('update/:id')
  @UseGuards(AuthGuard('jwt'))
  update(
    @Param('id', ParseIntPipe) commentId: number,
    @Req() req: Request,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    const userId = req.user['userId'];
    return this.commentService.updateComment(
      userId,
      commentId,
      updateCommentDto,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('delete/:id')
  delete(
    @Req() req: Request,
    @Param('id', ParseIntPipe) commentId: number,
    @Body('postId') postId: number,
  ) {
    const userId = req.user['userId'];

    return this.commentService.delete(commentId, userId, postId);
  }
}
