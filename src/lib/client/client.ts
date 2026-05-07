import Medusa from '@medusajs/js-sdk';

export const backendUrl = __BACKEND_URL__ ?? '/';
export const publishableApiKey = __PUBLISHABLE_API_KEY__ ?? '';

const token = window.localStorage.getItem('medusa_auth_token') || '';

const decodeJwt = (token: string) => {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));

    return decoded;
  } catch (err) {
    return null;
  }
};

const isTokenExpired = (token: string | null) => {
  if (!token) return true;

  const payload = decodeJwt(token);
  if (!payload?.exp) return true;

  return payload.exp * 1000 < Date.now();
};

export const sdk = new Medusa({
  baseUrl: backendUrl,
  publishableKey: publishableApiKey
});

// useful when you want to call the BE from the console and try things out quickly
if (typeof window !== 'undefined') {
  (window as any).__sdk = sdk;
}

export const importProductsQuery = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  return await fetch(`${backendUrl}/vendor/products/import`, {
    method: 'POST',
    body: formData,
    headers: {
      authorization: `Bearer ${token}`,
      'x-publishable-api-key': publishableApiKey
    }
  })
    .then(res => res.json())
    .catch(() => null);
};

export type VendorMediaUploadFile = {
  id: string;
  url: string;
  filename?: string;
  mimeType?: string;
  blurhash?: string;
};

export type VendorMediaUploadResponse = {
  files: VendorMediaUploadFile[];
};

export const uploadFilesQuery = async (
  files: { file: File }[],
  folder?: string
): Promise<VendorMediaUploadResponse> => {
  const formData = new FormData();
  for (const { file } of files) {
    formData.append('files', file);
  }
  const url = `${backendUrl}/vendor/media${folder ? `?folder=${folder}` : ''}`;
  const res = await fetch(url, {
    method: 'POST',
    body: formData,
    headers: {
      authorization: `Bearer ${token}`,
      'x-publishable-api-key': publishableApiKey
    }
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error?.error || 'Failed to upload files');
  }
  return res.json();
};

export type UpdateProductMediaPayload = {
  images?: Array<{ id: string; url: string }>;
  thumbnail?: string | null;
  image_blurhashes?: Record<string, string>;
};

export type UpdateProductMediaResponse = {
  product: unknown;
};

export const updateProductMedia = async (
  productId: string,
  payload: UpdateProductMediaPayload
): Promise<UpdateProductMediaResponse> => {
  const bearer = window.localStorage.getItem('medusa_auth_token') || '';
  const res = await fetch(`${backendUrl}/vendor/products/${productId}/media`, {
    method: 'PATCH',
    headers: {
      authorization: `Bearer ${bearer}`,
      'x-publishable-api-key': publishableApiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error?.error || 'Failed to update product media');
  }
  return res.json();
};

export const deleteFilesQuery = async (fileIds: string[]) => {
  if (!fileIds || fileIds.length === 0) {
    return;
  }

  return await fetch(`${backendUrl}/vendor/media`, {
    method: 'DELETE',
    headers: {
      authorization: `Bearer ${token}`,
      'x-publishable-api-key': publishableApiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ids: fileIds })
  })
    .then(res => res.json())
    .catch(() => null);
};

export const fetchQuery = async (
  url: string,
  {
    method,
    body,
    query,
    headers
  }: {
    method: 'GET' | 'POST' | 'DELETE';
    body?: object;
    query?: Record<string, string | number | object>;
    headers?: { [key: string]: string };
  }
) => {
  const bearer = (await window.localStorage.getItem('medusa_auth_token')) || '';
  const params = Object.entries(query || {}).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        // Send arrays as multiple query parameters with bracket notation
        // This allows backends to parse them as arrays: status[]=draft&status[]=published
        const arrayParams = value
          .map(item => `${encodeURIComponent(key)}[]=${encodeURIComponent(item)}`)
          .join('&');
        if (acc) {
          acc += '&' + arrayParams;
        } else {
          acc = arrayParams;
        }
      } else {
        const separator = acc ? '&' : '';
        const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
        acc += `${separator}${encodeURIComponent(key)}=${encodeURIComponent(serializedValue)}`;
      }
    }
    return acc;
  }, '');
  const response = await fetch(`${backendUrl}${url}${params && `?${params}`}`, {
    method: method,
    headers: {
      authorization: `Bearer ${bearer}`,
      'Content-Type': 'application/json',
      'x-publishable-api-key': publishableApiKey,
      ...headers
    },
    body: body ? JSON.stringify(body) : null
  });

  if (!response.ok) {
    const errorData = await response.json();

    if (response.status === 401) {
      if (isTokenExpired(token)) {
        localStorage.removeItem('medusa_auth_token');
        window.location.href = '/login?reason=Unauthorized';
        return;
      }

      throw {
        type: 'NO_PERMISSION',
        message: errorData.message || 'Unauthorized'
      };
    }

    throw new Error(errorData.message || errorData.error || 'Server error');
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};
