// src/hooks/useSearchAndFilter.tsx
import { useState, useEffect, useMemo } from 'react';
import { FilterOptions } from '../cmps/FilterModal';

type SearchableEntity = {
  [key: string]: any;
};

export function useSearchAndFilter<T extends SearchableEntity>(
  entities: T[],
  searchFields: (keyof T)[] | ((entity: T) => string[]),
  getInstrument: (entity: T) => string,
  getNameForSorting: (entity: T) => string
) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    selectedInstruments: [],
    sortOrder: null
  });

  // Add defensive check to ensure entities is always an array
  const safeEntities = Array.isArray(entities) ? entities : [];

  // Get available instruments for filtering
  const availableInstruments = useMemo(() => {
    const instruments = safeEntities
      .map(entity => getInstrument(entity))
      .filter(instrument => instrument && instrument.trim() !== '')
      .filter((instrument, index, arr) => arr.indexOf(instrument) === index);
    
    // Sort instruments alphabetically in Hebrew
    return instruments.sort((a, b) => a.localeCompare(b, 'he'));
  }, [safeEntities, getInstrument]);

  // Apply search, filtering, and sorting
  const filteredAndSortedEntities = useMemo(() => {
    let result = [...safeEntities];

    // Apply search filter
    if (searchQuery) {
      const lowercaseQuery = searchQuery.toLowerCase();
      
      result = result.filter((entity) => {
        try {
          // If searchFields is a function, call it to get the fields to search
          const fieldsToSearch =
            typeof searchFields === 'function'
              ? searchFields(entity)
              : searchFields.map((field) => {
                  const value = entity[field];
                  return value ? String(value) : '';
                });

          // Safety check that fieldsToSearch is an array
          if (!Array.isArray(fieldsToSearch)) {
            console.error(
              'Expected fieldsToSearch to be an array but got:',
              typeof fieldsToSearch
            );
            return false;
          }

          // Check if any field starts with the search query (precise search)
          return fieldsToSearch.some((fieldValue) => {
            if (typeof fieldValue !== 'string') {
              return false;
            }
            return fieldValue.toLowerCase().startsWith(lowercaseQuery);
          });
        } catch (err) {
          console.error('Error filtering entity:', err);
          return false;
        }
      });
    }

    // Apply instrument filter
    if (filters.selectedInstruments && filters.selectedInstruments.length > 0) {
      result = result.filter(entity => {
        const entityInstrument = getInstrument(entity);
        return filters.selectedInstruments!.includes(entityInstrument);
      });
    }

    // Apply sorting
    if (filters.sortOrder) {
      result.sort((a, b) => {
        const nameA = getNameForSorting(a);
        const nameB = getNameForSorting(b);
        
        const comparison = nameA.localeCompare(nameB, 'he');
        return filters.sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [safeEntities, searchQuery, filters, searchFields, getInstrument, getNameForSorting]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleApplyFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({
      selectedInstruments: [],
      sortOrder: null
    });
  };

  const hasActiveFilters = 
    (filters.selectedInstruments && filters.selectedInstruments.length > 0) ||
    filters.sortOrder !== null;

  return {
    filteredEntities: filteredAndSortedEntities,
    handleSearch,
    searchQuery,
    filters,
    handleApplyFilters,
    clearFilters,
    hasActiveFilters,
    availableInstruments
  };
}