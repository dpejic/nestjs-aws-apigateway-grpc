import { Injectable } from '@nestjs/common';
import { Quote, GetPageResponse } from '@proto';
import path from 'path';
import fs from 'fs';
import { Observable } from 'rxjs';
import { GrpcInternalException } from 'nestjs-grpc-exceptions';

@Injectable()
export class AppService {
  getRandomQuote(): Quote {
    const quote: Quote = {
      id: '1',
      quote: 'Hello there',
    };
    return quote;
  }

  getPage(): Observable<GetPageResponse> {
    const fileStream = fs.createReadStream(
      path.resolve(__dirname + `/assets/page.html`),
      { encoding: 'utf-8' }
    );

    return new Observable<GetPageResponse>((observer) => {
      fileStream.on('data', (chunk: string) => {
        observer.next({ htmlChunk: chunk });
      });

      fileStream.on('end', () => {
        observer.complete();
      });

      fileStream.on('error', (error) => {
        observer.error(error);
      });
    });
  }

  async getError(): Promise<void> {
    throw new GrpcInternalException('Error is thrown');
  }
}
