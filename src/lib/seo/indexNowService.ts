/**
 * KDP Studio — IndexNow Instant Search Engine Notification Service
 * 
 * Automatically pings Microsoft Bing, Yandex, Yahoo, and IndexNow participating engines
 * whenever a new blog post or landing page is published or updated.
 * 
 * Protocol specifications: https://www.indexnow.org
 */

export interface IndexNowResponse {
  success: boolean;
  statusCode: number;
  engine: string;
  submittedUrls: string[];
  message: string;
}

export async function pingIndexNow(urls: string[]): Promise<IndexNowResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kdpstudio-aio.web.app';
  const host = new URL(baseUrl).hostname;
  
  // Default fallback key or environment key
  const apiKey = process.env.INDEXNOW_API_KEY || 'kdpstudio-indexnow-key-2026';
  const keyLocation = `${baseUrl}/${apiKey}.txt`;

  const fullUrls = urls.map((u) => (u.startsWith('http') ? u : `${baseUrl}${u.startsWith('/') ? u : `/${u}`}`));

  const payload = {
    host,
    key: apiKey,
    keyLocation,
    urlList: fullUrls,
  };

  try {
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok || response.status === 200 || response.status === 202) {
      return {
        success: true,
        statusCode: response.status,
        engine: 'api.indexnow.org',
        submittedUrls: fullUrls,
        message: `Successfully notified IndexNow of ${fullUrls.length} URL(s).`,
      };
    }

    return {
      success: false,
      statusCode: response.status,
      engine: 'api.indexnow.org',
      submittedUrls: fullUrls,
      message: `IndexNow returned status code ${response.status}: ${response.statusText}`,
    };
  } catch (error: any) {
    console.warn('[IndexNow] Ping failed gracefully:', error.message);
    return {
      success: false,
      statusCode: 500,
      engine: 'api.indexnow.org',
      submittedUrls: fullUrls,
      message: error.message || 'Unknown network error',
    };
  }
}
