// src/cmps/Searchbar.tsx
import { Search, X } from 'lucide-react';
import { useState } from 'react';

interface SearchbarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export function Searchbar({
  onSearch,
  placeholder = 'חיפוש...',
  className = '',
}: SearchbarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch(value);
  };

  const clearSearch = () => {
    setSearchQuery('');
    onSearch('');
  };

  return (
    <div className={`search-bar-container ${className}`}>
      <div className='search-bar'>
        <Search className='search-icon' size={18} />
        <input
          type='text'
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder={placeholder}
          className='search-input'
        />
        {searchQuery && (
          <button className='clear-button' onClick={clearSearch}>
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}