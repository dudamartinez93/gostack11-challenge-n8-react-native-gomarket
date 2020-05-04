import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const asyncStorageProducts = await AsyncStorage.getItem(
        '@GoMarket:products',
      );
      if (asyncStorageProducts) {
        setProducts(JSON.parse(asyncStorageProducts));
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function updateProducts(): Promise<void> {
      await AsyncStorage.setItem(
        '@GoMarket:products',
        JSON.stringify(products),
      );
    }

    updateProducts();
  }, [products]);

  const increment = useCallback(
    async id => {
      const newProductsArray = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      );
      setProducts(newProductsArray);
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productIndex = products.findIndex(
        storedProduct => storedProduct.id === product.id,
      );
      if (productIndex >= 0) {
        increment(product.id);
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }
    },
    [increment, products],
  );

  const decrement = useCallback(
    async id => {
      const filteredProductsArray = products.filter(
        product => !(product.id === id && product.quantity === 1),
      );

      const newProductsArray = filteredProductsArray.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity - 1 }
          : product,
      );
      setProducts(newProductsArray);
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
