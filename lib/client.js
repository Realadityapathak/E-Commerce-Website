import sanityClient from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

const config = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: 'production',
  apiVersion: '2022-03-10',
};

/**
 * Browser-safe client. No token: anything prefixed NEXT_PUBLIC_ is inlined
 * into the JS bundle sent to every visitor, so a token here is public.
 * This client assumes the dataset is publicly readable (the Sanity default
 * used by this project). See .env.example if your dataset is private.
 */
export const client = sanityClient({
  ...config,
  useCdn: true,
});

/**
 * Server-only client (API routes / getStaticProps / getServerSideProps).
 * `SANITY_API_TOKEN` has no NEXT_PUBLIC_ prefix, so it is never bundled
 * for the browser. Only set it if your dataset requires authenticated reads.
 */
export const serverClient = sanityClient({
  ...config,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

/**
 * Server-only WRITE client (Stripe webhook order persistence).
 * Requires a token with write access: SANITY_API_WRITE_TOKEN, falling back
 * to SANITY_API_TOKEN for single-token setups. Never used in the browser.
 */
export const writeClient = sanityClient({
  ...config,
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_TOKEN,
});

const builder = imageUrlBuilder(client);

/** Returns an image-url builder, or null for missing sources (never throws). */
export const urlFor = (source) => {
  if (!source) return null;
  try {
    return builder.image(source);
  } catch {
    return null;
  }
};
