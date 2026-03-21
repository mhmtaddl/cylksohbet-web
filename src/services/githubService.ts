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
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'Cache-Control': 'no-cache',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const latestRelease = await response.json();

    const assets = Array.isArray(latestRelease.assets) ? latestRelease.assets : [];

    const mainInstaller = assets.find((asset: any) => {
      const name = String(asset.name || '').toLowerCase();
      return name.endsWith('.exe') || name.endsWith('.msi');
    });

    return {
      version: latestRelease.tag_name || 'v0.0.0',
      totalDownloads: Number(mainInstaller?.download_count || 0),
      downloadUrl: mainInstaller?.browser_download_url || latestRelease.html_url || null,
    };
  } catch (error) {
    console.error('Error fetching GitHub data:', error);
    return { version: 'v0.0.0', totalDownloads: 0, downloadUrl: null };
  }
}
