import { backendUrl } from '../lib/client';

const devBackendOrigin = import.meta.env.VITE_DEV_BACKEND_ORIGIN || 'http://localhost:9000';
const devBackendOriginHttps = devBackendOrigin.replace(/^http:\/\//i, 'https://');

export default function imagesConverter(images: string) {
  const isDevOrigin =
    images.startsWith(devBackendOrigin) || images.startsWith(devBackendOriginHttps);

  if (isDevOrigin) {
    return images.replace(devBackendOrigin, backendUrl).replace(devBackendOriginHttps, backendUrl);
  }

  return images;
}
