
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  AFFILIATE_PRO = 'AFFILIATE_PRO',
  AFFILIATE_EXEC = 'AFFILIATE_EXEC'
}

export enum MascotState {
  IDLE = 'idle',
  THINKING = 'thinking',
  SPEAKING = 'speaking',
  LISTENING = 'listening'
}

export interface ProductOption {
  rank: number;
  rotulo: string;
  nome: string;
  porque: string;
  observacoes: string;
  link_afiliado: string;
  link_tipo: 'dp' | 'search';
  link_confidence: 'high' | 'medium' | 'low';
  preco?: string;
}

export interface AIResponse {
  mode: string;
  pedido_do_cliente: string;
  entendimento: string;
  perguntas: string[];
  results: ProductOption[];
  speech: string;
  emotion: 'neutral' | 'happy' | 'attentive' | 'thinking';
  ui_hints: {
    avatar_state: MascotState;
    allow_interrupt: boolean;
    show_bell: boolean;
    show_dismiss: boolean;
  };
}

export interface AffiliateIDs {
  amazon?: string;
  mercadolivre?: string;
  shopee?: string;
  ebay?: string;
}

export interface UserSubscription {
  activePlan: UserRole;
  isPaid: boolean;
}
