<script>
  // @ts-nocheck
  /**
   * HI-FI Lucide icons (lucide-svelte). Prefer this over inline shims.
   * Package note: lucide-svelte@0.469 is deprecated upstream for @lucide/svelte;
   * keep until Svelte 5 upgrade.
   */
  import Search from "lucide-svelte/icons/search";
  import Calendar from "lucide-svelte/icons/calendar";
  import Users from "lucide-svelte/icons/users";
  import ShieldCheck from "lucide-svelte/icons/shield-check";
  import Smartphone from "lucide-svelte/icons/smartphone";
  import QrCode from "lucide-svelte/icons/qr-code";
  import Wallet from "lucide-svelte/icons/wallet";
  import Store from "lucide-svelte/icons/store";
  import Ticket from "lucide-svelte/icons/ticket";
  import User from "lucide-svelte/icons/user";
  import MapPin from "lucide-svelte/icons/map-pin";
  import ArrowRight from "lucide-svelte/icons/arrow-right";
  import LayoutGrid from "lucide-svelte/icons/layout-grid";
  import UserPlus from "lucide-svelte/icons/user-plus";
  import Settings from "lucide-svelte/icons/settings";
  import CircleHelp from "lucide-svelte/icons/circle-help";
  import Menu from "lucide-svelte/icons/menu";
  import X from "lucide-svelte/icons/x";
  import ChevronRight from "lucide-svelte/icons/chevron-right";
  import DoorOpen from "lucide-svelte/icons/door-open";
  import Lock from "lucide-svelte/icons/lock";

  export let name = "search";
  export let size = 20;
  export let color = "currentColor";
  export let strokeWidth = 2;

  const map = {
    search: Search,
    calendar: Calendar,
    users: Users,
    "shield-check": ShieldCheck,
    smartphone: Smartphone,
    "qr-code": QrCode,
    wallet: Wallet,
    store: Store,
    ticket: Ticket,
    user: User,
    "map-pin": MapPin,
    "arrow-right": ArrowRight,
    "layout-grid": LayoutGrid,
    "user-plus": UserPlus,
    settings: Settings,
    "circle-help": CircleHelp,
    menu: Menu,
    x: X,
    "chevron-right": ChevronRight,
    "door-open": DoorOpen,
    lock: Lock,
  };

  $: Icon = map[name] || Search;
</script>

<svelte:component this={Icon} {size} {color} {strokeWidth} aria-hidden="true" />
