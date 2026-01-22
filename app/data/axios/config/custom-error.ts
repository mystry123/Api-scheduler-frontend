class CustomError extends Error {
  error: any;
  logCtx: any;
  logout?: boolean;
  code?: number;

  constructor(
    message: string,
    error: any,
    logCtx?: any,
    logout?: boolean,
    code?: number
  ) {
    super(message);
    this.error = error;
    this.logCtx = logCtx;
    this.logout = logout;
    this.code = code;
  }

  toLogJSON() {
    return {
      message: this.message,
      errorData: this.error.error,
      logCtx: this.logCtx,
      stack: this.stack,
      logout: this.logout,
    };
  }
}

export default CustomError;
