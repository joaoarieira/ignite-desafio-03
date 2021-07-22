import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const test = [
      {
        id: 1,
        title: "Prod1",
        price: 1.99,
        image: "https://rocketseat-cdn.s3-sa-east-1.amazonaws.com/modulo-redux/tenis1.jpg",
        amount: 1
      },
      {
        id: 2,
        title: "Prod2",
        price: 2.99,
        image: "https://rocketseat-cdn.s3-sa-east-1.amazonaws.com/modulo-redux/tenis2.jpg",
        amount: 2
      }
    ];
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    //return [];
    return test;
  });

  const addProduct = async (productId: number) => {
    try {
      const response_stock_data = (await api.get(`/stock/${productId}`)).data;
      const product_amount = response_stock_data.amount;

      const response_products_data = (await api.get(`/products/${productId}`)).data;
      const product = response_products_data;

      const newProduct = {
        ...product,
        amount: 1
      }

      // console.log("product", product);
      // console.log("product_amount", product_amount);
      // console.log("newProduct", newProduct);
      // console.log("cart", cart);

      let newCart = [...cart, newProduct];

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      setCart(newCart);



    } catch (error) {
      toast.error(error.message);
    };
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
