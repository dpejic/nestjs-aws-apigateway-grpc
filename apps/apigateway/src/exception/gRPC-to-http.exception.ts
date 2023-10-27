import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { HTTP_CODE_FROM_gRPC } from '@types';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class gRPCToHttpInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler
  ): Observable<Error> | Promise<Observable<Error>> {
    return next.handle().pipe(
      catchError((err) => {
        const statusCode =
          HTTP_CODE_FROM_gRPC[err.code] || HttpStatus.INTERNAL_SERVER_ERROR;

        let message;
        try {
          const exception = JSON.parse(err.details);
          if (exception.error) {
            message = exception.error;
          }
        } catch (jsonError) {
          message = err.details;
        }

        return throwError(
          () =>
            new HttpException(
              {
                message,
                statusCode,
                error: HttpStatus[statusCode],
              },
              statusCode,
              {
                cause: err,
              }
            )
        );
      })
    );
  }
}
