import http from "http";
import { createLogger, format, Logger, transports } from "winston";
import { customOmitBy, isNilCheck } from "~/utils";
import { CONFIG } from "./config";
import CustomError from "./custom-error";

interface RequestInfo {
  path?: string;
  headers?: Record<string, any>;
  params?: Record<string, any>;
  body?: any;
  query?: Record<string, any>;
  data?: any;
}

interface ResponseInfo {
  req?: RequestInfo;
  path?: string;
  statusCode?: number;
  headers?: Record<string, any>;
  data?: any;
}

interface MetaInfo {
  hostname: string;
  datetime: number;
  date: string;
  source: string;
  [key: string]: any;
}

/**
 * Logger helper class for consistent logging across the application
 */
class LogHelper {
  private logger: Logger | Console;

  constructor() {
    this.logger =
      CONFIG.envConf.VITE_CONSOLE_LOGGER === "true"
        ? console
        : this.initializeWinstonLogger();
  }

  private initializeWinstonLogger(): Logger {
    return createLogger({
      format: format.combine(format.timestamp(), format.json()),
      transports: [
        new transports.File({
          level: "info",
          filename: `${process.env.HOME}/.server_logs/logger.logs`,
          maxsize: 50000,
          tailable: true,
          maxFiles: 50,
        }),
      ],
    });
  }

  /**
   * Parses HTTP request information into a structured format
   */
  private static parseRequest(req: http.IncomingMessage | any): RequestInfo {
    if (!req) return {};

    return customOmitBy(
      {
        path: `${req.method} ${
          (!isNilCheck(req.baseUrl) &&
            req.route &&
            !isNilCheck(req.route.path) &&
            req.baseUrl + req.route.path) ||
          req.path
        }`,
        headers: req.headers,
        params: req.params,
        body: req.body,
        query: req.query,
        data: req.data,
      },
      isNilCheck
    );
  }

  /**
   * Parses HTTP response information into a structured format
   */
  private static parseResponse(res: any): ResponseInfo {
    if (!res) return {};

    return customOmitBy(
      {
        req: LogHelper.parseRequest(res.request),
        path: res.request?.path,
        statusCode: res.status,
        headers: res.headers,
        data: res.data,
      },
      isNilCheck
    );
  }

  /**
   * Formats metadata for logging
   */
  private static formatMeta(meta: Record<string, any>): MetaInfo {
    const newMeta: Record<string, any> = {};

    for (const [key, value] of Object.entries(meta)) {
      try {
        if (value instanceof http.IncomingMessage) {
          newMeta[key] = LogHelper.parseRequest(value);
        } else if (value instanceof http.ServerResponse || key === "response") {
          newMeta[key] = LogHelper.parseResponse(value);
        } else if (value instanceof CustomError) {
          newMeta[key] = value.toLogJSON();
        } else if (value instanceof Error) {
          newMeta[key] = { message: value.message, stack: value.stack };
        } else if (Array.isArray(value) || typeof value === "object") {
          newMeta[key] = JSON.stringify(value);
        } else if (["string", "number", "boolean"].includes(typeof value)) {
          newMeta[key] = value;
        }
      } catch (error: any) {
        newMeta[key] = `[Unserializable data: ${error.message}]`;
      }
    }

    const date = new Date();
    return {
      ...newMeta,
      hostname: CONFIG.publicURL,
      datetime: date.getTime(),
      date: date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      source:
        Error().stack?.split("\n").slice(3).join("\n") || "Unknown source",
    };
  }

  /**
   * Log message with INFO level
   */
  public info(message: string, meta: Record<string, any> = {}): void {
    this.logger.info(message, LogHelper.formatMeta(meta));
  }

  /**
   * Log message with ERROR level
   */
  public error(message: string, meta: Record<string, any> = {}): void {
    this.logger.error(message, LogHelper.formatMeta(meta));
  }

  /**
   * Log message with WARN level
   */
  public warn(message: string, meta: Record<string, any> = {}): void {
    this.logger.warn(message, LogHelper.formatMeta(meta));
  }

  /**
   * Log message with DEBUG level
   */
  public debug(message: string, meta: Record<string, any> = {}): void {
    this.logger.debug(message, LogHelper.formatMeta(meta));
  }
}

export default LogHelper;
