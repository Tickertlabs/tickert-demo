export type SignInData = {
  userId: string;
  email: string | null;
};

export type PassportUser = {
  userId: string;
  email: string | null;
};

export type ReqWithUser = {
  user: { userId: string; email: string | null };
};
