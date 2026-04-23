import {
  LayoutGrid,
  CreditCard,
  BarChart3,
  Gift,
  Orbit,
  CalendarDays,
  Share2,
  Droplets,
  UserSearch,
  Coins,
  Settings,
} from "lucide-react";

export const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutGrid,
  },
  {
    label: "Prospect",
    icon: UserSearch,
    children: [
      { label: "Prospect Dashboard", href: "/admin/prospect" },
      { label: "Manage Prospect", href: "/admin/prospect/manage" },

    ],
  },
  {
    label: "Orbiters",
    icon: Orbit,
    children: [
      { label: "Orbiter Dashboard", href: "/admin/orbiters/" },
      { label: "Orbiter List", href: "/admin/orbiters/list/" },
    
    ],
  },
  {
    label: "Referral",
    icon: Share2,
    children: [
      { label: "Referral Dashboard", href: "/admin/referral" },
      { label: "Manage Referral", href: "/admin/referral/manage" },
    
    ],
  },
  
  {
    label: "Monthly Meeting",
    icon: CalendarDays,
    children: [
      { label: "Dashboard", href: "/admin/monthlymeeting" },
      { label: "Meeting List", href: "/admin/monthlymeeting/list" },
    
    ],
  },
  {
    label: "Conclave Meeting",
    icon: CalendarDays,
    children: [
      { label: "Dashboard", href: "/admin/conclave" },
      { label: "Meeting List", href: "/admin/conclave/list" },
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
    label: "Contribution Points",
    icon: Coins,
    children: [
      { label: "CP Members", href: "/admin/contribution-points" },
      { label: "Add Activity Entry", href: "/admin/contribution-points/add" },
      { label: "Import Activity", href: "/admin/contribution-points/activity" },
      { label: "Manage Activity", href: "/admin/contribution-points/manage" },
    ],
  },
  {
    label: "Redeem",
    icon: CreditCard,
    children: [
      { label: "Add Redeem Deal", href: "/admin/redeem/add" },
      { label: "Manage Redeem", href: "/admin/redeem/manage" },
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
  {
    label: "Settings",
    icon: Settings,
    children: [
      { label: "Manage User", href: "/admin/settings/users" },
      { label: "Manage Role", href: "/admin/settings/roles" },
    ],
  },
];
