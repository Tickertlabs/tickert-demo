import {
  Body,
  Controller,
  HttpStatus,
  Post,
  UseGuards,
  Request,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { PassportLocalGuard } from './guards/passport.local.guard';
import { AuthResponseDto, SignUpDto } from './dto/auth.dto';
import type { ReqWithUser } from './types/auth.types';
import type { FastifyReply } from 'fastify';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(
    @Res() res: FastifyReply,
    @Body() signUpDto: SignUpDto,
  ): Promise<AuthResponseDto | BadRequestException> {
    return await res
      .code(HttpStatus.OK)
      .send(await this.authService.signUp(signUpDto));
  }

  @Post('login')
  @UseGuards(PassportLocalGuard)
  async login(
    @Res() res: FastifyReply,
    @Request() req: ReqWithUser,
  ): Promise<AuthResponseDto | BadRequestException> {
    return await res
      .code(HttpStatus.OK)
      .send(this.authService.signIn(req.user));
  }
}
