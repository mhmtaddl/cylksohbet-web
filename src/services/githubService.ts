/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GitHubReleaseData {
  version: string;
  totalDownloads: number;
  downloadUrl: string | null;
}

export async function fetchGitHubReleaseData(owner: string, repo: string) {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
    console.log('GitHub URL:', url);

    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
      },
      cache: 'no-store',
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

    console.log('SELECTED INSTALLER name:', mainInstaller?.name);
    console.log('SELECTED INSTALLER download_count:', mainInstaller?.download_count);
    console.log('SELECTED INSTALLER browser_download_url:', mainInstaller?.browser_download_url);

    return {
      version: latestRelease.tag_name || 'v0.0.0',
      totalDownloads: Number(mainInstaller?.download_count || 0),
      downloadUrl: mainInstaller?.browser_download_url || null,
    };
  } catch (error) {
    console.error('Error fetching GitHub data:', error);
    return { version: 'v0.0.0', totalDownloads: 0, downloadUrl: null };
  }
}
