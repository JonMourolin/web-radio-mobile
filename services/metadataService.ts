import { Platform } from 'react-native';

export interface IcecastMetadata {
  title?: string;
  artist?: string;
  genre?: string;
  bitrate?: string;
}

const SERVER_IP = '51.75.200.205';
const SERVER_PORT = '8000';
const METADATA_URL = `http://${SERVER_IP}:${SERVER_PORT}/status-json.xsl`;

// Cache pour éviter trop de requêtes
let metadataCache: IcecastMetadata | null = null;
let lastFetch = 0;
const CACHE_DURATION = 5000; // 5 secondes

export async function getCurrentMetadata(): Promise<IcecastMetadata | null> {
  try {
    const now = Date.now();
    
    // Utiliser le cache si disponible et pas expiré
    if (metadataCache && (now - lastFetch) < CACHE_DURATION) {
      return metadataCache;
    }

    const response = await fetch(METADATA_URL);
    const data = await response.json();
    
    if (!data.icestats || !data.icestats.source) {
      return null;
    }

    const source = data.icestats.source;
    
    // Extraire le titre et l'artiste du champ title
    const [artist, title] = source.title ? source.title.split(' - ') : ['', source.title];
    
    const metadata: IcecastMetadata = {
      title: title || source.title, // Si pas de séparateur, utiliser le titre complet
      artist: artist || 'Unknown Artist',
      genre: source.genre,
      bitrate: source.bitrate ? `${source.bitrate} kbps` : undefined
    };

    // Mettre à jour le cache
    metadataCache = metadata;
    lastFetch = now;

    return metadata;
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return null;
  }
} 