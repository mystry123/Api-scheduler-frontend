import axios, { AxiosInstance, ResponseType as AxiosResponseType } from "axios";
import { parse } from "cookie";
import { CONFIG } from "./config/config";
import { logger } from "~/utils";

export function getAxiosInstance(
  request?: Request,
  contentType?: string,
  responseType?: AxiosResponseType
): AxiosInstance {
  let cookieHeader = "";
  let forwardedFor = "";
  let realIp = "";
  let userAgent = "";

  // Handle server-side requests
  if (request) {
    cookieHeader = request.headers.get("Cookie") || "";
    forwardedFor = request.headers.get("x-forwarded-for") || "";
    realIp = request.headers.get("x-real-ip") || "";
    userAgent = request.headers.get("user-agent") || "";
  } 

  const instance = axios.create({
    baseURL: CONFIG.baseURL,
    timeout: 120000,
    responseType,
    withCredentials: true,
    headers: {
      "Content-Type": contentType || "application/json",
      ...(forwardedFor && { "x-forwarded-for": forwardedFor }),
      ...(realIp && { "x-real-ip": realIp }),
      ...(userAgent && { "user-agent": userAgent }),
    },
  });

  instance.interceptors.request.use((config) => {
    // Handle authentication
    if (request) {
      // Server-side: Use cookies from request
      const parsedCookies = parse(cookieHeader);
      const accessToken = parsedCookies["access_token"] || "";

      if (accessToken) {
        config.headers["Authorization"] = `Bearer ${accessToken}`;
      } else {
        console.warn("No access token found in cookies!");
      }

      // Forward cookies from incoming request to backend
      if (cookieHeader) {
        config.headers["Cookie"] = cookieHeader;
      }
    } 

    logger.info("Axios Request", {
      url: config.url,
      method: config.method,
      headers: config.headers,
      baseURL: config.baseURL,
    });

    return config;
  });

  instance.interceptors.response.use(
    (response) => {
      logger.info("Axios Response", {
        status: response.status,
        data: response.data,
        baseURL: response.config.baseURL,
      });
      return response;
    },
    async (error) => {

    

      logger.error("Axios Response Error", {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
      });
      return Promise.reject(error);
    }
  );

  return instance;
}
