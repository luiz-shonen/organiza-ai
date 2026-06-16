import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ViaCepResponse } from '../models/via-cep.model';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private readonly http = inject(HttpClient);
  private readonly VIACEP_URL = 'https://viacep.com.br/ws';

  getViaCep(cep: string): Observable<ViaCepResponse | null> {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      return of(null);
    }

    return this.http.get<ViaCepResponse>(`${this.VIACEP_URL}/${cleanCep}/json/`).pipe(
      map(res => {
        if (res.erro) return null;
        return res;
      }),
      catchError(() => of(null))
    );
  }
}
