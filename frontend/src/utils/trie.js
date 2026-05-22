class TrieNode {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
    this.data = []; // Store array of subjects matching this exact path
  }
}

export class SubjectTrie {
  constructor() {
    this.root = new TrieNode();
  }

  // Insert a subject with a specific lookup string
  insert(lookupString, subjectData) {
    if (!lookupString) return;
    const word = lookupString.toLowerCase();
    let node = this.root;
    for (let char of word) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.isEndOfWord = true;
    node.data.push(subjectData);
  }

  // DFS to aggregate results downward
  collect(node, results, limit) {
    if (results.length >= limit) return;
    if (node.isEndOfWord) {
      results.push(...node.data);
    }
    for (let char in node.children) {
      this.collect(node.children[char], results, limit);
    }
  }

  // Prefix search traversing the tree from root
  searchPrefix(prefix, limit = 8) {
    if (!prefix) return [];
    const word = prefix.toLowerCase();
    let node = this.root;
    
    // Walk the tree string down the prefix path
    for (let char of word) {
      if (!node.children[char]) {
        return []; // Branch dead ends, no matches for this prefix
      }
      node = node.children[char];
    }
    
    const results = [];
    this.collect(node, results, limit * 2); // collect extra due to potential duplicates
    return results;
  }
}
