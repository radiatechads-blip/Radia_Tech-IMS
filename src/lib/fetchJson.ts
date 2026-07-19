function extractErrorMessage(text: string) {
  const clean = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!clean) return 'Request failed';
  if (clean.length > 180) return `${clean.slice(0, 177)}...`;
  return clean;
}

export async function readJsonResponse(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text().catch(() => '');
    return { ok: false, error: extractErrorMessage(text) };
  }

  try {
    return await response.json();
  } catch {
    return { ok: false, error: 'Invalid JSON response' };
  }
}
