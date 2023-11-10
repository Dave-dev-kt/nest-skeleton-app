import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePostDto } from './dto/createPost.dto';
import { UpdatePostDto } from './dto/updatePost.dto';

@Injectable()
export class PostService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAll() {
    return await this.prismaService.post.findMany({
      include: {
        user: {
          select: {
            email: true,
            username: true,
            password: false,
          },
        },
        comment: {
          include: {
            user: { select: { password: false, username: true, email: true } },
          },
        },
      },
    });
  }

  async createPost(userId: number, createPostDto: CreatePostDto) {
    const { body, title } = createPostDto;

    await this.prismaService.post.create({ data: { body, title, userId } });

    return { data: 'Post created' };
  }

  async deletePost(userId: number, postId: number) {
    const post = await this.prismaService.post.findUnique({
      where: { postId },
    });

    if (!post) throw new NotFoundException('Post not found !');

    if (post.userId !== userId)
      throw new ForbiddenException('Forbidden action');

    await this.prismaService.post.delete({ where: { postId } });

    return { data: 'Post deleted !' };
  }
  async updatePost(userId: any, postId: number, updatePostDto: UpdatePostDto) {
    const post = await this.prismaService.post.findUnique({
      where: { postId },
    });

    if (!post) throw new NotFoundException('Post not found !');

    if (post.userId !== userId)
      throw new ForbiddenException('Forbidden action');

    await this.prismaService.post.update({
      where: { postId },
      data: { ...updatePostDto },
    });

    return { data: 'Post updated' };
  }
}
