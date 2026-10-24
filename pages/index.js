import React from 'react';

import { client } from '../lib/client';
import { Product, FooterBanner, HeroBanner } from '../components';

const Home = ({ products, bannerData }) => (
  <div>
    <HeroBanner heroBanner={bannerData?.[0] ?? null} />
    <div className="products-heading">
      <h2>Best Seller Products</h2>
      <p>speaker There are many variations passages</p>
    </div>

    <div className="products-container">
      {products?.map((product) => <Product key={product._id} product={product} />)}
    </div>

    <FooterBanner footerBanner={bannerData?.[0] ?? null} />
  </div>
);

// The catalog changes rarely, so serve it statically with ISR instead of
// hitting Sanity on every request (previous getServerSideProps). Pages
// revalidate in the background; a Sanity outage serves the last good page
// or an empty catalog briefly instead of a 500.
export const getStaticProps = async () => {
  try {
    const [products, bannerData] = await Promise.all([
      client.fetch('*[_type == "product"]'),
      client.fetch('*[_type == "banner"]'),
    ]);

    return {
      props: {
        products: products || [],
        bannerData: bannerData || [],
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error('[pages/index] Failed to fetch catalog:', error);
    return {
      props: { products: [], bannerData: [] },
      revalidate: 30,
    };
  }
};

export default Home;
