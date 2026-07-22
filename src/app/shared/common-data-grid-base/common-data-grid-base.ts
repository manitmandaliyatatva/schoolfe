import { inject, signal } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import { PageRequest, PaginatedResponse } from '../../core/models/request.model';
import { ApiResponse } from '../../core/models/responce.model';
import { ConfirmationService } from '../services/dialog.service';

export abstract class CommonDataGridBasePageComponent<
  TItem,
 TRequest = PageRequest
> {
  protected readonly confirmService = inject(ConfirmationService);

  readonly totalCount = signal<number>(0);
  readonly pageIndex = signal<number>(0);
  readonly pageSize = signal<number>(10);
  readonly pageSizeOptions = [5, 10, 25, 100];
  readonly searchText = signal<string>('');
  readonly sortField = signal<string>('');
  readonly sortOrder = signal<'asc' | 'desc' | ''>('');

  dataSource = new MatTableDataSource<TItem>([]);

  protected deleteTitle = 'Record';
  protected deleteMessage = 'Are you sure you want to delete this record?';

  protected abstract fetchList(
    request: TRequest
  ): Observable<ApiResponse<PaginatedResponse<TItem> | TItem[]>>;

  protected deleteItem?(id: number | string): Observable<ApiResponse<boolean>>;

  protected buildRequest(): TRequest {
    return {
      pageIndex: this.pageIndex(),
      pageSize: this.pageSize(),
      searchText: this.searchText(),
      sortField: this.sortField(),
      sortOrder: this.sortOrder(),
    } as TRequest;
  }

  loadData(): void {
    const request = this.buildRequest();

    this.fetchList(request).subscribe({
      next: (res) => {
        const data = res.data;
        if (Array.isArray(data)) {
          // Non-paginated response
          this.dataSource.data = data;
          this.totalCount.set(data.length);
        } else {
          // Paginated response
          this.dataSource.data = data?.items ?? [];
          this.totalCount.set(data?.totalCount ?? 0);
        }
      },
      error: (err) => {
        console.error('Error fetching data', err);
      },
    });
  }

  onDelete(id: number | string): void {
    this.confirmService
      .confirm({
        title: `Delete ${this.deleteTitle}`,
        message: this.deleteMessage,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.deleteItem!(id).subscribe({
            next: () => this.loadData(),
          });
        }
      });
  }

  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadData();
  }

  onSortChange(sort: { active: string; direction: 'asc' | 'desc' | '' }): void {
    this.pageIndex.set(0);
    this.sortField.set(sort.active);
    this.sortOrder.set(sort.direction);
    this.loadData();
  }

  onSearchChange(searchValue: string): void {
    this.searchText.set(searchValue);
    this.loadData();
  }

  applyFilters(): void {
    this.loadData();
  }

  resetFilters(): void {
    this.searchText.set('');
    this.pageIndex.set(0);
    this.loadData();
  }
}
