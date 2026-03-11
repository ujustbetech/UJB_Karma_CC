import {
  LayoutGrid,
  Users,
  CreditCard,
  BarChart3,
  Gift,
  Orbit,
  CalendarDays,
  Share2,
  Droplets,
  UserSearch
} from "lucide-react";

export const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutGrid,
  },

  {
    label: "Users",
    icon: Users,
    children: [
      { label: "All Users", href: "/admin/users/add" },
      { label: "Roles", href: "/admin/users/roles" },
    ],
  },

  {
    label: "Orbiters",
    icon: Orbit,
    children: [
      { label: "Orbiter Dashboard", href: "/admin/orbiters/" },
      { label: "Orbiter List", href: "/admin/orbiters/list/" },
      { label: "Add Orbiter", href: "/admin/orbiters/add" },
    ],
  },

  {
    label: "Referral",
    icon: Share2,
    children: [
      { label: "Referral Dashboard", href: "/admin/referral" },
      { label: "Manage Referral", href: "/admin/referral/manage" },
      { label: "Add Referral", href: "/admin/referral/add" },
    ],
  },
{
  label: "Prospect",
  icon: UserSearch,
  children: [
    { label: "Prospect Dashboard", href: "/admin/prospect" },
    { label: "Manage Prospect", href: "/admin/prospect/manage" },
    { label: "Add Prospect", href: "/admin/prospect/add" },
  ],
},
  // ⭐ Monthly Meeting Section
  {
    label: "Monthly Meeting",
    icon: CalendarDays,
    children: [
      { label: "Dashboard", href: "/admin/monthlymeeting" },
      { label: "Meeting List", href: "/admin/monthlymeeting/list" },
      { label: "Add Meeting", href: "/admin/monthlymeeting/add" },
    ],
  },

  {
    label: "Birthdays",
    icon: Gift,
    children: [
      { label: "Dashboard", href: "/admin/birthday" },
      { label: "Birthday List", href: "/admin/birthday/list" },
      { label: "Add Birthday Canva", href: "/admin/birthday/add" },
    ],
  },
  {
    label: "Dewdrop",
    icon: Droplets,
    children: [
      { label: "Dashboard", href: "/admin/dewdrop" },
      { label: "Manage Content", href: "/admin/dewdrop/manage" },
      { label: "Add Content", href: "/admin/dewdrop/add" },
      { label: "Categories", href: "/admin/dewdrop/category" },
    ],
  },

  {
    label: "Accounts",
    icon: CreditCard,
    children: [
      { label: "Invoices", href: "/admin/accounts/invoices" },
      { label: "Payments", href: "/admin/accounts/payments" },
    ],
  },

  {
    label: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
  },
];
