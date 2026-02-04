import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { LoginDto, SignUpDto, AuthResponseDto } from './dto/auth.dto';
import { JwtService } from '@nestjs/jwt';
import { SignInData, PassportUser } from './types/auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signUp(input: SignUpDto): Promise<AuthResponseDto> {
    console.log('Signup input:', input);

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(input.email);
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, 10);

    // Create user with required fields
    const userData: Prisma.UserCreateInput = {
      email: input.email,
      passwordHash: hashedPassword,
      ...(input.role && { role: input.role }),
    };

    // Create user
    const user = await this.usersService.create(userData);

    // Return auth output
    return {
      accessToken: this.jwtService.sign({ userId: user.id }),
      userId: user.id,
      email: user.email ?? null,
    };
  }

  signIn(user: PassportUser): AuthResponseDto {
    return {
      accessToken: this.jwtService.sign({ userId: user.userId }),
      userId: user.userId,
      email: user.email ?? null,
    };
  }

  async validateUser(input: LoginDto): Promise<SignInData | null> {
    const user = await this.usersService.findByEmail(input.email);
    if (
      user &&
      user.passwordHash &&
      (await bcrypt.compare(input.password, user.passwordHash))
    ) {
      return { userId: user.id, email: user.email ?? '' };
    }
    return null;
  }

  generateTokenForUser(userId: string): string {
    return this.jwtService.sign({ userId });
  }
}
