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
    url: "/add",
    icon: Store,
  },
  {
    title: "Products Carousel",
    url: "#",
    icon: GalleryHorizontal,
  },
  {
    title: "Products Card",
    url: "#",
    icon: ClipboardX,
  },
  {
    title: "Order Details",
    url: "#",
    icon: ShoppingBag,
  },
  {
    title: "User Details",
    url: "#",
    icon: Users,
  },
  {
    title: "Chat Box",
    url: "#",
    icon: MessageCircleMore,
  },
  {
    title: "Review Controller",
    url: "#",
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
