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
    // try {
    //   const updatedCart = [...cart];
    //   const productExists = updatedCart.find(product => product.id === productId);

    //   const stock = await api.get(`/stock/${productId}`);

    //   const stockAmount = stock.data.amount;
    //   const currentAmount = productExists ? productExists.amount : 0;
    //   const amount = currentAmount + 1;

    //   if (amount > stockAmount) {
    //     toast.error('Quantidade solicitada fora de estoque');
    //     return;
    //   }

    //   if (productExists) {
    //     productExists.amount = amount;
    //   } else {
    //     const product = await api.get(`/products/${productId}`);

    //     const newProduct = {
    //       ...product.data,
    //       amount: 1
    //     }
    //     updatedCart.push(newProduct);

    //     setCart(updatedCart);
    //     localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    //   }
    // } catch {
    //   toast.error('Erro na adição do produto');
    // }
    try {
      const productFromCart = cart.find(product => product.id === productId);

      // verifica se produto já existe no carrinho de compras
      if (productFromCart !== undefined) {
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

        let newCart = [...cart, newProduct];
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
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      setCart(newCart);
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const productStockFromDatabase = (await api.get(`/stock/${productId}`)).data;
      // verifica se a quantidade desejada é menor que 1
      if (amount < 1)
        return;

      // verifica se NÃO existe estoque o suficiente para adicionar o produto ao carrinho
      if (!(productStockFromDatabase.amount >= amount)) {
        throw new Error("OUT_OF_STOCK");
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

    } catch (err) {
      if (err.message === "OUT_OF_STOCK")
        toast.error("Quantidade solicitada fora de estoque");
      else
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
