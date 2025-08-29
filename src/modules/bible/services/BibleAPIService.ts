/**
 * Bible API Service
 * 
 * Service for fetching Bible content from multiple APIs with fallback pattern:
 * Primary: ESV API
 * Secondary: API.Bible  
 * Fallback: Free Use Bible API
 */

interface BibleVerse {
  reference: string
  text: string
  version: string
}

interface BiblePassage {
  reference: string
  passages: BibleVerse[]
  version: string
}

interface BibleVersion {
  id: string
  name: string
  abbreviation: string
  language: string
  copyright?: string
}

interface SearchResult {
  reference: string
  text: string
  version: string
}

/**
 * Base interface for Bible API clients
 */
interface BibleAPIClient {
  getVerse(reference: string, version?: string): Promise<BibleVerse>
  getPassage(reference: string, version?: string): Promise<BiblePassage>
  searchVerses(query: string, version?: string): Promise<SearchResult[]>
  getAvailableVersions(): Promise<BibleVersion[]>
}

/**
 * ESV API Client (Primary)
 * https://api.esv.org/
 */
class ESVAPIClient implements BibleAPIClient {
  private baseURL = 'https://api.esv.org/v3'
  private apiKey: string
  private requestCount = 0
  private dailyLimit = 5000
  private lastResetDate: string

  constructor(apiKey: string) {
    this.apiKey = apiKey || process.env.ESV_API_KEY || ''
    this.lastResetDate = new Date().toDateString()
  }

  private async makeRequest(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    // Check rate limit
    const today = new Date().toDateString()
    if (this.lastResetDate !== today) {
      this.requestCount = 0
      this.lastResetDate = today
    }

    if (this.requestCount >= this.dailyLimit) {
      throw new Error('ESV API daily limit exceeded')
    }

    const url = new URL(`${this.baseURL}${endpoint}`)
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Token ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`ESV API error: ${response.status} ${response.statusText}`)
    }

    this.requestCount++
    return response.json()
  }

  async getVerse(reference: string, version: string = 'ESV'): Promise<BibleVerse> {
    const data = await this.makeRequest('/passage/text/', {
      q: reference,
      'include-headings': 'false',
      'include-footnotes': 'false',
      'include-verse-numbers': 'false',
      'include-short-copyright': 'false'
    })

    return {
      reference,
      text: data.passages[0]?.trim() || '',
      version: 'ESV'
    }
  }

  async getPassage(reference: string, version: string = 'ESV'): Promise<BiblePassage> {
    const verse = await this.getVerse(reference, version)
    
    return {
      reference,
      passages: [verse],
      version: 'ESV'
    }
  }

  async searchVerses(query: string, version: string = 'ESV'): Promise<SearchResult[]> {
    const data = await this.makeRequest('/passage/search/', {
      q: query,
      'page-size': '20'
    })

    return data.results?.map((result: any) => ({
      reference: result.reference,
      text: result.content.trim(),
      version: 'ESV'
    })) || []
  }

  async getAvailableVersions(): Promise<BibleVersion[]> {
    return [{
      id: 'ESV',
      name: 'English Standard Version',
      abbreviation: 'ESV',
      language: 'English',
      copyright: 'Crossway Bibles'
    }]
  }
}

/**
 * API.Bible Client (Secondary)
 * https://scripture.api.bible/
 */
class ApiBibleClient implements BibleAPIClient {
  private baseURL = 'https://api.scripture.api.bible/v1'
  private apiKey: string
  private defaultBibleId = '06125adad2d5898a-01' // World English Bible

  constructor(apiKey: string) {
    this.apiKey = apiKey || process.env.API_BIBLE_KEY || ''
  }

  private async makeRequest(endpoint: string): Promise<any> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        'api-key': this.apiKey,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`API.Bible error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  private parseReference(reference: string): string {
    // Convert "John 3:16" format to API.Bible book.chapter.verse format
    // This is a simplified implementation
    const parts = reference.split(' ')
    if (parts.length < 2) return reference

    const book = parts[0].toLowerCase()
    const chapterVerse = parts[1]
    
    const bookMappings: Record<string, string> = {
      'genesis': 'GEN',
      'exodus': 'EXO',
      'john': 'JHN',
      'matthew': 'MAT',
      'romans': 'ROM'
      // Add more mappings as needed
    }

    const bookId = bookMappings[book] || book.toUpperCase()
    return `${bookId}.${chapterVerse}`
  }

  async getVerse(reference: string, version?: string): Promise<BibleVerse> {
    const verseId = this.parseReference(reference)
    const data = await this.makeRequest(`/bibles/${this.defaultBibleId}/verses/${verseId}`)

    return {
      reference,
      text: data.data?.content?.replace(/<[^>]*>/g, '') || '', // Strip HTML tags
      version: 'WEB'
    }
  }

  async getPassage(reference: string, version?: string): Promise<BiblePassage> {
    const verse = await this.getVerse(reference, version)
    
    return {
      reference,
      passages: [verse],
      version: 'WEB'
    }
  }

  async searchVerses(query: string, version?: string): Promise<SearchResult[]> {
    const data = await this.makeRequest(`/bibles/${this.defaultBibleId}/search?query=${encodeURIComponent(query)}&limit=20`)

    return data.data?.verses?.map((verse: any) => ({
      reference: verse.reference,
      text: verse.text?.replace(/<[^>]*>/g, '') || '',
      version: 'WEB'
    })) || []
  }

  async getAvailableVersions(): Promise<BibleVersion[]> {
    const data = await this.makeRequest('/bibles')
    
    return data.data?.map((bible: any) => ({
      id: bible.id,
      name: bible.name,
      abbreviation: bible.abbreviation,
      language: bible.language.name,
      copyright: bible.copyright
    })) || []
  }
}

/**
 * Free Use Bible API Client (Fallback)
 * https://github.com/wldeh/bible-api
 */
class FreeBibleAPIClient implements BibleAPIClient {
  private baseURL = 'https://bible-api.com'

  async getVerse(reference: string, version?: string): Promise<BibleVerse> {
    const response = await fetch(`${this.baseURL}/${encodeURIComponent(reference)}`)
    
    if (!response.ok) {
      throw new Error(`Free Bible API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    return {
      reference,
      text: data.verses?.map((v: any) => v.text).join(' ') || data.text || '',
      version: 'KJV'
    }
  }

  async getPassage(reference: string, version?: string): Promise<BiblePassage> {
    const verse = await this.getVerse(reference, version)
    
    return {
      reference,
      passages: [verse],
      version: 'KJV'
    }
  }

  async searchVerses(query: string, version?: string): Promise<SearchResult[]> {
    // Free Bible API doesn't support search, return empty array
    return []
  }

  async getAvailableVersions(): Promise<BibleVersion[]> {
    return [{
      id: 'KJV',
      name: 'King James Version',
      abbreviation: 'KJV',
      language: 'English'
    }]
  }
}

/**
 * Main Bible API Service with fallback pattern
 */
export class BibleAPIService implements BibleAPIClient {
  private clients: BibleAPIClient[]
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private cacheTimeout = 24 * 60 * 60 * 1000 // 24 hours

  constructor() {
    this.clients = [
      new ESVAPIClient(process.env.ESV_API_KEY || ''),
      new ApiBibleClient(process.env.API_BIBLE_KEY || ''),
      new FreeBibleAPIClient()
    ]
  }

  private getCacheKey(method: string, ...args: string[]): string {
    return `${method}:${args.join(':')}`
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }
    return null
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  private async executeWithFallback<T>(
    operation: (client: BibleAPIClient) => Promise<T>,
    cacheKey?: string
  ): Promise<T> {
    // Check cache first
    if (cacheKey) {
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached
    }

    let lastError: Error | null = null

    for (const client of this.clients) {
      try {
        const result = await operation(client)
        
        // Cache successful result
        if (cacheKey) {
          this.setCache(cacheKey, result)
        }
        
        return result
      } catch (error) {
        console.warn(`Bible API client failed:`, error)
        lastError = error as Error
        continue
      }
    }

    throw new Error(`All Bible API clients failed. Last error: ${lastError?.message}`)
  }

  async getVerse(reference: string, version?: string): Promise<BibleVerse> {
    const cacheKey = this.getCacheKey('getVerse', reference, version || 'default')
    return this.executeWithFallback(
      (client) => client.getVerse(reference, version),
      cacheKey
    )
  }

  async getPassage(reference: string, version?: string): Promise<BiblePassage> {
    const cacheKey = this.getCacheKey('getPassage', reference, version || 'default')
    return this.executeWithFallback(
      (client) => client.getPassage(reference, version),
      cacheKey
    )
  }

  async searchVerses(query: string, version?: string): Promise<SearchResult[]> {
    const cacheKey = this.getCacheKey('searchVerses', query, version || 'default')
    return this.executeWithFallback(
      (client) => client.searchVerses(query, version),
      cacheKey
    )
  }

  async getAvailableVersions(): Promise<BibleVersion[]> {
    const cacheKey = this.getCacheKey('getAvailableVersions')
    return this.executeWithFallback(
      (client) => client.getAvailableVersions(),
      cacheKey
    )
  }

  /**
   * Parse and validate scripture reference
   */
  parseReference(reference: string): { book: string; chapter: number; verse?: number; endVerse?: number } | null {
    // Match patterns like "John 3:16", "Genesis 1:1-3", "Matthew 5"
    const match = reference.match(/^(\d?\s*\w+)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/i)
    
    if (!match) return null

    const [, book, chapterStr, verseStr, endVerseStr] = match
    
    return {
      book: book.trim(),
      chapter: parseInt(chapterStr, 10),
      verse: verseStr ? parseInt(verseStr, 10) : undefined,
      endVerse: endVerseStr ? parseInt(endVerseStr, 10) : undefined
    }
  }

  /**
   * Format reference for display
   */
  formatReference(book: string, chapter: number, verse?: number, endVerse?: number): string {
    let reference = `${book} ${chapter}`
    
    if (verse) {
      reference += `:${verse}`
      if (endVerse && endVerse !== verse) {
        reference += `-${endVerse}`
      }
    }
    
    return reference
  }

  /**
   * Get multiple verses in a single request
   */
  async getMultipleVerses(references: string[], version?: string): Promise<BibleVerse[]> {
    const promises = references.map(ref => this.getVerse(ref, version))
    return Promise.all(promises)
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// Export singleton instance
export const bibleAPIService = new BibleAPIService()

// Export types
export type {
  BibleVerse,
  BiblePassage,
  BibleVersion,
  SearchResult,
  BibleAPIClient
}