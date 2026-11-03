import { isYouTube, normalizeRecipeUrl, sourceHost } from '@/features/recipes/recipe-source-links';

describe('recipe source links', () => {
  it('adds a scheme when pasted without one', () => {
    expect(normalizeRecipeUrl(' example.com/recipe ')).toBe('https://example.com/recipe');
  });
  it('refuses unsupported schemes and empty values', () => {
    expect(() => normalizeRecipeUrl('javascript:alert(1)')).toThrow();
    expect(() => normalizeRecipeUrl('file:///etc/passwd')).toThrow();
    expect(() => normalizeRecipeUrl('')).toThrow();
    expect(() => normalizeRecipeUrl('notaurl')).toThrow();
  });
  it('detects hosts', () => {
    expect(sourceHost('https://www.example.com/a')).toBe('example.com');
    expect(isYouTube('https://youtu.be/abc')).toBe(true);
    expect(isYouTube('https://notyoutube.com/abc')).toBe(false);
  });
});
