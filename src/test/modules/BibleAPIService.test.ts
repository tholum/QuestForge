/**
 * Bible API Service Comprehensive Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BibleAPIService } from '../../modules/bible/services/BibleAPIService'

// Mock fetch globally for testing
global.fetch = vi.fn()

describe('BibleAPIService', () => {
  let bibleService: BibleAPIService
  const mockFetch = vi.mocked(fetch)

  beforeEach(() => {
    bibleService = new BibleAPIService()
    mockFetch.mockClear()
    bibleService.clearCache()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with multiple API clients', () => {
      expect(bibleService).toBeDefined()
      expect(typeof bibleService.getVerse).toBe('function')
      expect(typeof bibleService.getPassage).toBe('function')
      expect(typeof bibleService.searchVerses).toBe('function')
    })
  })

  describe('Reference Parsing', () => {
    it('should parse simple verse references correctly', () => {
      const result = bibleService.parseReference('John 3:16')
      expect(result).toEqual({
        book: 'John',
        chapter: 3,
        verse: 16,
        endVerse: undefined
      })
    })

    it('should parse verse ranges correctly', () => {
      const result = bibleService.parseReference('Genesis 1:1-3')
      expect(result).toEqual({
        book: 'Genesis',
        chapter: 1,
        verse: 1,
        endVerse: 3
      })
    })

    it('should parse chapter-only references', () => {
      const result = bibleService.parseReference('Romans 8')
      expect(result).toEqual({
        book: 'Romans',
        chapter: 8,
        verse: undefined,
        endVerse: undefined
      })
    })

    it('should handle books with numbers', () => {
      const result = bibleService.parseReference('1 Corinthians 13:4')
      expect(result).toEqual({
        book: '1 Corinthians',
        chapter: 13,
        verse: 4,
        endVerse: undefined
      })
    })

    it('should return null for invalid references', () => {
      expect(bibleService.parseReference('')).toBeNull()
      expect(bibleService.parseReference('invalid')).toBeNull()
      expect(bibleService.parseReference('123')).toBeNull()
      expect(bibleService.parseReference('Book')).toBeNull()
    })
  })

  describe('Reference Formatting', () => {
    it('should format verse references correctly', () => {
      expect(bibleService.formatReference('John', 3, 16)).toBe('John 3:16')
    })

    it('should format verse ranges correctly', () => {
      expect(bibleService.formatReference('Genesis', 1, 1, 3)).toBe('Genesis 1:1-3')
    })

    it('should format chapter-only references correctly', () => {
      expect(bibleService.formatReference('Romans', 8)).toBe('Romans 8')
    })

    it('should handle same start and end verses', () => {
      expect(bibleService.formatReference('John', 3, 16, 16)).toBe('John 3:16')
    })
  })

  describe('Cache Management', () => {
    it('should start with empty cache', () => {
      const stats = bibleService.getCacheStats()
      expect(stats.size).toBe(0)
      expect(stats.keys).toEqual([])
    })

    it('should clear cache properly', () => {
      // Simulate some cached data
      bibleService.clearCache()
      const stats = bibleService.getCacheStats()
      expect(stats.size).toBe(0)
    })

    it('should provide cache statistics', () => {
      const stats = bibleService.getCacheStats()
      expect(stats).toHaveProperty('size')
      expect(stats).toHaveProperty('keys')
      expect(typeof stats.size).toBe('number')
      expect(Array.isArray(stats.keys)).toBe(true)
    })
  })

  describe('Multiple Verse Retrieval', () => {
    it('should handle multiple verse requests', async () => {
      // Mock successful API responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ passages: ['For God so loved the world...'] })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ passages: ['And we know that in all things...'] })
        } as Response)

      const references = ['John 3:16', 'Romans 8:28']
      const verses = await bibleService.getMultipleVerses(references, 'ESV')

      expect(verses).toHaveLength(2)
      expect(verses[0]).toHaveProperty('reference', 'John 3:16')
      expect(verses[1]).toHaveProperty('reference', 'Romans 8:28')
    })
  })

  describe('Fallback Pattern', () => {
    it('should attempt multiple API clients on failure', async () => {
      // Mock first API to fail, second to succeed
      mockFetch
        .mockRejectedValueOnce(new Error('First API failed'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              content: 'For God so loved the world...'
            }
          })
        } as Response)

      const verse = await bibleService.getVerse('John 3:16')
      expect(verse.reference).toBe('John 3:16')
      expect(verse.text).toContain('For God so loved the world')
    })

    it('should handle all APIs failing', async () => {
      // Mock all APIs to fail
      mockFetch.mockRejectedValue(new Error('All APIs failed'))

      await expect(bibleService.getVerse('John 3:16')).rejects.toThrow(
        'All Bible API clients failed'
      )
    })
  })

  describe('Rate Limiting and Error Handling', () => {
    it('should handle 404 responses gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response)

      // Should try the next client
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ passages: ['Fallback text'] })
      } as Response)

      const verse = await bibleService.getVerse('InvalidReference')
      expect(verse.text).toBe('Fallback text')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      
      // Should try the next client
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ passages: ['Fallback text'] })
      } as Response)

      const verse = await bibleService.getVerse('John 3:16')
      expect(verse.text).toBe('Fallback text')
    })
  })

  describe('Caching Behavior', () => {
    it('should cache successful responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ passages: ['For God so loved the world...'] })
      } as Response)

      // First call should hit the API
      await bibleService.getVerse('John 3:16', 'ESV')
      expect(mockFetch).toHaveBeenCalledTimes(1)

      // Second call should use cache (no additional API calls)
      await bibleService.getVerse('John 3:16', 'ESV')
      expect(mockFetch).toHaveBeenCalledTimes(1)

      const stats = bibleService.getCacheStats()
      expect(stats.size).toBeGreaterThan(0)
    })

    it('should not cache failed responses', async () => {
      mockFetch.mockRejectedValue(new Error('API failed'))

      try {
        await bibleService.getVerse('John 3:16', 'ESV')
      } catch (error) {
        // Expected to fail
      }

      const stats = bibleService.getCacheStats()
      expect(stats.size).toBe(0)
    })
  })

  describe('Search Functionality', () => {
    it('should handle search queries', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              reference: 'John 3:16',
              content: 'For God so loved the world...'
            }
          ]
        })
      } as Response)

      const results = await bibleService.searchVerses('love', 'ESV')
      expect(results).toHaveLength(1)
      expect(results[0]).toHaveProperty('reference', 'John 3:16')
      expect(results[0]).toHaveProperty('text')
      expect(results[0]).toHaveProperty('version', 'ESV')
    })

    it('should handle empty search results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] })
      } as Response)

      const results = await bibleService.searchVerses('nonexistent', 'ESV')
      expect(results).toHaveLength(0)
    })
  })

  describe('Available Versions', () => {
    it('should retrieve available Bible versions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            id: 'ESV',
            name: 'English Standard Version',
            abbreviation: 'ESV',
            language: 'English',
            copyright: 'Crossway Bibles'
          }
        ])
      } as Response)

      const versions = await bibleService.getAvailableVersions()
      expect(versions).toHaveLength(1)
      expect(versions[0]).toHaveProperty('id', 'ESV')
      expect(versions[0]).toHaveProperty('name')
      expect(versions[0]).toHaveProperty('abbreviation')
    })
  })
})