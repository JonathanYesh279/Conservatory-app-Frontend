// src/hooks/useSearchAndFilterDropdown.tsx
import { useState, useEffect, useMemo } from 'react';
import { FilterDropdownOptions } from '../cmps/FilterDropdown';

type SearchableEntity = {
  [key: string]: any;
};

export function useSearchAndFilterDropdown<T extends SearchableEntity>(
  entities: T[],
  searchFields: (keyof T)[] | ((entity: T) => string[]),
  getInstrument: (entity: T) => string,
  getAge?: (entity: T) => number,
  getClass?: (entity: T) => number,
  getNameForSorting?: (entity: T) => string
) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterDropdownOptions>({
    instruments: [],
    ageRange: null,
    classRange: null,
    sortOrder: null
  });

  // Add defensive check to ensure entities is always an array
  const safeEntities = Array.isArray(entities) ? entities : [];

  // Get available options for filtering
  const availableOptions = useMemo(() => {
    const result = {
      instruments: [] as string[],
      ageRange: null as [number, number] | null,
      classRange: null as [number, number] | null
    };

    safeEntities.forEach(entity => {
      // Instruments
      const instrument = getInstrument(entity);
      if (instrument && instrument.trim() !== '' && !result.instruments.includes(instrument)) {
        result.instruments.push(instrument);
      }
    });

    // Calculate age range (if getter provided)
    if (getAge) {
      const ages = safeEntities
        .map(entity => getAge(entity))
        .filter(age => age && !isNaN(age))
        .sort((a, b) => a - b);
      if (ages.length > 0) {
        result.ageRange = [ages[0], ages[ages.length - 1]];
      }
    }

    // Calculate class range (if getter provided)
    if (getClass) {
      const classes = safeEntities
        .map(entity => getClass(entity))
        .filter(cls => cls && !isNaN(cls))
        .sort((a, b) => a - b);
      if (classes.length > 0) {
        result.classRange = [classes[0], classes[classes.length - 1]];
      }
    }

    // Sort instruments alphabetically in Hebrew
    result.instruments.sort((a, b) => a.localeCompare(b, 'he'));

    return result;
  }, [safeEntities, getInstrument, getAge, getClass]);

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
    if (filters.instruments && filters.instruments.length > 0) {
      result = result.filter(entity => {
        const entityInstrument = getInstrument(entity);
        return filters.instruments!.includes(entityInstrument);
      });
    }

    // Apply age range filter
    if (filters.ageRange && getAge) {
      result = result.filter(entity => {
        const entityAge = getAge(entity);
        if (!entityAge || isNaN(entityAge)) return false;
        return entityAge >= filters.ageRange![0] && entityAge <= filters.ageRange![1];
      });
    }

    // Apply class range filter
    if (filters.classRange && getClass) {
      result = result.filter(entity => {
        const entityClass = getClass(entity);
        if (!entityClass || isNaN(entityClass)) return false;
        return entityClass >= filters.classRange![0] && entityClass <= filters.classRange![1];
      });
    }

    // Apply sorting
    if (filters.sortOrder && getNameForSorting) {
      result.sort((a, b) => {
        const nameA = getNameForSorting(a);
        const nameB = getNameForSorting(b);
        
        const comparison = nameA.localeCompare(nameB, 'he');
        return filters.sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [safeEntities, searchQuery, filters, searchFields, getInstrument, getAge, getClass, getNameForSorting]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleApplyFilters = (newFilters: FilterDropdownOptions) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({
      instruments: [],
      ageRange: null,
      classRange: null,
      sortOrder: null
    });
  };

  const hasActiveFilters = 
    (filters.instruments && filters.instruments.length > 0) ||
    filters.ageRange !== null ||
    filters.classRange !== null ||
    filters.sortOrder !== null;

  return {
    filteredEntities: filteredAndSortedEntities,
    handleSearch,
    searchQuery,
    filters,
    handleApplyFilters,
    clearFilters,
    hasActiveFilters,
    availableInstruments: availableOptions.instruments,
    ageRange: availableOptions.ageRange,
    classRange: availableOptions.classRange
  };
}