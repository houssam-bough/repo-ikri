import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

// Extend window interface for Capacitor
declare global {
  interface Window {
    Capacitor?: any;
  }
}

/**
 * Check if running in Capacitor mobile app
 */
export const isMobileApp = (): boolean => {
  return typeof window !== 'undefined' && 
         (!!window.Capacitor || document.body.classList.contains('mobile-app'));
};

/**
 * Download file with mobile/web compatibility
 * @param url - URL or blob URL of the file
 * @param filename - Name for the downloaded file
 * @param blob - Optional blob data (if you already have the blob)
 */
export const downloadFile = async (
  url: string, 
  filename: string, 
  blob?: Blob
): Promise<void> => {
  if (isMobileApp()) {
    // Mobile: Use Capacitor Filesystem
    try {
      let base64Data: string;
      
      if (blob) {
        // Convert blob to base64
        base64Data = await blobToBase64(blob);
      } else {
        // Fetch the file and convert to base64
        const response = await fetch(url);
        const fetchedBlob = await response.blob();
        base64Data = await blobToBase64(fetchedBlob);
      }
      
      // Remove data URL prefix if present
      const base64 = base64Data.split(',')[1] || base64Data;
      
      // Save to device
      const result = await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Documents,
      });
      
      alert(`Fichier téléchargé: ${result.uri}`);
    } catch (error) {
      console.error('Mobile download error:', error);
      alert('Erreur lors du téléchargement du fichier');
    }
  } else {
    // Web: Use standard download link
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up blob URL if it was created
    if (url.startsWith('blob:')) {
      window.URL.revokeObjectURL(url);
    }
  }
};

/**
 * Convert Blob to base64 string
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Request microphone permission on mobile
 */
export const requestMicrophonePermission = async (): Promise<boolean> => {
  // For both web and mobile, we'll let getUserMedia handle permissions
  // The permission prompt will happen automatically when recording starts
  try {
    // Check if mediaDevices API is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('getUserMedia not supported');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Media devices check failed:', error);
    return false;
  }
};

/**
 * Share file on mobile (alternative to download)
 */
export const shareFile = async (
  url: string,
  filename: string,
  title?: string
): Promise<void> => {
  if (isMobileApp()) {
    try {
      await Share.share({
        title: title || 'Partager le fichier',
        url: url,
        dialogTitle: 'Partager',
      });
    } catch (error) {
      console.error('Share error:', error);
      // Fallback to download
      await downloadFile(url, filename);
    }
  } else {
    // Web: just download
    await downloadFile(url, filename);
  }
};
