import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedName } from '../utils/localization';

export default function SearchableSelect({
  label,
  value,
  options = [],
  onChange,
  placeholder = 'Select...',
  disabled = false,
  type = 'location' // 'location', 'crop', 'season', 'state'
}) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    } else {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!query) return options;
    const lowerQuery = query.toLowerCase();
    return options.filter((opt) => {
      // opt is now an object: { id: "...", names: { en, te, ta, hi } }
      if (!opt || !opt.names) return false;
      const names = [opt.names.en, opt.names.te, opt.names.ta, opt.names.hi].filter(Boolean);
      return names.some(name => name.toLowerCase().includes(lowerQuery));
    });
  }, [options, query]);

  const handleSelect = (option) => {
    onChange(option.id || option);
    setIsOpen(false);
  };

  const getDisplayValue = (val) => {
    if (!val) return placeholder;
    const selectedOpt = options.find((o) => (o.id === val || o === val));
    return selectedOpt ? getLocalizedName(selectedOpt, language) : placeholder;
  };

  const displayValue = getDisplayValue(value);

  return (
    <div className={`relative ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`} ref={wrapperRef}>
      {label && <label className="form-label block mb-1">{label} *</label>}
      <div
        className="form-select flex items-center justify-between cursor-pointer pr-10 relative bg-white border border-gray-300 rounded-lg p-2"
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={`block truncate ${!value ? 'text-gray-400' : 'text-gray-900'}`}>
          {displayValue}
        </span>
        <ChevronDown className={`absolute right-3 top-3 w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-100 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              className="w-full text-sm outline-none bg-transparent placeholder-gray-400 text-gray-900"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">No results found.</div>
            ) : (
              filteredOptions.map((opt, i) => (
                <button
                  key={(opt.id || opt) + i}
                  type="button"
                  className={`w-full text-left px-3 py-2.5 text-sm hover:bg-agri-50 focus:bg-agri-50 focus:outline-none transition-colors flex items-center justify-between
                    ${value === opt.id || value === opt ? 'bg-agri-50 text-agri-700 font-medium' : 'text-gray-700'}`}
                  onClick={() => handleSelect(opt)}
                >
                  {getLocalizedName(opt, language)}
                  {(value === opt.id || value === opt) && <Check className="w-4 h-4 text-agri-600" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
