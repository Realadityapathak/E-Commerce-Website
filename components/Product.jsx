import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { urlFor } from '../lib/client';

const Product = ({ product }) => {
  const { image, name, slug, price } = product || {};

  // A product without a slug can't be linked to; skip it rather than
  // crashing the whole listing on one malformed CMS document.
  if (!slug?.current) return null;

  const imageUrl = urlFor(image && image[0]);

  return (
    <div>
      <Link href={`/product/${slug.current}`}>
        <div className="product-card">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={name || 'Product'}
              width={250}
              height={250}
              className="product-image"
            />
          )}
          <p className="product-name">{name}</p>
          <p className="product-price">₹{price}</p>
        </div>
      </Link>
    </div>
  );
}

export default Product
