export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Profile not found') {
    super(404, message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends ApiError {
  constructor(statusCode: 400 | 422, message: string) {
    super(statusCode, message);
    this.name = 'ValidationError';
  }
}

export class UpstreamInvalidResponseError extends ApiError {
  constructor(externalApi: 'Genderize' | 'Agify' | 'Nationalize') {
    super(502, `${externalApi} returned an invalid response`);
    this.name = 'UpstreamInvalidResponseError';
  }
}
