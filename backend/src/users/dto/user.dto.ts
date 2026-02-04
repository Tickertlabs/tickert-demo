import { IsString, MaxLength } from 'class-validator';

export class WalletAddressDto {
  @IsString({ message: 'Wallet address must be a string' })
  @MaxLength(255, { message: 'Wallet address must not exceed 255 characters' })
  walletAddress: string;

  @IsString({ message: 'Signature must be a string' })
  signature: string;

  @IsString({ message: 'Signed message bytes must be a string' })
  signedMessageBytes: string;
}

