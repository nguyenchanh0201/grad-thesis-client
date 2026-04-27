export type TicketStatus = "confirmed" | "pending" | "used" | "cancelled";

export type TicketLineItem = {
  label: string;
  quantity: number;
  unitPrice: number;
};

export type MyTicket = {
  id: string;
  invoiceId: string;
  event: {
    title: string;
    image: string;
    genre: string;
    date: string; // "May 15, 2026"
    time: string; // "19:00"
    venue: string;
    city: string;
    slug: string;
    eventDate: string; // ISO "2026-05-15" — used for upcoming/past classification
  };
  lineItems: TicketLineItem[];
  totalAmount: number;
  status: TicketStatus;
  purchasedAt: string;
};
