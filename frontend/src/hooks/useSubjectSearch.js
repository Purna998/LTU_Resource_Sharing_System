import { useState, useEffect } from 'react';
import api from '../api/axios';
import { SubjectTrie } from '../utils/trie';

let globalTrie = null;

export const useSubjectSearch = () => {
  const [trie, setTrie] = useState(globalTrie);

  useEffect(() => {
    if (globalTrie) return;
    
    // In a production scaling environment, pagination limits would be raised or indexed via search endpoints.
    // For this context, caching all 50-100 subjects in a local Trie enables sub-millisecond instantaneous UX.
    api.get('/subjects/?limit=1000') 
      .then(res => {
        const subjects = res.data.results || res.data;
        const newTrie = new SubjectTrie();
        
        subjects.forEach(sub => {
          // 1. Insert full exact name
          newTrie.insert(sub.name, sub);
          
          // 2. Insert subject code
          if (sub.code) {
             newTrie.insert(sub.code, sub);
          }
          
          // 3. Insert individual words for partial middle-matches e.g. "Logic" finds "Digital Logic"
          const words = sub.name.split(' ');
          if (words.length > 1) {
            words.forEach(word => {
              if (word.length >= 3) {
                newTrie.insert(word, sub);
              }
            });
          }
        });
        
        globalTrie = newTrie;
        setTrie(newTrie);
      })
      .catch(console.error);
  }, []);

  const search = (query) => {
    if (!trie || !query) return [];
    
    // Query the optimized Trie engine
    const rawResults = trie.searchPrefix(query);
    
    // Deduplicate by ID because a subject could be matched by name AND code AND partial word
    const unique = [];
    const seen = new Set();
    
    for (let item of rawResults) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        unique.push(item);
      }
      if (unique.length >= 6) break; // Maximum 6 autocomplete suggestions
    }
    
    return unique;
  };

  return { search, isReady: !!trie };
};
