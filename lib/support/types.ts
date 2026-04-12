export type TicketStatus = "open" | "in_progress" | "closed";

export type SupportTicketRow = {
  id: number;
  user_id: number;
  subject: string;
  body: string;
  status: TicketStatus;
  created_at: Date;
  updated_at: Date | null;
};
