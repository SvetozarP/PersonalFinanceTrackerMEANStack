import { Component, OnInit, OnDestroy, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { GlobalSearchService, SearchResult, SearchSuggestion } from '../../../core/services/global-search.service';

@Component({
  selector: 'app-global-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './global-search.component.html',
  styleUrls: ['./global-search.component.scss']
})
export class GlobalSearchComponent implements OnInit, OnDestroy {
  @Output() searchResult = new EventEmitter<SearchResult>();
  @Output() searchCleared = new EventEmitter<void>();

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // State management
  private _isOpen = signal(false);
  private _searchQuery = signal('');
  private _searchResults = signal<SearchResult[]>([]);
  private _searchSuggestions = signal<SearchSuggestion[]>([]);
  private _isSearching = signal(false);
  private _showSuggestions = signal(false);

  // Public observables
  public isOpen = this._isOpen.asReadonly();
  public searchQuery = this._searchQuery.asReadonly();
  public searchResults = this._searchResults.asReadonly();
  public searchSuggestions = this._searchSuggestions.asReadonly();
  public isSearching = this._isSearching.asReadonly();
  public showSuggestions = this._showSuggestions.asReadonly();

  // Computed properties
  public hasResults = computed(() => this._searchResults().length > 0);
  public hasSuggestions = computed(() => this._searchSuggestions().length > 0);
  public resultCount = computed(() => this._searchResults().length);

  constructor(
    private globalSearchService: GlobalSearchService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setupSearchDebounce();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (query.length < 2) {
          this._searchSuggestions.set([]);
          this._searchResults.set([]);
          return [];
        }
        return this.globalSearchService.getSuggestions(query);
      }),
      takeUntil(this.destroy$)
    ).subscribe(suggestions => {
      this._searchSuggestions.set(suggestions);
    });
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const query = target.value;
    this._searchQuery.set(query);
    this.searchSubject.next(query);
  }

  onSearchFocus(): void {
    this._showSuggestions.set(true);
    this._isOpen.set(true);
  }

  onSearchBlur(): void {
    // Delay hiding to allow for clicks
    setTimeout(() => {
      this._showSuggestions.set(false);
      this._isOpen.set(false);
    }, 250);
  }

  onSearchSubmit(event: Event): void {
    event.preventDefault();
    const query = this._searchQuery();
    if (query.trim()) {
      this.performSearch(query);
    }
  }

  onSuggestionClick(suggestion: SearchSuggestion): void {
    this._searchQuery.set(suggestion.text);
    this._showSuggestions.set(false);
    this.performSearch(suggestion.text);
  }

  onResultClick(result: SearchResult): void {
    this.router.navigate([result.url]);
    this.clearSearch();
    this.searchResult.emit(result);
  }

  clearSearch(): void {
    this._searchQuery.set('');
    this._searchResults.set([]);
    this._searchSuggestions.set([]);
    this._showSuggestions.set(false);
    this._isOpen.set(false);
    this.searchCleared.emit();
  }

  private performSearch(query: string): void {
    if (!query.trim()) return;

    this._isSearching.set(true);
    this._showSuggestions.set(false);

    this.globalSearchService.search(query).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (results) => {
        this._searchResults.set(results);
        this._isSearching.set(false);
      },
      error: (error) => {
        console.error('Search error:', error);
        this._isSearching.set(false);
      }
    });
  }

  getSuggestionIcon(type: string): string {
    switch (type) {
      case 'recent': return 'fas fa-history';
      case 'suggestion': return 'fas fa-lightbulb';
      case 'category': return 'fas fa-tag';
      case 'budget': return 'fas fa-piggy-bank';
      case 'transaction': return 'fas fa-receipt';
      default: return 'fas fa-search';
    }
  }

  getResultIcon(type: string): string {
    switch (type) {
      case 'transaction': return 'fas fa-receipt';
      case 'budget': return 'fas fa-piggy-bank';
      case 'category': return 'fas fa-tag';
      case 'report': return 'fas fa-chart-bar';
      default: return 'fas fa-file';
    }
  }

  formatResultMetadata(result: SearchResult): string {
    if (!result.metadata) return '';

    const currencyPipe = new CurrencyPipe('en-US');

    switch (result.type) {
      case 'transaction':
        const amount = result.metadata.amount;
        const date = new Date(result.metadata.date).toLocaleDateString('en-US', {
          month: 'numeric',
          day: 'numeric',
          year: 'numeric'
        });
        return `${currencyPipe.transform(amount)} • ${date}`;
      
      case 'budget':
        const budgetAmount = result.metadata.amount;
        const period = result.metadata.period;
        return `${currencyPipe.transform(budgetAmount)} • ${period}`;
      
      case 'category':
        const color = result.metadata.color;
        return color ? `Color: ${color}` : '';
      
      default:
        return '';
    }
  }

  getResultTypeLabel(type: string): string {
    switch (type) {
      case 'transaction': return 'Transaction';
      case 'budget': return 'Budget';
      case 'category': return 'Category';
      case 'report': return 'Report';
      default: return 'Item';
    }
  }
}
