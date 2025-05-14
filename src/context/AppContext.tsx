import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Sale, Notification, User } from '../types';
import { generateId } from '../utils/formatters';
import mockData from '../data/mockData';

interface AppContextType {
  // State
  products: Product[];
  sales: Sale[];
  notifications: Notification[];
  currentUser: User | null;
  // Product methods
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  // Sale methods
  addSale: (sale: Omit<Sale, 'id' | 'date'>) => void;
  // Notification methods
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  // User methods
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (user: User) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state with mock data or from localStorage
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Load data from localStorage on component mount
  useEffect(() => {
    const loadData = () => {
      const storedProducts = localStorage.getItem('erp_products');
      const storedSales = localStorage.getItem('erp_sales');
      const storedNotifications = localStorage.getItem('erp_notifications');
      const storedUser = localStorage.getItem('erp_currentUser');

      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      } else {
        setProducts(mockData.products);
        localStorage.setItem('erp_products', JSON.stringify(mockData.products));
      }

      if (storedSales) {
        setSales(JSON.parse(storedSales));
      } else {
        setSales(mockData.sales);
        localStorage.setItem('erp_sales', JSON.stringify(mockData.sales));
      }

      if (storedNotifications) {
        setNotifications(JSON.parse(storedNotifications));
      } else {
        setNotifications(mockData.notifications);
        localStorage.setItem('erp_notifications', JSON.stringify(mockData.notifications));
      }

      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    };

    loadData();
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('erp_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('erp_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('erp_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('erp_currentUser', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...productData,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setProducts([...products, newProduct]);
  };

  const updateProduct = (updatedProduct: Product) => {
    const updated = products.map((product) =>
      product.id === updatedProduct.id
        ? { ...updatedProduct, updatedAt: new Date() }
        : product
    );
    setProducts(updated);
  };

  const deleteProduct = (id: string) => {
    setProducts(products.filter((product) => product.id !== id));
  };

  const addSale = (saleData: Omit<Sale, 'id' | 'date'>) => {
    const newSale: Sale = {
      ...saleData,
      id: generateId(),
      date: new Date(),
    };
    setSales([...sales, newSale]);

    const updatedProducts = [...products];
    saleData.products.forEach((item) => {
      const productIndex = updatedProducts.findIndex((p) => p.id === item.productId);
      if (productIndex !== -1) {
        const product = updatedProducts[productIndex];
        const newQuantity = product.quantity - item.quantity;
        updatedProducts[productIndex] = {
          ...product,
          quantity: newQuantity,
          updatedAt: new Date(),
        };

        if (newQuantity <= product.threshold && newQuantity > 0) {
          const notification: Notification = {
            id: generateId(),
            title: 'Low Stock Alert',
            message: `${product.name} is running low on stock (${newQuantity} remaining)`,
            type: 'warning',
            read: false,
            date: new Date(),
          };
          setNotifications([notification, ...notifications]);
        } else if (newQuantity <= 0) {
          const notification: Notification = {
            id: generateId(),
            title: 'Out of Stock Alert',
            message: `${product.name} is now out of stock!`,
            type: 'error',
            read: false,
            date: new Date(),
          };
          setNotifications([notification, ...notifications]);
        }
      }
    });
    
    setProducts(updatedProducts);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    const user = mockData.users.find(
      (u) => u.email === email && password === 'password'
    );
    
    if (user) {
      setCurrentUser(user);
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('erp_currentUser');
  };

  const updateUser = async (user: User): Promise<void> => {
    if (currentUser && user.id === currentUser.id) {
      setCurrentUser(user);
    }
  };

  return (
    <AppContext.Provider
      value={{
        products,
        sales,
        notifications,
        currentUser,
        addProduct,
        updateProduct,
        deleteProduct,
        addSale,
        markNotificationAsRead,
        clearNotifications,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};