import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://koyomi.phaiworks.com'
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: baseUrl + '/calendar/' + year + '/' + month, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: baseUrl + '/best-days', lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: baseUrl + '/about', lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: baseUrl + '/privacy', lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: baseUrl + '/terms', lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  return staticPages
}
