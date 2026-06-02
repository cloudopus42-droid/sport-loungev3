import React from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title = 'Luxury Hookah Lounge – Premium Orders & Nightlife',
  description = 'Experience the ultimate premium hookah service with a sleek dark‑wood & gold UI. Order your custom mix, track status, and enjoy a 24/7 online experience.',
  image = 'https://sport-loungev3.vercel.app/assets/premium_hookah.png',
  url = 'https://sport-loungev3.vercel.app/',
}) => (
  <HelmetProvider>
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  </HelmetProvider>
);

export default SEO;
