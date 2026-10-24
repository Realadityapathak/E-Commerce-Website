import React from 'react';
import Link from 'next/link';

import { urlFor } from '../lib/client';

const FooterBanner = ({ footerBanner }) => {
  // Guard first, destructure second: with no banner published in the CMS
  // the previous version crashed the homepage during destructuring.
  if (!footerBanner) return null;

  const { discount, largeText1, largeText2, saleTime, smallText, midText, desc, product, buttonText, image } = footerBanner;
  const imageUrl = urlFor(image);

  return (
    <div className="footer-banner-container">
      <div className="banner-desc">
        <div className="left">
          <p>{discount}</p>
          <h3>{largeText1}</h3>
          <h3>{largeText2}</h3>
          <p>{saleTime}</p>
        </div>
        <div className="right">
          <p>{smallText}</p>
          <h3>{midText}</h3>
          <p>{desc}</p>
          <Link href={`/product/${product}`}>
            <button type="button">{buttonText}</button>
          </Link>
        </div>

        {imageUrl && (
          <img
            src={imageUrl}
            alt={midText || 'Promotional product'}
            className="footer-banner-image"
          />
        )}
      </div>
    </div>
  )
}

export default FooterBanner
