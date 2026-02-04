import {
  Controller,
  Post,
  Body,
  UseGuards,
  Res,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { CurrentUserId } from 'src/auth/decorators/current-user-id.decorator';
import { AuthService } from 'src/auth/auth.service';
import { WalletAuthResponseDto } from 'src/auth/dto/auth.dto';
import { UsersService } from './users.service';
import { WalletAddressDto } from './dto/user.dto';
import { verifyWalletSignature } from './utils/signature-verification';
import type { FastifyReply } from 'fastify';

interface FindByEmailDto {
  email: string;
}

@Controller('users')
export class UserController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Post('find-by-email')
  @UseGuards(JwtAuthGuard)
  async findByEmail(
    @Res() res: FastifyReply,
    @Body() body: FindByEmailDto,
    @CurrentUser() user: { userId: string },
    @CurrentUserId() userId: string,
  ) {
    // user object contains { userId: string } from JWT payload
    console.log('Authenticated user ID:', user.userId);
    console.log('User ID from specific decorator:', userId);
    return await res
      .code(HttpStatus.OK)
      .send(await this.usersService.findByEmail(body.email));
  }

  @Post('connect-wallet')
  async connectWallet(
    @Res() res: FastifyReply,
    @Body() walletAddressDto: WalletAddressDto,
  ): Promise<WalletAuthResponseDto> {
    // Verify signature before saving user
    /* eslint-disable @typescript-eslint/no-unsafe-argument */
    const isValid = await verifyWalletSignature(
      walletAddressDto.walletAddress,
      walletAddressDto.signature,
      walletAddressDto.signedMessageBytes,
    );
    /* eslint-enable @typescript-eslint/no-unsafe-argument */

    if (!isValid) {
      throw new BadRequestException(
        'Invalid signature. Signature does not match the provided address.',
      );
    }

    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
    const user = await this.usersService.upsertByWalletAddress(
      walletAddressDto.walletAddress,
    );

    // Generate JWT token for the user
    const accessToken = this.authService.generateTokenForUser(user.id);

    const response: WalletAuthResponseDto = {
      accessToken,
      userId: user.id,
      walletAddress: walletAddressDto.walletAddress,
    };
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

    return res.code(HttpStatus.OK).send(response);
  }
}
