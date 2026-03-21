import { supabase } from '../lib/supabase';

export async function fetchDownloadCount(): Promise<number> {
  const { data, error } = await supabase
    .from('download_stats')
    .select('count')
    .eq('id', 1)
    .single();

  if (error) {
    console.error('fetchDownloadCount error:', error);
    return 0;
  }

  return data?.count ?? 0;
}

export async function incrementDownloadCount(): Promise<void> {
  const { error } = await supabase.rpc('increment_download_count');
  if (error) {
    console.error('incrementDownloadCount error:', error);
  }
}
