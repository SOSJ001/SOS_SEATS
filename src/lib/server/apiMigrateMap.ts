/**
 * Rebuild *Api → /api migrate map (roadmap 0.6).
 * Authoritative from/to list. Do not put secrets here.
 */

export type MigrateStatus =
  | "alias"
  | "already"
  | "skip"
  | "delete_candidate";

export type MigrateRow = {
  from: string;
  to: string | null;
  methods: string[];
  status: MigrateStatus;
  note?: string;
};

export const apiMigrateMap: MigrateRow[] = [
  {
    from: "/loginApi",
    to: "/api/auth/login",
    methods: ["POST"],
    status: "alias",
  },
  {
    from: "/logoutApi",
    to: "/api/auth/logout",
    methods: ["POST"],
    status: "alias",
  },
  {
    from: "/loadUserEventsApi",
    to: "/api/events",
    methods: ["GET"],
    status: "alias",
  },
  {
    from: "/createEventApi",
    to: "/api/events",
    methods: ["POST"],
    status: "alias",
  },
  {
    from: "/updateEventApi/[eventId]",
    to: "/api/events/[eventId]",
    methods: ["PUT"],
    status: "alias",
  },
  {
    from: "/api/monime/**",
    to: "/api/monime/**",
    methods: ["GET", "POST", "DELETE"],
    status: "already",
  },
  {
    from: "/api/wallet/**",
    to: "/api/wallet/**",
    methods: ["POST"],
    status: "already",
  },
  {
    from: "/web3LoginApi",
    to: null,
    methods: ["POST"],
    status: "skip",
    note: "2.6 Solana / web3 deferred; leave root (supabase.js callers)",
  },
  {
    from: "/web3LogoutApi",
    to: null,
    methods: ["POST"],
    status: "skip",
    note: "2.6 Solana / web3 deferred; leave root (supabase.js callers)",
  },
  {
    from: "/web3VerifyApi",
    to: null,
    methods: ["GET"],
    status: "skip",
    note: "2.6 Solana / web3 deferred; leave root (supabase.js callers)",
  },
  {
    from: "/createWalletApi",
    to: null,
    methods: ["POST"],
    status: "skip",
    note: "Solana",
  },
  {
    from: "/transferSolApi",
    to: null,
    methods: ["POST"],
    status: "skip",
    note: "Solana",
  },
  {
    from: "/dataUrlApi",
    to: null,
    methods: ["POST"],
    status: "skip",
    note: "Orphan; no callers",
  },
  {
    from: "/publishEventApi",
    to: null,
    methods: [],
    status: "delete_candidate",
    note: "Empty stub; leave file in 0.6",
  },
];
