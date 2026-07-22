import { Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';

@Directive({
  selector: '[appInfiniteScroll]',
  standalone: true
})
export class InfiniteScrollDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef);
  private observer?: IntersectionObserver;

  private _hasMore = true;
  private _isFetching = false;

  @Input()
  set hasMore(val: boolean) {
    this._hasMore = val;
  }
  get hasMore(): boolean {
    return this._hasMore;
  }

  @Input()
  set isFetching(val: boolean) {
    const wasFetching = this._isFetching;
    this._isFetching = val;
    
    // If we finished fetching and there's more to fetch, refresh observation
    if (wasFetching && !val && this._hasMore) {
      this.refreshObserver();
    }
  }
  get isFetching(): boolean {
    return this._isFetching;
  }

  @Input() root: HTMLElement | null = null;
  @Input() rootMargin = '100px';
  @Input() threshold = 0.1;

  @Output() readonly scrollEnd = new EventEmitter<void>();

  ngOnInit(): void {
    const options = {
      root: this.root,
      rootMargin: this.rootMargin,
      threshold: this.threshold
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && this._hasMore && !this._isFetching) {
          this.scrollEnd.emit();
        }
      });
    }, options);

    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private refreshObserver(): void {
    if (this.observer) {
      setTimeout(() => {
        if (this.observer) {
          this.observer.unobserve(this.el.nativeElement);
          this.observer.observe(this.el.nativeElement);
        }
      }, 100);
    }
  }
}
