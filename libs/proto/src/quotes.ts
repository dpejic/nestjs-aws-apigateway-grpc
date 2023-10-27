/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from "@nestjs/microservices";
import { Observable } from "rxjs";

export const protobufPackage = "quote";

export interface Empty {
}

export interface Quote {
  id: string;
  quote: string;
}

export interface GetPageResponse {
  htmlChunk: string;
}

export const QUOTE_PACKAGE_NAME = "quote";

export interface QuoteServiceClient {
  getRandomQuote(request: Empty): Observable<Quote>;

  getPage(request: Empty): Observable<GetPageResponse>;

  getError(request: Empty): Observable<Empty>;
}

export interface QuoteServiceController {
  getRandomQuote(request: Empty): Promise<Quote> | Observable<Quote> | Quote;

  getPage(request: Empty): Observable<GetPageResponse>;

  getError(request: Empty): Promise<Empty> | Observable<Empty> | Empty;
}

export function QuoteServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ["getRandomQuote", "getPage", "getError"];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcMethod("QuoteService", method)(constructor.prototype[method], method, descriptor);
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcStreamMethod("QuoteService", method)(constructor.prototype[method], method, descriptor);
    }
  };
}

export const QUOTE_SERVICE_NAME = "QuoteService";
