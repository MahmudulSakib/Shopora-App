import {
  GalleryHorizontalEnd,
  Store,
  GalleryHorizontal,
  ClipboardX,
  ShoppingBag,
  Users,
  MessageCircleMore,
  Eye,
  ChartNoAxesCombined,
  ShieldCheck,
  LogOut,
} from "lucide-react";

const items = [
  {
    title: "Carousel",
    url: "/carousel",
    icon: GalleryHorizontalEnd,
  },
  {
    title: "Add Products",
    url: "/add-products",
    icon: Store,
  },
  {
    title: "Products Carousel",
    url: "/products-carousel",
    icon: GalleryHorizontal,
  },
  {
    title: "Products Card",
    url: "/products-card",
    icon: ClipboardX,
  },
  {
    title: "Order Details",
    url: "/order-details",
    icon: ShoppingBag,
  },
  {
    title: "Chat Box",
    url: "/adminpanelchat",
    icon: MessageCircleMore,
  },
  {
    title: "Review Controller",
    url: "/review-control",
    icon: Eye,
  },
  {
    title: "Statics",
    url: "#",
    icon: ChartNoAxesCombined,
  },
  {
    title: "Privacy",
    url: "#",
    icon: ShieldCheck,
  },
  {
    title: "Log Out",
    url: "/log-out",
    icon: LogOut,
  },
];

export default items;
