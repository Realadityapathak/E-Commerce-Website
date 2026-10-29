# 🛒 Modern Full Stack eCommerce Application

<div align="center">
  <img src="https://user-images.githubusercontent.com/70088342/160780701-7bb38a57-76bd-49a2-a4ec-49f89c50a7c7.png" alt="eCommerce Application" width="800"/>
  
  **A modern, full-stack e-commerce solution built with Next.js, Sanity, and Stripe**
  
  [![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Stripe](https://img.shields.io/badge/Stripe-626CD9?style=for-the-badge&logo=Stripe&logoColor=white)](https://stripe.com/)
  [![Sanity](https://img.shields.io/badge/Sanity-F03E2F?style=for-the-badge&logo=sanity&logoColor=white)](https://www.sanity.io/)
  
  [🚀 Live Demo](https://e-commerce-website-zeta-livid.vercel.app/) • [📱 Sanity Studio](#) • [📖 Documentation](#)
</div>

---

## 📋 Table of Contents

- [About The Project](#about-the-project)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Screenshots](#screenshots)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## 🎯 About The Project

This is a **fully responsive, modern, full-stack e-commerce application** that combines cutting-edge technologies to deliver an exceptional shopping experience. Built with performance and scalability in mind, it features a clean, modern design with smooth animations and a fully functional shopping cart system.

### What Makes It Special?

- **🔒 Secure Payment Processing**: Complete Stripe integration for handling transactions, products, prices, and shipping
- **📝 Dynamic Content Management**: Powered by Sanity CMS for real-time inventory and content updates
- **🚀 Optimized Performance**: Leveraging Next.js SSR and SSG for lightning-fast page loads
- **📱 Mobile-First Design**: Seamless experience across all devices and screen sizes
- **🛍️ Advanced Cart Features**: Persistent cart with real-time quantity adjustments

## ✨ Key Features

<table>
<tr>
<td width="50%">

### 💳 **Payment & Commerce**
- ✅ Stripe Checkout integration
- ✅ Secure payment processing
- ✅ Order management system
- ✅ Real-time inventory tracking

</td>
<td width="50%">

### 🎨 **User Experience**
- ✅ Responsive design
- ✅ Modern animations
- ✅ Fast page transitions
- ✅ Intuitive navigation

</td>
</tr>
<tr>
<td width="50%">

### 🛒 **Shopping Features**
- ✅ Advanced shopping cart
- ✅ Product search & filtering
- ✅ Wishlist functionality
- ✅ Guest checkout option

</td>
<td width="50%">

### ⚡ **Performance**
- ✅ Server-Side Rendering (SSR)
- ✅ Static Site Generation (SSG)
- ✅ Image optimization
- ✅ SEO optimized

</td>
</tr>
</table>

## 🛠️ Tech Stack

<div align="center">

| Category | Technologies |
|----------|-------------|
| **Frontend** | ![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white) ![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB) |
| **State Management** | ![Context API](https://img.shields.io/badge/Context_API-20232A?style=flat-square&logo=react&logoColor=61DAFB) |
| **CMS** | ![Sanity](https://img.shields.io/badge/Sanity-F03E2F?style=flat-square&logo=sanity&logoColor=white) |
| **Payments** | ![Stripe](https://img.shields.io/badge/Stripe-626CD9?style=flat-square&logo=Stripe&logoColor=white) |
| **Styling** | ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white) |
| **Runtime** | ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat-square&logo=node.js&logoColor=white) |

</div>

## 📸 Screenshots

<div align="center">
  
### 🏠 Homepage
<img src="https://user-images.githubusercontent.com/70088342/160780206-9cfe7c0a-3d8e-4a20-a055-b12efebe6c30.png" alt="Homepage" width="600"/>

### 📦 Product Catalog
<img src="https://user-images.githubusercontent.com/70088342/160780265-692d37ac-7209-4d53-957a-e94b37d123c0.png" alt="Product Catalog" width="600"/>

### 📱 Product Details
<img src="https://user-images.githubusercontent.com/70088342/160780381-7c947640-422e-4729-abae-21911e9bc716.png" alt="Product Details" width="600"/>

### 🛒 Shopping Cart
<img src="https://user-images.githubusercontent.com/70088342/160780549-111ed048-cd4b-4740-b2fd-2c6fc3520c52.png" alt="Shopping Cart" width="600"/>

### 💳 Checkout Process
<img src="https://user-images.githubusercontent.com/70088342/160780884-22d6025e-9b7d-4493-8136-b3dfbf00a32f.png" alt="Checkout" width="600"/>

</div>

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v16.x or higher
- **npm** or **yarn** package manager
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/realadityapathak/E-Commerce-Website.git
   cd E-Commerce-Website
   ```

2. **Install main application dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Install Sanity Studio dependencies**
   ```bash
   cd sanity_ecommerce
   npm install --legacy-peer-deps
   cd ..
   ```

### Environment Setup

1. **Create environment file**
   ```bash
   touch .env.local
   ```

2. **Add your environment variables**
   ```env
   # Stripe Configuration
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   
   # Sanity Configuration
   NEXT_PUBLIC_SANITY_PROJECT_ID=your_sanity_project_id
   NEXT_PUBLIC_SANITY_TOKEN=your_sanity_read_token
   ```

3. **Get your API keys**
   
   **For Stripe:**
   - Visit [Stripe Dashboard](https://dashboard.stripe.com/)
   - Navigate to Developers → API Keys
   - Copy your publishable and secret keys
   
   **For Sanity:**
   - Visit [Sanity Management](https://manage.sanity.io/)
   - Create a new project or use existing one
   - Get your project ID and create a read token

## 🎯 Usage

### Development Mode

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

### Sanity Studio

To manage your content:

```bash
cd sanity_ecommerce
npm run start
```

Open [http://localhost:3333](http://localhost:3333) to access Sanity Studio.

## 📁 Project Structure

```
E-Commerce-Website/
├── 📁 components/          # Reusable UI components
├── 📁 pages/              # Next.js pages
├── 📁 styles/             # CSS stylesheets
├── 📁 lib/                # Utility functions
├── 📁 context/            # React Context providers
├── 📁 sanity_ecommerce/   # Sanity CMS configuration
├── 📁 public/             # Static assets
├── 📄 .env.local          # Environment variables
├── 📄 next.config.js      # Next.js configuration
└── 📄 package.json        # Dependencies and scripts
```

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Contact

**Aditya Pathak** - [@realadityapathak](https://github.com/realadityapathak)

Project Link: [https://github.com/realadityapathak/E-Commerce-Website](https://github.com/realadityapathak/E-Commerce-Website)

---

<div align="center">
  
### 🌟 Show your support

Give a ⭐️ if this project helped you!

**Made with ❤️ by [Aditya Pathak](https://github.com/realadityapathak)**

</div>
