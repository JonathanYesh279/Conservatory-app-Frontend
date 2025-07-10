// src/hooks/useSearchbar.tsx
import { useState, useEffect } from 'react';

type SearchableEntity = {
  [key: string]: any;
};

export function useSearchbar<T extends SearchableEntity>(
  entities: T[],
  searchFields: (keyof T)[] | ((entity: T) => string[])
) {
  const [searchQuery, setSearchQuery] = useState('');

  // Add defensive check to ensure entities is always an array
  const safeEntities = Array.isArray(entities) ? entities : [];

  // Initialize with safe entities
  const [filteredEntities, setFilteredEntities] = useState<T[]>(safeEntities);

  // Update filtered entities when the original entities list changes
  useEffect(() => {
    console.log('useSearchbar entities update:', {
      isArray: Array.isArray(entities),
      length: Array.isArray(entities) ? entities.length : 'n/a',
      type: typeof entities,
    });

    // Always use the safe version
    if (!searchQuery) {
      setFilteredEntities(safeEntities);
    } else {
      performSearch(searchQuery);
    }
  }, [entities, searchQuery]);

  // Function to handle search
  const performSearch = (query: string) => {
    if (!query) {
      setFilteredEntities(safeEntities);
      return;
    }

    const lowercaseQuery = query.toLowerCase();

    // Always use the safe version of entities
    const filtered = safeEntities.filter((entity) => {
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

        // Check if any field contains the search query
        return fieldsToSearch.some((fieldValue) => {
          // Safety check for fieldValue
          if (typeof fieldValue !== 'string') {
            console.error(
              'Expected field value to be a string but got:',
              typeof fieldValue
            );
            return false;
          }
          return fieldValue.toLowerCase().includes(lowercaseQuery);
        });
      } catch (err) {
        console.error('Error filtering entity:', err);
        return false;
      }
    });

    setFilteredEntities(filtered);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    performSearch(query);
  };

  return {
    // Always return a safe array
    filteredEntities: Array.isArray(filteredEntities) ? filteredEntities : [],
    handleSearch,
    searchQuery,
  };
}
