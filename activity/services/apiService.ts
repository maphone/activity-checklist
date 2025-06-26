// services/apiService.ts - Enhanced API Service with improved response handling
import { API_PUBLIC_URL } from "@/hooks/use-api";
import { getToken } from "@/hooks/secureStore";
import {
  handleApiResponse,
  handleApiError,
  ApiResponse,
} from "../utils/res";

// Configuration
const API_CONFIG = {
  BASE_URL: API_PUBLIC_URL || "http://localhost:3000",
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// Enhanced request options
interface RequestOptions {
  timeout?: number;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  responseType?: "json" | "blob" | "text";
  retryAttempts?: number;
  retryDelay?: number;
  skipPreflight?: boolean;
  validateResponse?: boolean;
  context?: string;
}

// Request configuration
interface RequestConfig extends RequestOptions {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS";
  url: string;
  data?: any;
}

// Enhanced error classes
class ApiError extends Error {
  public status?: number;
  public code?: string;
  public response?: any;
  public retryable?: boolean;

  constructor(
    message: string,
    status?: number,
    code?: string,
    response?: any,
    retryable = true
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.response = response;
    this.retryable = retryable;
  }
}

class NetworkError extends Error {
  public retryable = true;
  constructor(message: string = "Network connection failed") {
    super(message);
    this.name = "NetworkError";
  }
}

class TimeoutError extends Error {
  public retryable = true;
  constructor(message: string = "Request timeout") {
    super(message);
    this.name = "TimeoutError";
  }
}

class CorsError extends Error {
  public retryable = false;
  constructor(message: string = "CORS policy blocked this request") {
    super(message);
    this.name = "CorsError";
  }
}

// Enhanced API Service class
class ApiService {
  private baseURL: string;
  private defaultTimeout: number;
  private defaultHeaders: Record<string, string>;
  private requestInterceptors: Array<(config: RequestConfig) => RequestConfig> =
    [];
  private responseInterceptors: Array<(response: any) => any> = [];

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.defaultTimeout = API_CONFIG.TIMEOUT;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  // Get authentication token
  private async getAuthToken(): Promise<string | null> {
    try {
      const token = getToken() || null;
      return token;
    } catch (error) {
      console.warn("Failed to get auth token:", error);
      return null;
    }
  }

  // Build headers with CORS considerations
  private async buildHeaders(
    customHeaders: Record<string, string> = {},
    skipPreflight: boolean = false
  ): Promise<Record<string, string>> {
    const headers = { ...this.defaultHeaders, ...customHeaders };

    // Add Authorization header
    const token = await this.getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Add custom headers for tracking (may trigger preflight)
    if (!skipPreflight) {
      headers["X-Timestamp"] = new Date().toISOString();
      headers["X-Request-ID"] = this.generateRequestId();
    }

    // Add ngrok header if needed
    if (this.baseURL.includes("ngrok")) {
      headers["ngrok-skip-browser-warning"] = "true";
    }

    return headers;
  }

  // Check if request will trigger preflight
  private willTriggerPreflight(
    method: string,
    headers: Record<string, string>,
    hasBody: boolean
  ): boolean {
    const simpleHeaders = ["accept", "accept-language", "content-language"];
    const complexHeaders = Object.keys(headers).filter(
      (header) =>
        !simpleHeaders.includes(header.toLowerCase()) &&
        !header.toLowerCase().startsWith("content-type")
    );

    if (complexHeaders.length > 0) return true;
    if (!["GET", "HEAD", "POST"].includes(method)) return true;

    const contentType = headers["Content-Type"] || headers["content-type"];
    if (
      hasBody &&
      contentType &&
      !contentType.includes("application/x-www-form-urlencoded") &&
      !contentType.includes("multipart/form-data") &&
      !contentType.includes("text/plain")
    ) {
      return true;
    }

    return false;
  }

  // Generate unique request ID
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Build full URL
  private buildFullUrl(url: string): string {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    const cleanBaseUrl = this.baseURL.replace(/\/$/, "");
    const cleanUrl = url.replace(/^\//, "");

    return `${cleanBaseUrl}/${cleanUrl}`;
  }

  // Enhanced retry mechanism with exponential backoff
  private async retry<T>(
    operation: () => Promise<T>,
    attempts: number = API_CONFIG.RETRY_ATTEMPTS,
    delay: number = API_CONFIG.RETRY_DELAY,
    context: string = "retry"
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i < attempts; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry for client errors (4xx) except 408, 429
        if (error instanceof ApiError && error.status) {
          if (
            error.status >= 400 &&
            error.status < 500 &&
            error.status !== 408 &&
            error.status !== 429
          ) {
            throw error;
          }
        }

        // Don't retry for CORS errors
        if (error instanceof CorsError) {
          throw error;
        }

        // Don't retry for AbortError
        if (error instanceof Error && error.name === "AbortError") {
          throw error;
        }

        // Don't retry if explicitly marked as non-retryable
        if (error instanceof ApiError && error.retryable === false) {
          throw error;
        }

        // Wait before retry with exponential backoff
        if (i < attempts - 1) {
          const waitTime = delay * Math.pow(2, i);
          console.log(
            `[${context}] Retrying in ${waitTime}ms... (${i + 1}/${attempts})`
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }

    throw lastError!;
  }

  // Enhanced main request method
  private async request<T = any>(
    config: RequestConfig
  ): Promise<ApiResponse<T>> {
    const {
      method,
      url,
      data,
      timeout = this.defaultTimeout,
      signal,
      headers: customHeaders = {},
      responseType = "json",
      retryAttempts = API_CONFIG.RETRY_ATTEMPTS,
      retryDelay = API_CONFIG.RETRY_DELAY,
      skipPreflight = false,
      validateResponse = true,
      context = `${method} ${url}`,
    } = config;

    // Apply request interceptors
    let finalConfig = { ...config };
    for (const interceptor of this.requestInterceptors) {
      finalConfig = interceptor(finalConfig);
    }

    const fullUrl = this.buildFullUrl(finalConfig.url);
    const headers = await this.buildHeaders(customHeaders, skipPreflight);
    const hasBody = data != null && ["POST", "PUT", "PATCH"].includes(method);

    console.log(`[${context}] Request:`, {
      url: fullUrl,
      method,
      hasBody,
      willTriggerPreflight: this.willTriggerPreflight(method, headers, hasBody),
      headers: {
        ...headers,
        Authorization: headers.Authorization ? "[HIDDEN]" : undefined,
      },
    });

    const makeRequest = async (): Promise<ApiResponse<T>> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Listen to external abort signal
      if (signal) {
        signal.addEventListener("abort", () => controller.abort());
      }

      try {
        const requestInit: RequestInit = {
          method,
          headers,
          signal: controller.signal,
          mode: "cors",
          credentials: "include",
        };

        // Add body for POST, PUT, PATCH
        if (hasBody) {
          if (data instanceof FormData) {
            requestInit.body = data;
            // Remove Content-Type to let browser set it
            delete headers["Content-Type"];
          } else {
            requestInit.body = JSON.stringify(data);
          }
        }

        const response = await fetch(fullUrl, requestInit);
        clearTimeout(timeoutId);

        console.log(
          `[${context}] Response status:`,
          response.status,
          response.statusText
        );

        // Handle non-OK responses
        if (!response.ok) {
          let errorData: any = {};

          try {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              errorData = await response.json();
            } else {
              errorData = { message: await response.text() };
            }
          } catch (parseError) {
            errorData = { message: response.statusText };
          }

          const isRetryable =
            response.status >= 500 ||
            response.status === 408 ||
            response.status === 429;

          throw new ApiError(
            errorData.message ||
              `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            errorData.code,
            errorData,
            isRetryable
          );
        }

        // Parse response based on responseType
        let responseData: any;

        if (responseType === "blob") {
          responseData = await response.blob();
        } else if (responseType === "text") {
          responseData = await response.text();
        } else {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            try {
              responseData = await response.json();
            } catch (parseError) {
              console.warn(
                `[${context}] Failed to parse JSON response:`,
                parseError
              );
              responseData = await response.text();
            }
          } else {
            responseData = await response.text();
          }
        }

        // Apply response interceptors
        for (const interceptor of this.responseInterceptors) {
          responseData = interceptor(responseData);
        }

        // Use enhanced response handler
        let result: ApiResponse<T>;

        if (responseType === "json" && validateResponse) {
          result = handleApiResponse<T>(responseData, {
            context,
            expectedType:
              Array.isArray(responseData) ||
              (responseData && Array.isArray(responseData.data)) ||
              (responseData && Array.isArray(responseData.items)) ||
              (responseData && Array.isArray(responseData.results))
                ? "array"
                : "object",
          });
        } else {
          // For blob/text responses or when validation is disabled
          result = {
            success: true,
            data: responseData as T,
            message: "Success",
            status: response.status,
          };
        }

        console.log(`[${context}] Processed result:`, {
          success: result.success,
          dataType: Array.isArray(result.data)
            ? `array[${result.data.length}]`
            : typeof result.data,
          message: result.message,
        });

        return result;
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error) {
          if (error.name === "AbortError") {
            if (signal?.aborted) {
              throw error; // External abort
            } else {
              throw new TimeoutError();
            }
          }

          // Handle CORS errors
          if (
            error.message.includes("CORS") ||
            error.message.includes("cross-origin") ||
            error.message.includes("Access-Control-Allow-Origin")
          ) {
            throw new CorsError(`CORS Error: ${error.message}`);
          }

          if (error instanceof ApiError) {
            throw error;
          }

          // Network errors
          throw new NetworkError(error.message);
        }

        throw new ApiError("An unexpected error occurred");
      }
    };

    // Use retry mechanism with enhanced error handling
    try {
      return await this.retry(makeRequest, retryAttempts, retryDelay, context);
    } catch (error) {
      console.error(`[${context}] Request failed:`, error);

      // Use enhanced error handler
      const errorResult = handleApiError(error, context, retryAttempts > 0);

      return {
        success: false,
        data: undefined,
        message: errorResult.message,
        error: errorResult.error,
        status: error instanceof ApiError ? error.status : undefined,
      } as ApiResponse<T>;
    }
  }

  // Enhanced HTTP methods
  async get<T = any>(
    url: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ method: "GET", url, ...options });
  }

  async post<T = any>(
    url: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ method: "POST", url, data, ...options });
  }

  async put<T = any>(
    url: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ method: "PUT", url, data, ...options });
  }

  async patch<T = any>(
    url: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ method: "PATCH", url, data, ...options });
  }

  async delete<T = any>(
    url: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ method: "DELETE", url, ...options });
  }

  // Simple request methods (avoid preflight)
  async simpleGet<T = any>(
    url: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: "GET",
      url,
      ...options,
      skipPreflight: true,
    });
  }

  async simplePost<T = any>(
    url: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: "POST",
      url,
      data,
      ...options,
      skipPreflight: true,
    });
  }

  // Interceptor methods
  addRequestInterceptor(
    interceptor: (config: RequestConfig) => RequestConfig
  ): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: (response: any) => any): void {
    this.responseInterceptors.push(interceptor);
  }

  // Utility methods
  setBaseURL(baseURL: string): void {
    this.baseURL = baseURL;
  }

  setDefaultTimeout(timeout: number): void {
    this.defaultTimeout = timeout;
  }

  setDefaultHeader(key: string, value: string): void {
    this.defaultHeaders[key] = value;
  }

  removeDefaultHeader(key: string): void {
    delete this.defaultHeaders[key];
  }

  // Test CORS configuration
  async testCors(): Promise<boolean> {
    try {
      const response = await fetch(this.baseURL, {
        method: "OPTIONS",
        mode: "cors",
        headers: {
          "Access-Control-Request-Method": "GET",
          "Access-Control-Request-Headers": "authorization",
        },
      });
      return response.ok;
    } catch (error) {
      console.error("CORS test failed:", error);
      return false;
    }
  }

  // Enhanced file upload
  async uploadFile<T = any>(
    url: string,
    file: File,
    additionalData: Record<string, any> = {},
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append("file", file);

    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(
        key,
        typeof value === "string" ? value : JSON.stringify(value)
      );
    });

    return this.post<T>(url, formData, {
      ...options,
      headers: {
        ...options.headers,
        // Don't set Content-Type for FormData
      },
      context: `uploadFile ${file.name}`,
    });
  }

  // Enhanced file download
  async downloadFile(
    url: string,
    filename?: string,
    options: RequestOptions = {}
  ): Promise<void> {
    const response = await this.get<Blob>(url, {
      ...options,
      responseType: "blob",
      context: `downloadFile ${filename || "file"}`,
    });

    if (response.success && response.data) {
      const blob = response.data;
      const downloadUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(downloadUrl);
    } else {
      throw new Error(response.message || "File download failed");
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export error classes
export { ApiError, NetworkError, TimeoutError, CorsError };

// Export types
export type { RequestOptions, RequestConfig, ApiResponse };

// Export default
export default apiService;
