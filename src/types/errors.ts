export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, '유효성_검사_오류', 400);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string, service: string) {
    super(`${service} 오류: ${message}`, '외부_서비스_오류', 500);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(message, '데이터베이스_오류', 500);
  }
} 