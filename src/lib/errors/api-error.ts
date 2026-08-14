export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

export function toApiErrorBody(error: unknown): { status: number; body: ApiErrorBody } {
  if (error instanceof ApiError) {
    return { status: error.status, body: { error: { code: error.code, message: error.message } } };
  }
  return {
    status: 500,
    body: { error: { code: "INTERNAL_ERROR", message: "Unexpected server error" } },
  };
}
