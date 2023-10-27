import { Inject, Injectable } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  GetPageResponse,
  QUOTE_SERVICE_NAME,
  QuoteServiceClient,
} from '@proto';
import { Response } from 'aws-serverless-express';

@Injectable()
export class AppService {
  private quotesService: QuoteServiceClient;

  constructor(@Inject(QUOTE_SERVICE_NAME) private client: ClientGrpc) {
    this.quotesService =
      this.client.getService<QuoteServiceClient>(QUOTE_SERVICE_NAME);
  }

  async getRandomQuote() {
    return this.quotesService.getRandomQuote({});
  }

  async getPage(response: Response) {
    response.set({
      'Content-Type': 'text/html; charset=utf-8'
    });

    this.quotesService.getPage({}).subscribe({
      next: (chunk: GetPageResponse) => {
        response.write(chunk.htmlChunk);
      },
      complete: () => {
        response.end();
      },
      error: () => {
        response.end();
      },
    });
  }

  async getError() {
    return this.quotesService.getError({});
  }
}
