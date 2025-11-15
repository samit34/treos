import type { Secret, SignOptions } from 'jsonwebtoken';

type ExpiresIn = SignOptions['expiresIn'];

interface JwtConfig {
  secret: Secret;
  refreshSecret: Secret;
  expiresIn: ExpiresIn;
  refreshExpiresIn: ExpiresIn;
}

export const jwtConfig: JwtConfig = {
  secret: (process.env.JWT_SECRET || 'your-secret-key') as Secret,
  refreshSecret: (process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key') as Secret,
  expiresIn: (process.env.JWT_EXPIRE || '1d') as ExpiresIn,
  refreshExpiresIn: (process.env.JWT_REFRESH_EXPIRE || '7d') as ExpiresIn,
};

