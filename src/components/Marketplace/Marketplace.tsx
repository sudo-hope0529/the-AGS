import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { loadStripe } from '@stripe/stripe-js';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  rating: number;
  purchases: number;
  preview_url?: string;
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export const Marketplace: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'price'>('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [selectedCategory, sortBy, searchQuery]);

  const fetchProducts = async () => {
    let query = supabase
      .from('marketplace_products')
      .select(`
        *,
        author:user_id (
          id,
          full_name,
          avatar_url
        )
      `);

    // Apply filters
    if (selectedCategory !== 'all') {
      query = query.eq('category', selectedCategory);
    }

    if (searchQuery) {
      query = query.ilike('title', `%${searchQuery}%`);
    }

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        query = query.order('purchases', { ascending: false });
        break;
      case 'recent':
        query = query.order('created_at', { ascending: false });
        break;
      case 'price':
        query = query.order('price', { ascending: true });
        break;
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return;
    }

    setProducts(data);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('marketplace_categories')
      .select('name');

    if (error) {
      console.error('Error fetching categories:', error);
      return;
    }

    setCategories(data.map(category => category.name));
  };

  const handlePurchase = async (product: Product) => {
    try {
      // Create Stripe checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          price: product.price,
        }),
      });

      const session = await response.json();

      // Redirect to Stripe checkout
      const stripe = await stripePromise;
      const { error } = await stripe!.redirectToCheckout({
        sessionId: session.id,
      });

      if (error) {
        console.error('Error redirecting to checkout:', error);
      }
    } catch (error) {
      console.error('Error processing purchase:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          {/* Search */}
          <div className="flex-1 max-w-lg">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 rounded-lg border"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 rounded-lg border"
          >
            <option value="popular">Most Popular</option>
            <option value="recent">Recently Added</option>
            <option value="price">Price: Low to High</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow overflow-hidden"
              >
                {/* Product Image/Preview */}
                {product.preview_url && (
                  <div className="aspect-w-16 aspect-h-9">
                    <img
                      src={product.preview_url}
                      alt={product.title}
                      className="object-cover"
                    />
                  </div>
                )}

                {/* Product Info */}
                <div className="p-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <img
                      src={product.author.avatar}
                      alt={product.author.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="text-sm text-gray-600">
                      {product.author.name}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold mb-2">{product.title}</h3>
                  <p className="text-gray-600 mb-4">{product.description}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      ${product.price.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handlePurchase(product)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Purchase
                    </button>
                  </div>

                  <div className="flex items-center mt-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      ⭐ {product.rating.toFixed(1)}
                    </span>
                    <span className="mx-2">•</span>
                    <span>{product.purchases} purchases</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
