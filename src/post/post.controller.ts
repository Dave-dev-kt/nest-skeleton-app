import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PostService } from './post.service';
import { AuthGuard } from '@nestjs/passport';
import { CreatePostDto } from './dto/createPost.dto';
import { Request } from 'express';
import { UpdatePostDto } from './dto/updatePost.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Post')
@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  getAll() {
    return this.postService.getAll();
  }

  @Post('create')
  @UseGuards(AuthGuard('jwt'))
  create(@Body() createPostDto: CreatePostDto, @Req() req: Request) {
    const userId = req.user['userId'];
    return this.postService.createPost(userId, createPostDto);
  }

  @Delete('delete/:id')
  @UseGuards(AuthGuard('jwt'))
  delete(@Param('id', ParseIntPipe) postId: number, @Req() req: Request) {
    const userId = req.user['userId'];

    return this.postService.deletePost(userId, postId);
  }

  @Put('update/:id')
  @UseGuards(AuthGuard('jwt'))
  update(
    @Param('id', ParseIntPipe) postId: number,
    @Req() req: Request,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    const userId = req.user['userId'];

    return this.postService.updatePost(userId, postId, updatePostDto);
  }
}
