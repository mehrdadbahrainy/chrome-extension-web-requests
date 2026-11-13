import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { filterRequests, getRegexError } from '../request-filters.js';

interface RequestRecord {
  id: string;
  tabId: number;
  url: string;
  method: string;
  type: string;
  initiator: string | null;
  startedAt: number;
  durationMs: number | null;
  status: 'pending' | 'completed' | 'failed';
  statusCode: number | null;
  error: string | null;
}

interface InspectorResponse {
  ok: boolean;
  recording?: boolean;
  requests?: RequestRecord[];
  error?: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  readonly requests = signal<RequestRecord[]>([]);
  readonly tabId = signal<number | null>(null);
  readonly tabName = signal('Finding active tab...');
  readonly recording = signal(true);
  readonly search = signal('');
  readonly method = signal('ALL');
  readonly domain = signal('');
  readonly statusFilter = signal('ALL');
  readonly resourceType = signal('ALL');
  readonly regex = signal(false);
  readonly requestTypes = computed(() => [...new Set(this.requests().map(item => item.type))].sort());
  readonly regexError = computed(() => getRegexError(this.search(), this.regex()));
  readonly hasActiveFilters = computed(() =>
    this.search() !== '' || this.method() !== 'ALL' || this.domain() !== '' ||
    this.statusFilter() !== 'ALL' || this.resourceType() !== 'ALL' || this.regex()
  );
  readonly selectedId = signal<string | null>(null);
  readonly error = signal('');
  readonly busy = signal(false);
  readonly methods = ['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];

  readonly filtered = computed(() =>
    filterRequests(this.requests(), {
      search: this.search(),
      regex: this.regex(),
      method: this.method(),
      domain: this.domain(),
      resourceType: this.resourceType(),
      statusFilter: this.statusFilter()
    }).sort((a, b) => b.startedAt - a.startedAt)
  );

  readonly selected = computed(() =>
    this.requests().find(item => item.id === this.selectedId()) ?? null
  );

  private readonly onStorageChange = (
    changes: Record<string, { newValue?: unknown }>,
    areaName: string
  ) => {
    if (areaName === 'session' && changes['requestsByTab']) {
      const state = changes['requestsByTab'].newValue as Record<string, RequestRecord[]> | undefined;
      this.requests.set(state?.[String(this.tabId())] ?? []);
    }
    if (areaName === 'local' && changes['recording']) {
      this.recording.set(changes['recording'].newValue !== false);
    }
  };

  async ngOnInit(): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.tabs?.query) {
      this.error.set('Open this page as a Chrome extension to inspect network requests.');
      this.tabName.set('Extension required');
      return;
    }
    chrome.storage.onChanged.addListener(this.onStorageChange);
    try {
      // The tabId override enables repeatable browser E2E tests; normal users see the active tab.
      const requested = new URLSearchParams(window.location.search).get('tabId');
      const override = requested !== null ? Number(requested) : NaN;
      let tab: chrome.tabs.Tab | undefined;
      if (Number.isInteger(override) && override >= 0) {
        tab = await chrome.tabs.get(override);
      } else {
        [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      }
      if (tab?.id === undefined || !/^https?:\/\//.test(tab.url ?? '')) {
        this.tabName.set('Open an HTTP(S) website');
        this.error.set('Select a regular website tab before opening the extension.');
        return;
      }
      this.tabId.set(tab.id);
      this.tabName.set(tab.title || new URL(tab.url ?? '').hostname);
      await this.reload();
    } catch (cause) {
      this.error.set(cause instanceof Error ? cause.message : 'Could not connect to the extension.');
    }
  }

  ngOnDestroy(): void {
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.removeListener(this.onStorageChange);
    }
  }

  private async send(message: object): Promise<InspectorResponse> {
    return await chrome.runtime.sendMessage(message) as InspectorResponse;
  }

  async reload(): Promise<void> {
    if (this.tabId() === null) return;
    try {
      const response = await this.send({ type: 'GET_RECORDS', tabId: this.tabId() });
      if (!response.ok) throw new Error(response.error || 'Could not read requests.');
      this.requests.set(response.requests ?? []);
      this.recording.set(response.recording !== false);
      this.error.set('');
    } catch (cause) {
      this.error.set(cause instanceof Error ? cause.message : 'Unable to load requests.');
    }
  }

  async toggleRecording(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      const response = await this.send({ type: 'SET_RECORDING', recording: !this.recording() });
      if (!response.ok) throw new Error(response.error || 'Could not update recording.');
      this.recording.set(response.recording !== false);
      this.error.set('');
    } catch (cause) {
      this.error.set(cause instanceof Error ? cause.message : 'Could not update recording.');
    } finally {
      this.busy.set(false);
    }
  }

  async clear(): Promise<void> {
    if (this.tabId() === null || this.busy()) return;
    this.busy.set(true);
    try {
      const response = await this.send({ type: 'CLEAR_RECORDS', tabId: this.tabId() });
      if (!response.ok) throw new Error(response.error || 'Could not clear requests.');
      this.requests.set([]);
      this.selectedId.set(null);
      this.error.set('');
    } catch (cause) {
      this.error.set(cause instanceof Error ? cause.message : 'Could not clear requests.');
    } finally {
      this.busy.set(false);
    }
  }

  setSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  setMethod(event: Event): void {
    this.method.set((event.target as HTMLSelectElement).value);
  }

  setDomain(event: Event): void {
    this.domain.set((event.target as HTMLInputElement).value);
  }

  setStatus(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value);
  }

  setResourceType(event: Event): void {
    this.resourceType.set((event.target as HTMLSelectElement).value);
  }

  setRegex(event: Event): void {
    this.regex.set((event.target as HTMLInputElement).checked);
  }

  resetFilters(): void {
    this.search.set('');
    this.method.set('ALL');
    this.domain.set('');
    this.statusFilter.set('ALL');
    this.resourceType.set('ALL');
    this.regex.set(false);
  }

  select(id: string): void {
    this.selectedId.set(this.selectedId() === id ? null : id);
  }

  formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('en-US', { hour12: false });
  }

  formatDuration(value: number | null): string {
    return value === null ? '—' : value + ' ms';
  }

  statusLabel(record: RequestRecord): string {
    if (record.status === 'failed') return 'Error';
    if (record.status === 'pending') return 'Pending';
    return String(record.statusCode ?? 'Done');
  }

  statusClass(record: RequestRecord): string {
    if (record.status === 'failed' || (record.statusCode ?? 0) >= 400) return 'bad';
    if (record.status === 'pending') return 'pending';
    return 'good';
  }
}
