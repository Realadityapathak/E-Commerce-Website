import React, { useState } from 'react';
import Image from 'next/image';
import { AiOutlineMinus, AiOutlinePlus, AiFillStar, AiOutlineStar } from 'react-icons/ai';

import { client, urlFor } from '../../lib/client';
import { Product } from '../../components';
import { useStateContext } from '../../context/StateContext';

const ProductDetails = ({ product, products }) => {
  const { image, name, details, price } = product;
  const [index, setIndex] = useState(0);
  const { decQty, incQty, qty, onAdd, setShowCart } = useStateContext();

  const handleBuyNow = () => {
    onAdd(product, qty);
    setShowCart(true);
  }

  const mainImageBuilder = urlFor(image && image[index]);

  return (
    <div>
      <div className="product-detail-container">
        <div>
          <div className="image-container">
            {mainImageBuilder && (
              <Image src={mainImageBuilder.url()} alt={name} width={400} height={400} className="product-detail-image" />
            )}
          </div>
          <div className="small-images-container">
            {image?.map((item, i) => {
              const thumbnailBuilder = urlFor(item);
              if (!thumbnailBuilder) return null;
              return (
                <Image
                  key={item._key || i}
                  src={thumbnailBuilder.url()}
                  alt={`${name} view ${i + 1}`}
                  width={70}
                  height={70}
                  className={i === index ? 'small-image selected-image' : 'small-image'}
                  onMouseEnter={() => setIndex(i)}
                />
              );
            })}
          </div>
        </div>

        <div className="product-detail-desc">
          <h1>{name}</h1>
          <div className="reviews">
            <div>
              <AiFillStar />
              <AiFillStar />
              <AiFillStar />
              <AiFillStar />
              <AiOutlineStar />
            </div>
            <p>
              (20)
            </p>
          </div>
          <h4>Details: </h4>
          <p>{details}</p>
          <p className="price">₹{price}</p>
          <div className="quantity">
            <h3>Quantity:</h3>
            <p className="quantity-desc">
              <button type="button" aria-label="Decrease quantity" className="minus" onClick={decQty}><AiOutlineMinus /></button>
              <span className="num">{qty}</span>
              <button type="button" aria-label="Increase quantity" className="plus" onClick={incQty}><AiOutlinePlus /></button>
            </p>
          </div>
          <div className="buttons">
            <button type="button" className="add-to-cart" onClick={() => onAdd(product, qty)}>Add to Cart</button>
            <button type="button" className="buy-now" onClick={handleBuyNow}>Buy Now</button>
          </div>
        </div>
      </div>

      <div className="maylike-products-wrapper">
          <h2>You may also like</h2>
          <div className="marquee">
            <div className="maylike-products-container track">
              {products?.map((item) => (
                <Product key={item._id} product={item} />
              ))}
            </div>
          </div>
      </div>
    </div>
  )
}

export const getStaticPaths = async () => {
  const query = `*[_type == "product"] {
    slug {
      current
    }
  }
  `;

  let products = [];
  try {
    products = await client.fetch(query);
  } catch (error) {
    // A Sanity outage must not fail the deploy: with fallback: 'blocking',
    // product pages are generated on first request instead.
    console.error('[product/[slug]] Failed to fetch paths:', error);
    return { paths: [], fallback: 'blocking' };
  }

  // Skip documents without a slug instead of crashing the build on them.
  const paths = (products || [])
    .filter((product) => product?.slug?.current)
    .map((product) => ({
      params: {
        slug: product.slug.current
      }
    }));

  return {
    paths,
    fallback: 'blocking'
  }
}

export const getStaticProps = async ({ params: { slug } }) => {
  // Parameterized query ($slug) — never interpolate route params into GROQ.
  const query = `*[_type == "product" && slug.current == $slug][0]`;
  const productsQuery = '*[_type == "product"]';

  const [product, products] = await Promise.all([
    client.fetch(query, { slug }),
    client.fetch(productsQuery),
  ]);

  // Unknown/deleted slug -> proper 404 instead of a 500 from
  // destructuring null in the component.
  if (!product) {
    return { notFound: true };
  }

  return {
    props: { products: products || [], product },
    // ISR: price/content edits in Sanity propagate without a redeploy.
    revalidate: 60,
  }
}

export default ProductDetails
