export default class FileHelper {
  static extractBase64 = (value: string): string => {
    if (!value) return '';
    if (!value.includes(',')) return value;
    return value.split(',')[1] ?? '';
  };

  static base64ToBlob = (base64: string, mimeType: string | null = null): Blob => {
    if (!base64) return new Blob([], { type: mimeType || 'application/octet-stream' });
    const byteCharacters = atob(base64);
    const byteArray = new Uint8Array(byteCharacters.length);
    for (let index = 0; index < byteCharacters.length; index++) {
      byteArray[index] = byteCharacters.charCodeAt(index);
    }
    return new Blob([byteArray], { type: mimeType || 'application/octet-stream' });
  };

  static base64ToURL = (base64: string, mimeType: string | null = null): string => {
    if (!base64) return '';
    try {
      const blob = this.base64ToBlob(base64, mimeType);
      return URL.createObjectURL(blob);
    } catch {
      return '';
    }
  };

  static getPhotoUrl = (photo: string | null | undefined): string | null => {
    if (!photo) return null;
    const trimmed = photo.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('blob:') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }

    // Short path starting with / is likely a local asset
    if (trimmed.startsWith('/') && trimmed.length < 512) {
      return trimmed;
    }

    const parsed = this.parseBase64Payload(trimmed);
    const base64 = parsed ? parsed.base64 : trimmed.replace(/\s/g, '');
    const mimeType = parsed ? (parsed.mimeType || 'image/png') : 'image/png';

    const url = this.base64ToURL(base64, mimeType);
    return url || null;
  };

  static parseBase64Payload = (
    value: string | null | undefined
  ): { base64: string; mimeType: string | null } | null => {
    if (!value) return null;
    const raw = value.trim();
    if (!raw) return null;

    if (raw.startsWith('data:')) {
      const marker = ';base64,';
      const markerIndex = raw.indexOf(marker);
      if (markerIndex > 5) {
        const mimeType = raw.substring(5, markerIndex);
        const base64 = raw.substring(markerIndex + marker.length);
        return { mimeType: mimeType || null, base64 };
      }
    }

    const splitMarker = 'base64,';
    const markerIndex = raw.indexOf(splitMarker);
    if (markerIndex >= 0) {
      const base64 = raw.slice(markerIndex + splitMarker.length);
      return base64 ? { mimeType: null, base64 } : null;
    }

    const normalized = raw.replace(/\s/g, '');
    if (!normalized || normalized.length % 4 !== 0) return null;

    // Stack-safe character check using a non-anchored regex for invalid characters
    if (/[^A-Za-z0-9+/=]/.test(normalized)) return null;

    // Padding check: '=' can only be at the end
    const firstEq = normalized.indexOf('=');
    if (firstEq !== -1) {
      if (firstEq < normalized.length - 2) return null;
      if (firstEq === normalized.length - 2 && normalized[normalized.length - 1] !== '=') return null;
    }

    return { mimeType: null, base64: normalized };
  };

  static downloadBlob = (blob: Blob, fileName: string): void => {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  };

  static downloadBase64 = (
    base64: string,
    fileName: string,
    mimeType: string | null = null
  ): void => {
    const blob = this.base64ToBlob(base64, mimeType);
    this.downloadBlob(blob, fileName);
  };

  static getFileNameFromPath = (path: string | null | undefined): string => {
    if (!path) return '';
    const normalized = path.replace(/\\/g, '/');
    const parts = normalized.split('/');
    return parts[parts.length - 1] || '';
  };

  static getFileExtensionFromMimeType = (mimeType: string | null): string => {
    if (!mimeType) return '.bin';

    const extensionMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'text/plain': '.txt',
    };
    return extensionMap[mimeType.toLowerCase()] ?? '.bin';
  };

  static getMimeTypeFromFileName = (fileName: string | null | undefined): string | null => {
    const lower = fileName?.trim().toLowerCase() || '';
    if (lower.endsWith('.pdf')) return 'application/pdf';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.doc')) return 'application/msword';
    if (lower.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    return null;
  };

  static getMimeTypeFromBase64Signature = (base64: string | null | undefined): string | null => {
    const raw = base64?.trim() || '';
    if (!raw) return null;
    if (raw.startsWith('/9j/')) return 'image/jpeg';
    if (raw.startsWith('iVBORw0KGgo')) return 'image/png';
    if (raw.startsWith('JVBERi0')) return 'application/pdf';
    return null;
  };

  static resolveContentType = (
    contentType: string | null | undefined,
    fileName: string | null | undefined,
    base64: string | null | undefined,
    fallback: string = 'application/pdf'
  ): string => {
    // 1. Explicit contentType
    const normalized = contentType?.trim().toLowerCase() || '';
    if (normalized) return normalized;

    // 2. Parse data-URI for embedded MIME
    const parsed = FileHelper.parseBase64Payload(base64);
    if (parsed?.mimeType) return parsed.mimeType;

    // 3. File name extension
    const fromName = FileHelper.getMimeTypeFromFileName(fileName);
    if (fromName) return fromName;

    // 4. Base64 magic bytes (use the stripped base64 if we parsed a data URI)
    const rawBase64 = parsed?.base64 || base64;
    const fromSignature = FileHelper.getMimeTypeFromBase64Signature(rawBase64);
    if (fromSignature) return fromSignature;

    return fallback;
  };

  static normalizeBase64 = (value: string | null | undefined): string => {
    if (!value) return '';
    const parsed = FileHelper.parseBase64Payload(value);
    return parsed?.base64 || value.trim();
  };
}
