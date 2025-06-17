import {
  UserPen,
  ShoppingBag,
  Truck,
  LogOut,
  ShoppingCart,
} from "lucide-react";

export const items = [
  {
    title: "Profile Information",
    url: "/user-profile",
    icon: UserPen,
  },
  {
    title: "Your Cart",
    url: "/public-cart",
    icon: ShoppingCart,
  },
  {
    title: "Your Orders",
    url: "/user-orders",
    icon: ShoppingBag,
  },
  {
    title: "Log Out",
    url: "/log-out",
    icon: LogOut,
  },
];
