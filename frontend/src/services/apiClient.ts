import type { components } from '../types/api.gen';

export type HealthResponse = components['schemas']['HealthResponse'];
export type RegionSummary = components['schemas']['RegionSummary'];
export type RegionDetail = components['schemas']['RegionDetail'];
export type LayerInfo = components['schemas']['LayerInfo'];
export type DatasetRecord = components['schemas']['DatasetRecord'];
export type PointInspection = components['schemas']['PointInspection'];

export interface ApiErrorEnvelope {
  error_code: string;
  message: string;
  details?: Record<string, unknown> | null;
  request_id?: string | null;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly errorCode: string;
  public readonly details?: Record<string, unknown> | null;
  public readonly requestId?: string | null;

  constructor(status: number, envelope: ApiErrorEnvelope) {
    super(envelope.message || 'API request failed');
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = envelope.error_code || 'INTERNAL_ERROR';
    this.details = envelope.details;
    this.requestId = envelope.request_id;
  }
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = (import.meta.env.VITE_API_BASE_URL as string) || '/api/v1') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    
    const headers = new Headers(options.headers || {});
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }
    if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let envelope: ApiErrorEnvelope;
      try {
        envelope = await response.json();
      } catch {
        envelope = {
          error_code: 'INTERNAL_ERROR',
          message: `HTTP error ${response.status}: ${response.statusText}`,
        };
      }
      throw new ApiError(response.status, envelope);
    }

    return response.json() as Promise<T>;
  }

  public get<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  public post<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public getHealth(): Promise<HealthResponse> {
    return this.get<HealthResponse>('/health');
  }

  public getRegions(): Promise<RegionSummary[]> {
    return this.get<RegionSummary[]>('/regions');
  }

  public getRegion(regionId: string): Promise<RegionDetail> {
    return this.get<RegionDetail>(`/regions/${regionId}`);
  }

  public getLayers(regionId?: string): Promise<LayerInfo[]> {
    const query = regionId ? `?region_id=${encodeURIComponent(regionId)}` : '';
    return this.get<LayerInfo[]>(`/layers${query}`);
  }

  public getDatasets(regionId?: string): Promise<DatasetRecord[]> {
    const query = regionId ? `?region_id=${encodeURIComponent(regionId)}` : '';
    return this.get<DatasetRecord[]>(`/datasets${query}`);
  }

  public getDataset(datasetId: string): Promise<DatasetRecord> {
    return this.get<DatasetRecord>(`/datasets/${encodeURIComponent(datasetId)}`);
  }

  public inspectPoint(regionId: string, lat: number, lon: number): Promise<PointInspection> {
    const query = `?region_id=${encodeURIComponent(regionId)}&lat=${lat}&lon=${lon}`;
    return this.get<PointInspection>(`/terrain/point${query}`);
  }

  public getEvaDefaults(): Promise<components['schemas']['EvaDefaultsResponse']> {
    return this.get<components['schemas']['EvaDefaultsResponse']>('/eva/defaults');
  }
}

export const apiClient = new ApiClient();
