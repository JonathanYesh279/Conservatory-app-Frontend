// src/hooks/useSearchbar.ts
import { useState, useEffect } from 'react';

type SearchableEntity = {
  [key: string]: any;
};

export function useSearchbar<T extends SearchableEntity>(
  entities: T[],
  searchFields: (keyof T)[] | ((entity: T) => string[])
) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEntities, setFilteredEntities] = useState<T[]>(entities);

  // Update filtered entities when the original entities list changes
  useEffect(() => {
    if (!searchQuery) {
      setFilteredEntities(entities);
    } else {
      performSearch(searchQuery);
    }
  }, [entities, searchQuery]);

  // Function to handle search
  const performSearch = (query: string) => {
    if (!query) {
      setFilteredEntities(entities);
      return;
    }

    const lowercaseQuery = query.toLowerCase();

    const filtered = entities.filter((entity) => {
      // If searchFields is a function, call it to get the fields to search
      const fieldsToSearch =
        typeof searchFields === 'function'
          ? searchFields(entity)
          : searchFields.map((field) => {
              const value = entity[field];
              return value ? String(value) : '';
            });

      // Check if any field contains the search query
      return fieldsToSearch.some((fieldValue) =>
        fieldValue.toLowerCase().includes(lowercaseQuery)
      );
    });

    setFilteredEntities(filtered);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    performSearch(query);
  };

  return {
    filteredEntities,
    handleSearch,
    searchQuery,
  };
}