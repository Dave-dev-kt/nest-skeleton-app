import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateCommentDto } from './Dto/createComment.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateCommentDto } from './Dto/updateComment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prismaService: PrismaService) {}

  async createComment(createCommentDto: CreateCommentDto, userId: number) {
    const { postId, content } = createCommentDto;
    const post = await this.prismaService.post.findUnique({
      where: { postId },
    });

    if (!post) throw new NotFoundException('Post not found');

    await this.prismaService.comment.create({
      data: { content, userId, postId },
    });

    return { data: 'Comment created !' };
  }

  async delete(commentId: number, userId: number, postId: number) {
    const comment = await this.prismaService.comment.findUnique({
      where: { commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');

    if (comment.postId !== postId)
      throw new UnauthorizedException('Post id does not match');
    if (comment.userId !== userId)
      throw new ForbiddenException('Forbiden action');

    await this.prismaService.comment.delete({
      where: { commentId },
    });

    return { data: 'Comment deleted' };
  }

  async updateComment(
    userId: number,
    commentId: number,
    updateCommentDto: UpdateCommentDto,
  ) {
    const { content, postId } = updateCommentDto;

    const comment = await this.prismaService.comment.findUnique({
      where: { commentId },
    });

    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.postId !== postId)
      throw new UnauthorizedException('Post id does not match !');
    if (comment.userId !== userId)
      throw new ForbiddenException('Forbidden action !');

    await this.prismaService.comment.update({
      where: { commentId },
      data: { content },
    });

    return { data: 'Comment updated' };
  }
}
