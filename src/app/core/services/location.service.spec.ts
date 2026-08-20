import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { LocationService } from './location.service';
import { ViaCepResponse } from '../models/via-cep.model';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('LocationService', () => {
  let service: LocationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LocationService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(LocationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getViaCep', () => {
    it('should return null for invalid CEP length without making HTTP call', () => {
      let result: ViaCepResponse | null | undefined;
      service.getViaCep('1234').subscribe((res) => {
        result = res;
      });

      expect(result).toBeNull();
      httpMock.expectNone('https://viacep.com.br/ws/1234/json/');
    });

    it('should fetch and return address details for valid 8-digit formatted CEP', () => {
      const mockResponse: ViaCepResponse = {
        cep: '01001-000',
        logradouro: 'Praça da Sé',
        complemento: 'lado ímpar',
        bairro: 'Sé',
        localidade: 'São Paulo',
        uf: 'SP',
      };

      let result: ViaCepResponse | null = null;
      service.getViaCep('01001-000').subscribe((res) => {
        result = res;
      });

      const req = httpMock.expectOne('https://viacep.com.br/ws/01001000/json/');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      expect(result).toEqual(mockResponse);
    });

    it('should return null when ViaCep responds with erro: true', () => {
      let result: ViaCepResponse | null = undefined as unknown as null;
      service.getViaCep('99999-999').subscribe((res) => {
        result = res;
      });

      const req = httpMock.expectOne('https://viacep.com.br/ws/99999999/json/');
      req.flush({ erro: true });

      expect(result).toBeNull();
    });

    it('should handle HTTP error gracefully and return null', () => {
      let result: ViaCepResponse | null = undefined as unknown as null;
      service.getViaCep('01001-000').subscribe((res) => {
        result = res;
      });

      const req = httpMock.expectOne('https://viacep.com.br/ws/01001000/json/');
      req.error(new ProgressEvent('error'), { status: 500, statusText: 'Server Error' });

      expect(result).toBeNull();
    });
  });
});
