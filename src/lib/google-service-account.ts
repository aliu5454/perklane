/**
 * Google Service Account utility
 * Handles loading and parsing the service account credentials from environment variables
 */

export interface GoogleServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain: string;
}

/**
 * Get Google Service Account credentials from environment variable
 * @returns Parsed service account object
 * @throws Error if GOOGLE_SERVICE_ACCOUNT_KEY is not set or invalid JSON
 */
export function getGoogleServiceAccount(): GoogleServiceAccount {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountKey) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set. ' +
      'Please add it to your environment variables with the JSON service account key.'
    );
  }

  try {
    const parsed = JSON.parse(serviceAccountKey);
    
    // Ensure private key has proper newlines for OpenSSL
    if (parsed.private_key) {
      // Replace literal \\n with actual newlines if they exist
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }
    
    console.log('✅ Service account loaded successfully:', {
      project_id: parsed.project_id,
      client_email: parsed.client_email,
      hasPrivateKey: !!parsed.private_key
    });
    return parsed;
  } catch (error) {
    console.error('❌ Failed to parse service account JSON:', error);
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_KEY environment variable contains invalid JSON. ' +
      'Please ensure it is properly formatted and escaped.'
    );
  }
}