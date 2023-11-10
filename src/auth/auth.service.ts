import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import { MailerService } from 'src/mailer/mailer.service';
import { SigninDto } from './dto/signin.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ResetPasswordDemandDto } from './dto/resetPasswordDemand.dto';
import { ResetPasswordConfirmationDto } from './dto/resetPasswordConfirmation.dto';
import { DeleteAccountDto } from './dto/deleteAccount.dto';
@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailerService: MailerService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}
  async signup(signupDto: SignupDto) {
    const { username, email, password } = signupDto;
    // ** Vérifier si l'utilisateur est déjà inscrit

    const user = await this.prismaService.user.findUnique({ where: { email } });

    if (user) throw new ConflictException('User already exists');

    // ** Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    // ** Enregistrer l'utilisateur dans la base de données

    await this.prismaService.user.create({
      data: { email, username, password: hashedPassword },
    });
    // ** Envoyer un email de confirmation

    await this.mailerService.sendSignupConfirmation(email);
    // ** Retourner une réponse de succès
    return { data: 'User successfully created' };
  }

  async signin(signinDto: SigninDto) {
    const { email, password } = signinDto;

    // ** Vérifier si l'utilisateur est déjà inscrit
    const user = await this.prismaService.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');
    // ** Comparer le mot de passe saisi avec le hash
    const match = await bcrypt.compare(password, user.password);

    if (!match) throw new UnauthorizedException('user or password incorrect');
    // ** Retourner un token jwt
    const payload = {
      sub: user.userId,
      email: user.email,
    };
    const token = this.jwtService.sign(payload, {
      expiresIn: '2h',
      secret: this.configService.get('SECRET_KEY'),
    });

    return {
      token,
      user: {
        username: user.username,
        email: user.email,
      },
    };
  }

  async resetPasswordDemand(resetPasswordDemandDto: ResetPasswordDemandDto) {
    const { email } = resetPasswordDemandDto;
    const user = await this.prismaService.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    const code = speakeasy.totp({
      secret: this.configService.get('OTP_CODE'),
      digits: 5,
      step: 60 * 15,
      encoding: 'base32',
    });

    const url = 'http://localhost:300/auth/reset-password-confirmation';

    await this.mailerService.sendResetPassword(email, url, code);

    return { data: 'Reset password email has been sent !' };
  }

  async resetPasswordConfirmation(
    resetPasswordConfirmationDto: ResetPasswordConfirmationDto,
  ) {
    const { code, password, email } = resetPasswordConfirmationDto;
    const user = await this.prismaService.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    const match = speakeasy.totp.verify({
      secret: this.configService.get('OTP_CODE'),
      token: code,
      digits: 5,
      step: 60 * 15,
      encoding: 'base32',
    });

    if (!match) throw new UnauthorizedException('Invalid token');

    const hash = await bcrypt.hash(password, 10);
    await this.prismaService.user.update({
      where: { email },
      data: { password: hash },
    });
    // Renvoyer un mail de confirmation de changement
    await this.mailerService.sendConfirmPasswordReseted(email);
    return { data: 'Password updated !' };
  }

  async deleteAccount(userId: number, deleteAccountDto: DeleteAccountDto) {
    const { password } = deleteAccountDto;

    const user = await this.prismaService.user.findUnique({
      where: { userId },
    });

    if (!user) throw new NotFoundException('User not exist !');

    const match = await bcrypt.compare(password, user.password);

    if (!match) throw new UnauthorizedException('Password does not match !');

    await this.prismaService.user.delete({ where: { userId } });

    return { data: 'User successfully deleted' };
  }
}
