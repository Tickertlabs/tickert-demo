export interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

export interface RequestWithUser {
  user: {
    userId: string;
  };
}
