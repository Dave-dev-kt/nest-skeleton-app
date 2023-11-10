import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty()
  @IsOptional()
  readonly content: string;
  @IsNotEmpty()
  readonly postId: number;
}
