export interface InspectableRequest {
  url: string;
  method: string;
  type: string;
  status: 'pending' | 'completed' | 'failed';
  statusCode: number | null;
}

export interface RequestFilters {
  search: string;
  regex: boolean;
  domain: string;
  method: string;
  resourceType: string;
  statusFilter: string;
}

export declare function getRegexError(value: string, enabled: boolean): string | null;
export declare function filterRequests<T extends InspectableRequest>(
  records: readonly T[],
  filters: RequestFilters
): T[];
