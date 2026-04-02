/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GitHubReleaseData {
  version: string;
  totalDownloads: number;
  downloadUrl: string | null;
  androidDownloadUrl: string | null;
  publishedAt: string | null;
}

const CACHE_KEY = 'github_release_cache';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 dakika

function getCachedRelease(): GitHubReleaseData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function setCachedRelease(data: GitHubReleaseData) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // localStorage erişilemiyorsa sessizce geç
  }
}

export async function fetchGitHubReleaseData(owner: string, repo: string) {
  const cached = getCachedRelease();
  if (cached) return cached;

  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
    console.log('GitHub URL:', url);

    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
      },
    });

    console.log('GitHub status:', response.status, response.statusText);

    const rawText = await response.text();

    if (!response.ok) {
      console.error('GitHub error response:', rawText);
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const latestRelease = JSON.parse(rawText);
    const assets = Array.isArray(latestRelease.assets) ? latestRelease.assets : [];

    console.log('ALL ASSETS:', assets);

    const mainInstaller = assets.find((asset: any) => {
      const name = String(asset.name || '').toLowerCase();
      return name.endsWith('.exe') && !name.includes('blockmap');
    });

    const androidInstaller = assets.find((asset: any) => {
      const name = String(asset.name || '').toLowerCase();
      return name.endsWith('.apk');
    });

    console.log('SELECTED INSTALLER name:', mainInstaller?.name);
    console.log('SELECTED INSTALLER download_count:', mainInstaller?.download_count);
    console.log('SELECTED INSTALLER browser_download_url:', mainInstaller?.browser_download_url);
    console.log('ANDROID INSTALLER name:', androidInstaller?.name);

    const result = {
      version: latestRelease.tag_name || 'v0.0.0',
      totalDownloads: Number(mainInstaller?.download_count || 0),
      downloadUrl: mainInstaller?.browser_download_url || null,
      androidDownloadUrl: androidInstaller?.browser_download_url || null,
      publishedAt: latestRelease.published_at || null,
    };
    setCachedRelease(result);
    return result;
  } catch (error) {
    console.error('Error fetching GitHub data:', error);
    return { version: 'v0.0.0', totalDownloads: 0, downloadUrl: null, androidDownloadUrl: null, publishedAt: null };
  }
}
