/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GitHubReleaseData {
  version: string;
  totalDownloads: number;
  downloadUrl: string | null;
}

/**
 * Fetches release data from GitHub API.
 * @param owner The owner of the repository.
 * @param repo The name of the repository.
 * @returns A promise that resolves to the release data.
 */
export async function fetchGitHubReleaseData(owner: string, repo: string): Promise<GitHubReleaseData> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases`,
      {
        headers: {
          'Accept': 'application/vnd.github+json',
          'Cache-Control': 'no-cache',
        },
      }
    );
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const releases = await response.json();
    if (!Array.isArray(releases) || releases.length === 0) {
      return { version: 'v0.0.0', totalDownloads: 0, downloadUrl: null };
    }

    // Calculate total downloads across all releases
    let totalDownloads = 0;
    releases.forEach((release: any) => {
      release.assets?.forEach((asset: any) => {
        totalDownloads += Number(asset.download_count || 0);
      });
    });

    // Get latest release info
    const latestRelease = releases[0];
    const version = latestRelease.tag_name || 'v0.0.0';

    // Find the Windows download URL (usually .exe or .msi)
    const windowsAsset = latestRelease.assets?.find((asset: any) =>
      asset.name?.toLowerCase().endsWith('.exe') ||
      asset.name?.toLowerCase().endsWith('.msi')
    );

    return {
      version,
      totalDownloads,
      downloadUrl: windowsAsset ? windowsAsset.browser_download_url : latestRelease.html_url
    };
  } catch (error) {
    console.error('Error fetching GitHub data:', error);
    return { version: 'v0.0.0', totalDownloads: 0, downloadUrl: null };
  }
}
