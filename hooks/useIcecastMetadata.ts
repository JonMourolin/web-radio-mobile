import { useState, useEffect } from 'react';
import { IcecastMetadata, getCurrentMetadata } from '../services/metadataService';

export function useIcecastMetadata(isPlaying: boolean) {
  const [metadata, setMetadata] = useState<IcecastMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchMetadata = async () => {
      try {
        const currentMetadata = await getCurrentMetadata();
        if (currentMetadata) {
          setMetadata(currentMetadata);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch metadata');
      }
    };

    // Fetch initial metadata
    fetchMetadata();

    // Only set up polling if the radio is playing
    if (isPlaying) {
      // Poll every 5 seconds
      intervalId = setInterval(fetchMetadata, 5000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPlaying]);

  return { metadata, error };
} 