import { useState, useEffect, useRef, memo } from 'react';
import { useStore } from '../store/useStore';
import { searchNominatim } from '../utils/geocoding';
import { debounce } from '../utils/debounce';
import type { NominatimResult } from '../types';

function SearchBar() {
  const {
    searchQuery,
    searchResults,
    isSearching,
    showSearchResults,
    setSearchQuery,
    setSearchResults,
    setIsSearching,
    setShowSearchResults,
    setMapCenter,
    setMapZoom,
  } = useStore();

  const [localQuery, setLocalQuery] = useState(searchQuery);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced search function
  const debouncedSearch = debounce(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const results = await searchNominatim(query);
    setSearchResults(results);
    setIsSearching(false);
    setShowSearchResults(true);
  }, 300);

  useEffect(() => {
    setSearchQuery(localQuery);
    debouncedSearch(localQuery);
  }, [localQuery]);

  // Handle result selection
  const handleSelectResult = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    
    setMapCenter([lon, lat]);
    setMapZoom(14);
    setShowSearchResults(false);
    setLocalQuery(result.display_name);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          onFocus={() => {
            if (searchResults.length > 0) {
              setShowSearchResults(true);
            }
          }}
          placeholder="Search location..."
          className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
          </div>
        )}
        {!isSearching && localQuery && (
          <button
            onClick={() => {
              setLocalQuery('');
              setSearchResults([]);
              setShowSearchResults(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showSearchResults && searchResults.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {searchResults.map((result) => (
            <button
              key={result.place_id}
              onClick={() => handleSelectResult(result)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-sm text-gray-900">{result.display_name}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {result.type} • {result.category}
              </div>
            </button>
          ))}
        </div>
      )}

      {showSearchResults && !isSearching && searchResults.length === 0 && localQuery && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-sm text-gray-500">
          No results found
        </div>
      )}
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(SearchBar);

