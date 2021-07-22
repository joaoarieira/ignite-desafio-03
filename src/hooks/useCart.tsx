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
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productFromCart = cart.find(product => product.id === productId);

      // verifica se produto já existe no carrinho de compras
      if (productFromCart !== undefined) {
        const newProduct = {
          productId: productFromCart.id,
          amount: productFromCart.amount + 1
        }
        updateProductAmount(newProduct);
        // console.log("product", product);
        // console.log("newProduct", newProduct);
      } else {
        // caso não exista, procurar pelas informações no banco de dados
        const productFromDatabase = (await api.get(`/products/${productId}`)).data;

        const newProduct = {
          ...productFromDatabase,
          amount: 1
        }

        let newCart = [...cart, newProduct];
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        setCart(newCart);
        // console.log("product", product);
        // console.log("newProduct", newProduct);
        // console.log("newCart", newCart);
      }

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
      const productStockFromDatabase = (await api.get(`/stock/${productId}`)).data;

      // verifica se NÃO existe estoque o suficiente para adicionar o produto ao carrinho
      if (!(productStockFromDatabase.amount >= amount)) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      // caso tenha estoque o suficiente, atualizar o carrinho
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart.map(product => {
        if (product.id === productId)
          return {
            ...product,
            amount: amount
          }
        return product;
      })));

      setCart(JSON.parse(localStorage.getItem('@RocketShoes:cart') as string));


    } catch {
      alert("CATCH");
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
