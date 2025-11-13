import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggingInterceptor],
    }).compile();

    interceptor = module.get<LoggingInterceptor>(LoggingInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should log incoming request and outgoing response', (done) => {
    const mockRequest = {
      method: 'GET',
      url: '/api/flags',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0'),
    };

    const mockResponse = {
      statusCode: 200,
    };

    const mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as unknown as ExecutionContext;

    const mockCallHandler: CallHandler = {
      handle: jest.fn().mockReturnValue(of('test response')),
    };

    const logSpy = jest.spyOn(interceptor['logger'], 'log');

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: () => {
        expect(logSpy).toHaveBeenCalledWith(
          expect.stringContaining('Incoming Request: GET /api/flags'),
        );
        expect(logSpy).toHaveBeenCalledWith(
          expect.stringContaining('Outgoing Response: GET /api/flags - Status: 200'),
        );
        done();
      },
    });
  });

  it('should log error when request fails', (done) => {
    const mockRequest = {
      method: 'POST',
      url: '/api/flags',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0'),
    };

    const mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue({}),
      }),
    } as unknown as ExecutionContext;

    const mockError = new Error('Test error');
    const mockCallHandler: CallHandler = {
      handle: jest.fn().mockReturnValue(throwError(() => mockError)),
    };

    const errorSpy = jest.spyOn(interceptor['logger'], 'error');

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      error: () => {
        expect(errorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Request Failed: POST /api/flags - Error: Test error'),
        );
        done();
      },
    });
  });

  it('should handle missing user-agent header', (done) => {
    const mockRequest = {
      method: 'GET',
      url: '/api/flags',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue(undefined),
    };

    const mockResponse = {
      statusCode: 200,
    };

    const mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as unknown as ExecutionContext;

    const mockCallHandler: CallHandler = {
      handle: jest.fn().mockReturnValue(of('test response')),
    };

    const logSpy = jest.spyOn(interceptor['logger'], 'log');

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: () => {
        expect(logSpy).toHaveBeenCalledWith(
          expect.stringContaining('User-Agent: '),
        );
        done();
      },
    });
  });
});
