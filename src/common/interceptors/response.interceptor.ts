import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'message' in data && 'data' in data) {
          return {
            success: true,
            message: data.message,
            data: data.data,
          };
        }

        return {
          success: true,
          message: 'Request completed successfully',
          data,
        };
      }),
    );
  }
}
