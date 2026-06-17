/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, type PromptWithAuthor } from '../../lib/api';
import './SearchAutocomplete.css';

interface SearchAutocompleteProps {
  placeholder?: string;
  initialValue?: string;
  className?: string;
}

// Simple debounce hook for React
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export function SearchAutocomplete({ 
  placeholder = "Search prompts or creators...", 
  initialValue = "",
  className = ""
}: SearchAutocompleteProps) {
  const [query, setQuery] = useState(initialValue);
  const debouncedQuery = useDebounce(query, 300);
  
  const [results, setResults] = useState<PromptWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync initialValue changes (e.g. from URL params)
  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch results when debounced query changes
  useEffect(() => {
    async function fetchResults() {
      if (!debouncedQuery.trim()) {
        setResults([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const data = await api.searchPrompts(debouncedQuery);
        setResults(data.slice(0, 5)); // Only show top 5 in dropdown
      } catch (err) {
        console.error("Error fetching autocomplete results:", err);
      } finally {
        setIsLoading(false);
      }
    }

    if (isOpen) {
      fetchResults();
    }
  }, [debouncedQuery, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      navigate(`/explore?q=${encodeURIComponent(query)}`);
    } else {
      setIsOpen(false);
      navigate('/explore');
    }
  };

  const handleResultClick = (id: string) => {
    setIsOpen(false);
    navigate(`/details/${id}`);
  };

  const handleFocus = () => {
    setIsOpen(true);
    if (query.trim() && results.length === 0) {
      // Trigger a re-fetch if we have a query but no results and we just focused
      setIsLoading(true);
      api.searchPrompts(query).then(data => {
        setResults(data.slice(0, 5));
        setIsLoading(false);
      });
    }
  };

  return (
    <div className={`autocomplete-wrapper ${className}`} ref={wrapperRef}>
      <form className="autocomplete-form" onSubmit={handleSubmit}>
        <Search className="autocomplete-icon" size={16} />
        <input 
          type="text" 
          placeholder={placeholder}
          className="autocomplete-input"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={handleFocus}
        />
        {isLoading && <Loader2 className="autocomplete-loader" size={14} />}
      </form>

      {isOpen && query.trim() !== '' && (
        <div className="autocomplete-dropdown">
          {isLoading && results.length === 0 ? (
            <div className="autocomplete-message">Searching...</div>
          ) : results.length > 0 ? (
            <div className="autocomplete-results">
              {results.map((prompt) => (
                <div 
                  key={prompt.id} 
                  className="autocomplete-item"
                  onClick={() => handleResultClick(prompt.slug || prompt.id)}
                >
                  <div className="autocomplete-item-img">
                    {prompt.image_url ? (
                      <img src={prompt.image_url} alt={prompt.title} />
                    ) : (
                      <ImageIcon size={16} />
                    )}
                  </div>
                  <div className="autocomplete-item-content">
                    <div className="autocomplete-item-title">{prompt.title}</div>
                    <div className="autocomplete-item-author">
                      By {prompt.author?.full_name || 'Unknown'}
                    </div>
                  </div>
                </div>
              ))}
              <div 
                className="autocomplete-see-all"
                onClick={() => {
                  setIsOpen(false);
                  navigate(`/explore?q=${encodeURIComponent(query)}`);
                }}
              >
                See all results for "{query}"
              </div>
            </div>
          ) : (
            <div className="autocomplete-message">No matching prompts found.</div>
          )}
        </div>
      )}
    </div>
  );
}
