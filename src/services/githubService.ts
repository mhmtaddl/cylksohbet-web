/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GitHubReleaseData {
  version: string;
  totalDownloads: number;
  downloadUrl: string | null;
}

export async function fetchGitHubReleaseData(owner: string, repo: string): Promise<GitHubReleaseData> {
  const url = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
  console.log('[GitHub] Fetching:', url);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
      },
      cache: 'no-store',
    });

    console.log('[GitHub] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const text = await response.text();
      console.error('[GitHub] Error response body:', text);
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const latestRelease = await response.json();
    console.log('[GitHub] Release data:', latestRelease);

    const assets = Array.isArray(latestRelease.assets) ? latestRelease.assets : [];

    const mainInstaller = assets.find((asset: any) => {
      const name = String(asset.name || '').toLowerCase();
      return name.endsWith('.exe') || name.endsWith('.msi');
    });

    console.log('[GitHub] Installer asset:', mainInstaller ?? 'NOT FOUND');

    const result = {
      version: latestRelease.tag_name || 'v0.0.0',
      totalDownloads: Number(mainInstaller?.download_count || 0),
      downloadUrl: mainInstaller?.browser_download_url || latestRelease.html_url || null,
    };

    console.log('[GitHub] Result:', result);
    return result;
  } catch (error) {
    console.error('[GitHub] Failed to fetch release data:', error);
    return { version: 'v0.0.0', totalDownloads: 0, downloadUrl: null };
  }
}
