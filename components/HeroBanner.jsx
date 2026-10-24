import React from 'react';
import Link from 'next/link';

import { urlFor } from '../lib/client';

const HeroBanner = ({ heroBanner }) => {
  // No banner published in the CMS yet -> render nothing instead of
  // crashing the homepage by dereferencing missing data.
  if (!heroBanner) return null;

  const imageUrl = urlFor(heroBanner.image);

  return (
    <div className="hero-banner-container">
      <div>
        <p className="beats-solo">{heroBanner.smallText}</p>
        <h3>{heroBanner.midText}</h3>
        <h1>{heroBanner.largeText1}</h1>
        {imageUrl && (
          <img src={imageUrl} alt={heroBanner.smallText || 'Featured product'} className="hero-banner-image" />
        )}

        <div>
          <Link href={`/product/${heroBanner.product}`}>
            <button type="button">{heroBanner.buttonText}</button>
          </Link>
          <div className="desc">
            <h5>Description</h5>
            <p>{heroBanner.desc}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HeroBanner
