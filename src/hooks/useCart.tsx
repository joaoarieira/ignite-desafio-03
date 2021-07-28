import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

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
      const newCart = [...cart];
      const productFromCart = newCart.find(product => product.id === productId);

      // verifica se produto já existe no carrinho de compras
      if (productFromCart) {
        const newProduct = {
          productId: productFromCart.id,
          amount: productFromCart.amount + 1
        }
        updateProductAmount(newProduct);
      } else {
        // caso não exista, procurar pelas informações no banco de dados
        const productFromDatabase = (await api.get(`/products/${productId}`)).data;

        const newProduct = {
          ...productFromDatabase,
          amount: 1
        }

        newCart.push(newProduct);
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }

    } catch {
      toast.error("Erro na adição do produto");
    };
  };

  const removeProduct = (productId: number) => {
    try {
      var newCart = [...cart];
      const productIndex = newCart.findIndex(product => product.id === productId);

      if (productIndex < 0)
        throw Error();

      newCart.splice(productIndex, 1);
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // verifica se a quantidade desejada é menor que 1
      if (amount < 1)
        return;

      const productStockFromDatabase = (await api.get(`/stock/${productId}`)).data;

      // verifica se NÃO existe estoque o suficiente para adicionar o produto ao carrinho
      if (!(productStockFromDatabase.amount >= amount)) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      // caso tenha estoque o suficiente, atualizar o carrinho
      const newCart = [...cart];
      const productFromCart = newCart.find(product => product.id === productId);

      if (!productFromCart)
        throw new Error();

      productFromCart.amount = amount;
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch (err) {
      toast.error("Erro na alteração de quantidade do produto");
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
